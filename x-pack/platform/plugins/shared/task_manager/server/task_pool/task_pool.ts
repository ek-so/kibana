/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * This module contains the logic that ensures we don't run too many
 * tasks at once in a given Kibana instance.
 */
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import type { Duration } from 'moment';
import moment from 'moment';
import { padStart } from 'lodash';
import type { Logger } from '@kbn/core/server';
import type { TaskRunner } from '../task_running';
import { isTaskSavedObjectNotFoundError } from '../lib/is_task_not_found_error';
import type { TaskManagerStat } from '../task_events';
import type { ICapacity } from './types';
import { CLAIM_STRATEGY_MGET } from '../config';
import { WorkerCapacity } from './worker_capacity';
import { CostCapacity } from './cost_capacity';
import type { TaskTypeDictionary } from '../task_type_dictionary';

interface TaskPoolOpts {
  capacity$: Observable<number>;
  definitions: TaskTypeDictionary;
  logger: Logger;
  strategy: string;
}

export enum TaskPoolRunResult {
  // This mean we have no Run Result becuse no tasks were Ran in this cycle
  NoTaskWereRan = 'NoTaskWereRan',
  // This means we're running all the tasks we claimed
  RunningAllClaimedTasks = 'RunningAllClaimedTasks',
  // This means we're running all the tasks we claimed and we're at capacity
  RunningAtCapacity = 'RunningAtCapacity',
  // This means we're prematurely out of capacity and have accidentally claimed more tasks than we had capacity for
  RanOutOfCapacity = 'RanOutOfCapacity',
}

const VERSION_CONFLICT_MESSAGE = 'Task has been claimed by another Kibana service';

/**
 * Runs tasks in batches, taking costs into account.
 */
export class TaskPool {
  private tasksInPool = new Map<string, TaskRunner>();
  private logger: Logger;
  private load$ = new Subject<TaskManagerStat>();
  private definitions: TaskTypeDictionary;
  private capacityCalculator: ICapacity;

  /**
   * Creates an instance of TaskPool.
   *
   * @param {Opts} opts
   * @prop {number} capacity - The total capacity available
   *    (e.g. capacity is 4, then 2 tasks of cost 2 can run at a time, or 4 tasks of cost 1)
   * @prop {Logger} logger - The task manager logger.
   */
  constructor(opts: TaskPoolOpts) {
    this.logger = opts.logger;
    this.definitions = opts.definitions;

    switch (opts.strategy) {
      case CLAIM_STRATEGY_MGET:
        this.capacityCalculator = new CostCapacity({
          capacity$: opts.capacity$,
          logger: this.logger,
        });
        break;

      default:
        this.capacityCalculator = new WorkerCapacity({
          capacity$: opts.capacity$,
          logger: this.logger,
        });
    }
  }

  public get load(): Observable<TaskManagerStat> {
    return this.load$;
  }

  /**
   * Gets how much capacity is currently in use.
   */
  public get usedCapacity() {
    return this.capacityCalculator.usedCapacity(this.tasksInPool);
  }

  /**
   * Gets how much capacity is currently in use as a percentage
   */
  public get usedCapacityPercentage() {
    return this.capacityCalculator.usedCapacityPercentage(this.tasksInPool);
  }

  /**
   * Gets how much capacity is currently available.
   */
  public availableCapacity(taskType?: string) {
    // cancel expired task whenever a call is made to check for capacity
    // this ensures that we don't end up with a queue of hung tasks causing both
    // the poller and the pool from hanging due to lack of capacity
    this.cancelExpiredTasks();

    return this.capacityCalculator.availableCapacity(
      this.tasksInPool,
      taskType ? this.definitions.get(taskType) : null
    );
  }

  /**
   * Gets how much capacity is currently in use by each type.
   */
  public getUsedCapacityByType(type: string) {
    return this.capacityCalculator.getUsedCapacityByType([...this.tasksInPool.values()], type);
  }

