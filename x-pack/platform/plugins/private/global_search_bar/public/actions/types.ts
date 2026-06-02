/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IconType } from '@elastic/eui';
import type { ApplicationStart } from '@kbn/core/public';

export const GLOBAL_SEARCH_ACTION_OPTION_TYPE = '__globalSearchAction__' as const;

export interface GlobalSearchActionExecuteContext {
  navigateToUrl: ApplicationStart['navigateToUrl'];
  navigateToApp: ApplicationStart['navigateToApp'];
}

export interface GlobalSearchAction {
  id: string;
  title: string;
  /** Shown as subdued append text (e.g. parent app name). */
  appendLabel?: string;
  icon: IconType;
  execute: (context: GlobalSearchActionExecuteContext) => void;
}
