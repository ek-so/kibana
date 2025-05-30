/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { each } from 'lodash';
import { DEFAULT_SPACE_ID } from '@kbn/spaces-plugin/common';
import { EndpointError } from '../../../../common/endpoint/errors';
import { stringify } from '../../../endpoint/utils/stringify';
import type {
  RuleResponseEndpointAction,
  ProcessesParams,
} from '../../../../common/api/detection_engine';
import { getErrorProcessAlerts, getIsolateAlerts, getProcessAlerts } from './utils';
import type { AlertsAction, ResponseActionAlerts } from './types';
import type { EndpointAppContextService } from '../../../endpoint/endpoint_app_context_services';
import type {
  ResponseActionParametersWithEntityId,
  ResponseActionParametersWithPid,
} from '../../../../common/endpoint/types';

export const endpointResponseAction = async (
  responseAction: RuleResponseEndpointAction,
  endpointAppContextService: EndpointAppContextService,
  { alerts }: ResponseActionAlerts
): Promise<void> => {
  const logger = endpointAppContextService.createLogger(
    'ruleExecution',
    'automatedResponseActions'
  );
  const ruleId = alerts[0].kibana.alert?.rule.uuid;
  const ruleName = alerts[0].kibana.alert?.rule.name;
  const errors: string[] = [];
  let spaceId = (alerts[0].kibana.space_ids ?? [])[0];

  if (endpointAppContextService.experimentalFeatures.endpointManagementSpaceAwarenessEnabled) {
    if (!spaceId) {
      logger.error(
        new EndpointError(
          `Unable to identify the space ID from alert data ('kibana.space_ids') for rule [${ruleName}][${ruleId}]`
        )
      );
      return;
    }
  } else {
    // force the space to `default` when space awareness is not enabled
    spaceId = DEFAULT_SPACE_ID;
  }

  const logMsgPrefix = `Rule [${ruleName}][${ruleId}][${spaceId}]:`;
  const { comment, command } = responseAction.params;
  const responseActionsClient = endpointAppContextService.getInternalResponseActionsClient({
    agentType: 'endpoint',
    username: 'unknown',
    spaceId,
  });

  const automatedProcessActionsEnabled =
    endpointAppContextService.experimentalFeatures.automatedProcessActionsEnabled;

  const processResponseActionClientError = (err: Error, endpointIds: string[]): Promise<void> => {
    errors.push(
      `attempt to [${command}] host IDs [${endpointIds.join(', ')}] returned error: ${err.message}`
    );

    return Promise.resolve();
  };

  const response: Array<Promise<unknown>> = [];

  switch (command) {
    case 'isolate':
      response.push(
        Promise.all(
          Object.values(getIsolateAlerts(alerts)).map(
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ({ endpoint_ids, alert_ids, parameters, error, hosts }: AlertsAction) => {
              logger.info(
                `${logMsgPrefix} [${command}] [${endpoint_ids.length}] agent(s): ${stringify(
                  endpoint_ids
                )}`
              );

              return responseActionsClient
                .isolate(
                  {
                    endpoint_ids,
                    alert_ids,
                    parameters,
                    comment,
                  },
                  {
                    hosts,
                    ruleName,
                    ruleId,
                    error,
                  }
                )
                .catch((err) => {
                  return processResponseActionClientError(err, endpoint_ids);
                });
            }
          )
        )
      );

      break;

    case 'suspend-process':
    case 'kill-process':
      if (automatedProcessActionsEnabled) {
        const processesActionRuleConfig: ProcessesParams['config'] = (
          responseAction.params as ProcessesParams
        ).config;

        const createProcessActionFromAlerts = (
          actionAlerts: Record<string, Record<string, AlertsAction>>
        ) => {
          return each(actionAlerts, (actionPerAgent) => {
            return each(
              actionPerAgent,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              ({ endpoint_ids, alert_ids, parameters, error, hosts }: AlertsAction) => {
                logger.info(
                  `${logMsgPrefix} [${command}] [${endpoint_ids.length}] agent(s): ${stringify(
                    endpoint_ids
                  )}`
                );

                return responseActionsClient[
                  command === 'kill-process' ? 'killProcess' : 'suspendProcess'
                ](
                  {
                    comment,
                    endpoint_ids,
                    alert_ids,
                    parameters: parameters as
                      | ResponseActionParametersWithPid
                      | ResponseActionParametersWithEntityId,
                  },
                  {
                    hosts,
                    ruleId,
                    ruleName,
                    error,
                  }
                ).catch((err) => {
                  return processResponseActionClientError(err, endpoint_ids);
                });
              }
            );
          });
        };

        const foundFields = getProcessAlerts(alerts, processesActionRuleConfig);
        const notFoundField = getErrorProcessAlerts(alerts, processesActionRuleConfig);
        const processActions = createProcessActionFromAlerts(foundFields);
        const processActionsWithError = createProcessActionFromAlerts(notFoundField);

        response.push(Promise.all([processActions, processActionsWithError]));
      }

      break;

    default:
      errors.push(`response action [${command}] is not supported`);
  }

  return Promise.all(response)
    .then(() => {})
    .finally(() => {
      if (errors.length !== 0) {
        logger.error(
          `${logMsgPrefix} The following [${errors.length}] errors were encountered:\n${errors.join(
            '\n'
          )}`
        );
      }
    });
};
