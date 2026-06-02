/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PluginInitializer } from '@kbn/core/public';
import type { GlobalSearchPluginSetupDeps, GlobalSearchPluginStartDeps } from './plugin';
import { GlobalSearchPlugin } from './plugin';
import type { GlobalSearchPluginSetup, GlobalSearchPluginStart } from './types';

export const plugin: PluginInitializer<
  GlobalSearchPluginSetup,
  GlobalSearchPluginStart,
  GlobalSearchPluginSetupDeps,
  GlobalSearchPluginStartDeps
> = (context) => new GlobalSearchPlugin(context);

export type {
  GlobalSearchBatchedResults,
  GlobalSearchProviderFindOptions,
  GlobalSearchProviderResult,
  GlobalSearchProviderResultUrl,
  GlobalSearchResult,
  GlobalSearchFindParams,
  GlobalSearchProviderFindParams,
} from '../common/types';
export {
  organizeGlobalSearchResults,
  GLOBAL_SEARCH_BUCKET_ACTIONS,
  GLOBAL_SEARCH_BUCKET_NAVIGATE,
  GLOBAL_SEARCH_BUCKET_RECENT,
  GLOBAL_SEARCH_BUCKET_RESULTS,
} from '../common/buckets';
export type { GlobalSearchBucket, GlobalSearchBucketId } from '../common/buckets';
export {
  GLOBAL_SEARCH_ITEM_KIND_ACTION,
  GLOBAL_SEARCH_ITEM_KIND_META_KEY,
  GLOBAL_SEARCH_ITEM_KIND_PAGE,
} from '../common/item_kinds';
export type { GlobalSearchItemKind } from '../common/item_kinds';
export type {
  GlobalSearchPluginSetup,
  GlobalSearchPluginStart,
  GlobalSearchResultProvider,
} from './types';
export type { GlobalSearchFindOptions } from './services/types';
