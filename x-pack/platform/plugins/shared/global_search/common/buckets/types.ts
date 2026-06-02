/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '../types';

/** Indexed Kibana apps and deep links from the applications provider. */
export const GLOBAL_SEARCH_BUCKET_NAVIGATE = 'navigate' as const;

/** User-starred content (e.g. dashboards). */
export const GLOBAL_SEARCH_BUCKET_FAVORITES = 'favorites' as const;

/** Recently opened pages (client-local). */
export const GLOBAL_SEARCH_BUCKET_RECENT = 'recent' as const;

/** Saved objects and other provider hits (non-application). */
export const GLOBAL_SEARCH_BUCKET_RESULTS = 'results' as const;

/** Executable commands registered for the search modal. */
export const GLOBAL_SEARCH_BUCKET_ACTIONS = 'actions' as const;

export type GlobalSearchBucketId =
  | typeof GLOBAL_SEARCH_BUCKET_NAVIGATE
  | typeof GLOBAL_SEARCH_BUCKET_FAVORITES
  | typeof GLOBAL_SEARCH_BUCKET_RECENT
  | typeof GLOBAL_SEARCH_BUCKET_RESULTS
  | typeof GLOBAL_SEARCH_BUCKET_ACTIONS;

export interface GlobalSearchBucket {
  id: GlobalSearchBucketId;
  items: GlobalSearchResult[];
}

export interface OrganizeGlobalSearchResultsParams {
  results: GlobalSearchResult[];
  recent: GlobalSearchResult[];
  /** Starred items shown in the idle (empty query) view. */
  favorites?: GlobalSearchResult[];
  term: string;
}
