/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getRuleReducer } from './rule_reducer';
import { ActionTypeModel, Rule } from '../../../types';
import { SanitizedRuleAction } from '@kbn/alerting-plugin/common';
import { actionTypeRegistryMock } from '../../action_type_registry.mock';

const actionTypeRegistry = actionTypeRegistryMock.create();
const actionType = {
  id: 'test',
  name: 'Test',
  isSystemActionType: false,
} as unknown as ActionTypeModel;
actionTypeRegistry.get.mockReturnValue(actionType);
describe('rule reducer', () => {
  const ruleReducer = getRuleReducer(actionTypeRegistry);
  let initialRule: Rule;
  beforeAll(() => {
    initialRule = {
      params: {},
      consumer: 'rules',
      ruleTypeId: null,
      schedule: {
        interval: '1m',
      },
      actions: [],
      tags: [],
      notifyWhen: 'onActionGroupChange',
      alertDelay: {
        active: 5,
      },
    } as unknown as Rule;
  });

  // setRule
  test('if modified rule was reset to initial', () => {
    const rule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setProperty' },
        payload: {
          key: 'name',
          value: 'new name',
        },
      }
    );
    expect(rule.rule.name).toBe('new name');

    const updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setRule' },
        payload: {
          key: 'rule',
          value: initialRule,
        },
      }
    );
    expect(updatedRule.rule.name).toBeUndefined();
  });

  test('if property name was changed', () => {
    const updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setProperty' },
        payload: {
          key: 'name',
          value: 'new name',
        },
      }
    );
    expect(updatedRule.rule.name).toBe('new name');
  });

  test('if initial schedule property was updated', () => {
    const updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setScheduleProperty' },
        payload: {
          key: 'interval',
          value: '10s',
        },
      }
    );
    expect(updatedRule.rule.schedule.interval).toBe('10s');
  });

  test('if rule params property was added and updated', () => {
    const updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setRuleParams' },
        payload: {
          key: 'testParam',
          value: 'new test params property',
        },
      }
    );
    expect(updatedRule.rule.params.testParam).toBe('new test params property');

    const updatedRuleParamsProperty = ruleReducer(
      { rule: updatedRule.rule },
      {
        command: { type: 'setRuleParams' },
        payload: {
          key: 'testParam',
          value: 'test params property updated',
        },
      }
    );
    expect(updatedRuleParamsProperty.rule.params.testParam).toBe('test params property updated');
  });

  test('if rule action params property was added and updated', () => {
    initialRule.actions.push({
      id: '',
      actionTypeId: 'testId',
      group: 'Rule',
      params: {},
      uuid: '123-456',
    });
    const updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setRuleActionParams' },
        payload: {
          key: 'testActionParam',
          value: 'new test action params property',
          index: 0,
        },
      }
    );
    expect(updatedRule.rule.actions[0].params.testActionParam).toBe(
      'new test action params property'
    );

    const updatedRuleActionParamsProperty = ruleReducer(
      { rule: updatedRule.rule },
      {
        command: { type: 'setRuleActionParams' },
        payload: {
          key: 'testActionParam',
          value: 'test action params property updated',
          index: 0,
        },
      }
    );
    expect(updatedRuleActionParamsProperty.rule.actions[0].params.testActionParam).toBe(
      'test action params property updated'
    );
  });

  test('if the existing rule action params property was set to undefined (when other connector was selected)', () => {
    initialRule.actions.push({
      id: '',
      actionTypeId: 'testId',
      group: 'Rule',
      params: {
        testActionParam: 'some value',
      },
      uuid: '123-456',
    });
    const updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setRuleActionParams' },
        payload: {
          key: 'testActionParam',
          value: undefined,
          index: 0,
        },
      }
    );
    expect(updatedRule.rule.actions[0].params.testActionParam).toBe(undefined);
  });

  test('if rule action property was updated', () => {
    initialRule.actions.push({
      id: '',
      actionTypeId: 'testId',
      group: 'Rule',
      params: {},
      uuid: '123-456',
    });
    const updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setRuleActionProperty' },
        payload: {
          key: 'group',
          value: 'Warning',
          index: 0,
        },
      }
    );
    expect((updatedRule.rule.actions[0] as SanitizedRuleAction).group).toBe('Warning');
  });

  test('if rule action frequency was updated', () => {
    initialRule.actions.push({
      id: '',
      actionTypeId: 'testId',
      group: 'Rule',
      params: {},
      uuid: '123-456',
    });
    const updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setRuleActionFrequency' },
        payload: {
          key: 'notifyWhen',
          value: 'onThrottleInterval',
          index: 0,
        },
      }
    );
    expect((updatedRule.rule.actions[0] as SanitizedRuleAction).frequency?.notifyWhen).toBe(
      'onThrottleInterval'
    );
  });

  test('if initial alert delay property was updated', () => {
    const updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setAlertDelayProperty' },
        payload: {
          key: 'active',
          value: 10,
        },
      }
    );
    expect(updatedRule.rule.alertDelay?.active).toBe(10);
  });

  test('if rule action alerts filter was toggled on, then off', () => {
    initialRule.actions.push({
      id: '',
      actionTypeId: 'testId',
      group: 'Rule',
      params: {},
      uuid: '123-456',
    });
    let updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setRuleActionAlertsFilter' },
        payload: {
          key: 'query',
          value: 'hello',
          index: 0,
        },
      }
    );
    expect((updatedRule.rule.actions[0] as SanitizedRuleAction).alertsFilter).toBeDefined();
    updatedRule = ruleReducer(
      { rule: initialRule },
      {
        command: { type: 'setRuleActionAlertsFilter' },
        payload: {
          key: 'query',
          value: undefined,
          index: 0,
        },
      }
    );
    expect((updatedRule.rule.actions[0] as SanitizedRuleAction).alertsFilter).toBeUndefined();
  });
});
