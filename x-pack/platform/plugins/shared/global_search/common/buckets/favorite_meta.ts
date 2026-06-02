/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { GLOBAL_SEARCH_FAVORITE_META_KEY } from '../item_kinds';
import type { GlobalSearchResult } from '../types';

export const isGlobalSearchFavoriteResult = (result: GlobalSearchResult): boolean =>
  Boolean((result.meta as Record<string, unknown> | undefined)?.[GLOBAL_SEARCH_FAVORITE_META_KEY]);

export const markGlobalSearchFavoriteResult = (result: GlobalSearchResult): GlobalSearchResult => ({
  ...result,
  meta: {
    ...result.meta,
    [GLOBAL_SEARCH_FAVORITE_META_KEY]: true,
  },
});

export const filterGlobalSearchFavoritesByTerm = (
  items: GlobalSearchResult[],
  term: string
): GlobalSearchResult[] => {
  const normalizedTerm = term.toLowerCase();

  if (normalizedTerm.length === 0) {
    return items;
  }

  return items.filter((item) => item.title.toLowerCase().includes(normalizedTerm));
};
