/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/** Navigable destinations (apps, saved objects, deep links). */
export const GLOBAL_SEARCH_ITEM_KIND_PAGE = 'page' as const;

/** Executable commands shown in the Actions bucket. */
export const GLOBAL_SEARCH_ITEM_KIND_ACTION = 'action' as const;

export type GlobalSearchItemKind =
  | typeof GLOBAL_SEARCH_ITEM_KIND_PAGE
  | typeof GLOBAL_SEARCH_ITEM_KIND_ACTION;

/** Meta key on {@link GlobalSearchResult} for item kind. */
export const GLOBAL_SEARCH_ITEM_KIND_META_KEY = 'itemKind';
