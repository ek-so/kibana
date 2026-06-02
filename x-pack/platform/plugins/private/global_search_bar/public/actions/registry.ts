/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchAction } from './types';

const registeredActions = new Map<string, GlobalSearchAction>();

export const registerGlobalSearchAction = (action: GlobalSearchAction): void => {
  if (registeredActions.has(action.id)) {
    throw new Error(`Global search action with id "${action.id}" is already registered`);
  }

  registeredActions.set(action.id, action);
};

export const getGlobalSearchActions = (): GlobalSearchAction[] => Array.from(registeredActions.values());

export const getGlobalSearchActionById = (id: string): GlobalSearchAction | undefined =>
  registeredActions.get(id);
