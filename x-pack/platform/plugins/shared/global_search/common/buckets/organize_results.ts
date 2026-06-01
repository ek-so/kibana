/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '../types';
import {
  GLOBAL_SEARCH_BUCKET_NAVIGATE,
  GLOBAL_SEARCH_BUCKET_RECENT,
  GLOBAL_SEARCH_BUCKET_RESULTS,
  type GlobalSearchBucket,
  type OrganizeGlobalSearchResultsParams,
} from './types';

const sortByScore = (a: GlobalSearchResult, b: GlobalSearchResult): number => {
  if (a.score < b.score) return 1;
  if (a.score > b.score) return -1;
  return 0;
};

const sortByTitle = (a: GlobalSearchResult, b: GlobalSearchResult): number => {
  const titleA = a.title.toUpperCase();
  const titleB = b.title.toUpperCase();
  if (titleA < titleB) return -1;
  if (titleA > titleB) return 1;
  return 0;
};

const dedupeNavigateFromRecent = (
  navigateItems: GlobalSearchResult[],
  recent: GlobalSearchResult[]
): GlobalSearchResult[] => {
  const recentUrls = new Set(recent.map((item) => item.url));
  return navigateItems.filter((item) => !recentUrls.has(item.url));
};

/**
 * Assigns flat provider results into Navigate / Recent / Results buckets for display.
 *
 * When the query is empty, shows Recent and Navigate (applications). When the user is
 * searching, shows only a single Results bucket with all hits (unlimited).
 */
export const organizeGlobalSearchResults = ({
  results,
  recent,
  term,
}: OrganizeGlobalSearchResultsParams): GlobalSearchBucket[] => {
  const isEmptyTerm = term.length === 0;

  if (!isEmptyTerm) {
    if (results.length === 0) {
      return [];
    }

    return [
      {
        id: GLOBAL_SEARCH_BUCKET_RESULTS,
        items: [...results].sort(sortByScore),
      },
    ];
  }

  const navigateItems = results.filter(({ type }) => type === 'application');
  const buckets: GlobalSearchBucket[] = [];

  if (recent.length > 0) {
    buckets.push({ id: GLOBAL_SEARCH_BUCKET_RECENT, items: recent });
  }

  const navigateDeduped = dedupeNavigateFromRecent(navigateItems, recent);
  if (navigateDeduped.length > 0) {
    buckets.push({
      id: GLOBAL_SEARCH_BUCKET_NAVIGATE,
      items: [...navigateDeduped].sort(sortByTitle),
    });
  }

  return buckets;
};
