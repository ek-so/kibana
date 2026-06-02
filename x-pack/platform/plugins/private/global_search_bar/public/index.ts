/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PluginInitializer } from '@kbn/core/public';
import { GlobalSearchBarPlugin } from './plugin';

export const plugin: PluginInitializer<
  import('./plugin').GlobalSearchBarPluginSetup,
  {},
  {},
  {}
> = (initializerContext) => new GlobalSearchBarPlugin(initializerContext);

export type { GlobalSearchBarPluginSetup } from './plugin';
export type { GlobalSearchAction, GlobalSearchActionExecuteContext } from './actions/types';
export { registerGlobalSearchAction } from './actions/registry';
