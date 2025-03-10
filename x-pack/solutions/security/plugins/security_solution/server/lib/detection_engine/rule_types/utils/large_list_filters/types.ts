/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { estypes } from '@elastic/elasticsearch';
import type { Type, ExceptionListItemSchema } from '@kbn/securitysolution-io-ts-list-types';
import type { ListClient } from '@kbn/lists-plugin/server';
import type { IRuleExecutionLogForExecutors } from '../../../rule_monitoring';

export interface FilterEventsAgainstListOptions<T> {
  listClient: ListClient;
  exceptionsList: ExceptionListItemSchema[];
  ruleExecutionLogger: IRuleExecutionLogForExecutors;
  events: Array<estypes.SearchHit<T>>;
}

export type FilterEventsAgainstListReturn<T> = [
  Array<estypes.SearchHit<T>>,
  Array<estypes.SearchHit<T>>
];

export interface CreateSetToFilterAgainstOptions<T> {
  events: Array<estypes.SearchHit<T>>;
  field: string;
  listId: string;
  listType: Type;
  listClient: ListClient;
  ruleExecutionLogger: IRuleExecutionLogForExecutors;
}

export interface FilterEventsOptions<T> {
  events: Array<estypes.SearchHit<T>>;
  fieldAndSetTuples: FieldSet[];
}

export interface CreateFieldAndSetTuplesOptions<T> {
  events: Array<estypes.SearchHit<T>>;
  exceptionItem: ExceptionListItemSchema;
  listClient: ListClient;
  ruleExecutionLogger: IRuleExecutionLogForExecutors;
}

export interface FieldSet {
  field: string;
  operator: 'excluded' | 'included';
  matchedSet: Set<unknown>;
}