  /**
   * Attempts to run the specified list of tasks. Returns true if it was able
   * to start every task in the list, false if there was not enough capacity
   * to run every task.
   *
   * @param {TaskRunner[]} tasks
   * @returns {Promise<boolean>}
   */
  public async run(tasks: TaskRunner[]): Promise<TaskPoolRunResult> {
    // Note `this.availableCapacity` has side effects, so we just want
    // to call it once for this bit of the code.
    const availableCapacity = this.availableCapacity();
    const [tasksToRun, leftOverTasks] = this.capacityCalculator.determineTasksToRunBasedOnCapacity(
      tasks,
      availableCapacity
    );

    if (tasksToRun.length) {
      await Promise.all(
        tasksToRun
          .filter(
            (taskRunner) =>
              !Array.from(this.tasksInPool.keys()).some((executionId: string) =>
                taskRunner.isSameTask(executionId)
              )
          )
          .map(async (taskRunner) => {
            // We use taskRunner.taskExecutionId instead of taskRunner.id as key for the task pool map because
            // task cancellation is a non-blocking procedure. We calculate the expiration and immediately remove
            // the task from the task pool. There is a race condition that can occur when a recurring tasks's schedule
            // matches its timeout value. A new instance of the task can be claimed and added to the task pool before
            // the cancel function (meant for the previous instance of the task) is actually called. This means the wrong
            // task instance is cancelled. We introduce the taskExecutionId to differentiate between these overlapping instances and
            // ensure that the correct task instance is cancelled.
            this.tasksInPool.set(taskRunner.taskExecutionId, taskRunner);
            return taskRunner
              .markTaskAsRunning()
              .then((hasTaskBeenMarkAsRunning: boolean) =>
                hasTaskBeenMarkAsRunning
                  ? this.handleMarkAsRunning(taskRunner)
                  : this.handleFailureOfMarkAsRunning(taskRunner, {
                      name: 'TaskPoolVersionConflictError',
                      message: VERSION_CONFLICT_MESSAGE,
                    })
              )
              .catch((err) => {
                this.handleFailureOfMarkAsRunning(taskRunner, err);
                throw err;
              });
          })
      );
    }

    if (leftOverTasks.length) {
      // leave any leftover tasks
      // they will be available for claiming in 30 seconds
      return TaskPoolRunResult.RanOutOfCapacity;
    } else if (!this.availableCapacity()) {
      return TaskPoolRunResult.RunningAtCapacity;
    }
    return TaskPoolRunResult.RunningAllClaimedTasks;
  }

  public cancelRunningTasks() {
    this.logger.debug('Cancelling running tasks.');
    for (const task of this.tasksInPool.values()) {
      this.cancelTask(task);
    }
  }

  private handleMarkAsRunning(taskRunner: TaskRunner) {
    taskRunner
      .run()
      .catch((err) => {
        // If a task Saved Object can't be found by an in flight task runner
        // we asssume the underlying task has been deleted while it was running
        // so we will log this as a debug, rather than a warn
        const errorLogLine = `Task ${taskRunner.toString()} failed in attempt to run: ${
          err.message || err.error.message
        }`;
        if (isTaskSavedObjectNotFoundError(err, taskRunner.id)) {
          this.logger.debug(errorLogLine);
        } else {
          this.logger.warn(errorLogLine);
        }
      })
      .then(() => {
        this.tasksInPool.delete(taskRunner.taskExecutionId);
      })
      .catch(() => {});
  }

  private handleFailureOfMarkAsRunning(task: TaskRunner, err: Error) {
    this.tasksInPool.delete(task.taskExecutionId);
    this.logger.error(`Failed to mark Task ${task.toString()} as running: ${err.message}`);
  }

  private cancelExpiredTasks() {
    for (const taskRunner of this.tasksInPool.values()) {
      if (taskRunner.isExpired) {
        this.logger.warn(
          `Cancelling task ${taskRunner.toString()} as it expired at ${taskRunner.expiration.toISOString()}${
            taskRunner.startedAt
              ? ` after running for ${durationAsString(
                  moment.duration(moment(new Date()).utc().diff(taskRunner.startedAt))
                )}`
              : ``
          }${
            taskRunner.definition?.timeout
              ? ` (with timeout set at ${taskRunner.definition.timeout})`
              : ``
          }.`
        );
        this.cancelTask(taskRunner);
      }
    }
  }

  private cancelTask(task: TaskRunner) {
    // internally async (without rejections), but public-facing is synchronous
    (async () => {
      try {
        this.logger.debug(`Cancelling task ${task.toString()}.`);
        this.tasksInPool.delete(task.taskExecutionId);
        await task.cancel();
      } catch (err) {
        this.logger.error(`Failed to cancel task ${task.toString()}: ${err}`);
      }
    })().catch(() => {});
  }
}

function durationAsString(duration: Duration): string {
  const [m, s] = [duration.minutes(), duration.seconds()].map((value) =>
    padStart(`${value}`, 2, '0')
  );
  return `${m}m ${s}s`;
}
