/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '../types';
import {
  filterGlobalSearchFavoritesByTerm,
  markGlobalSearchFavoriteResult,
} from './favorite_meta';
import {
  GLOBAL_SEARCH_BUCKET_FAVORITES,
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

/**
 * Assigns flat provider results into buckets for display.
 *
 * When the query is empty, shows Recent and Favorite (starred items). When the user is
 * searching, shows Navigate (matching favorites and applications), Results (other types),
 * and Actions separately in the UI layer.
 */
export const organizeGlobalSearchResults = ({
  results,
  recent,
  favorites = [],
  term,
}: OrganizeGlobalSearchResultsParams): GlobalSearchBucket[] => {
  const isEmptyTerm = term.length === 0;

  if (!isEmptyTerm) {
    const buckets: GlobalSearchBucket[] = [];
    const matchingFavorites = filterGlobalSearchFavoritesByTerm(favorites, term).map(
      markGlobalSearchFavoriteResult
    );
    const favoriteUrls = new Set(matchingFavorites.map((item) => item.url));
    const favoriteIds = new Set(matchingFavorites.map((item) => item.id));

    const navigateApplications = results
      .filter(({ type }) => type === 'application')
      .filter((item) => !favoriteUrls.has(item.url));

    const navigateItems = [
      ...matchingFavorites,
      ...[...navigateApplications].sort(sortByScore),
    ];

    const resultItems = results
      .filter(({ type }) => type !== 'application')
      .filter(
        (item) =>
          !favoriteUrls.has(item.url) && !(item.type === 'dashboard' && favoriteIds.has(item.id))
      );

    if (navigateItems.length > 0) {
      buckets.push({
        id: GLOBAL_SEARCH_BUCKET_NAVIGATE,
        items: navigateItems,
      });
    }

    if (resultItems.length > 0) {
      buckets.push({
        id: GLOBAL_SEARCH_BUCKET_RESULTS,
        items: [...resultItems].sort(sortByScore),
      });
    }

    return buckets;
  }

  const buckets: GlobalSearchBucket[] = [];

  if (recent.length > 0) {
    buckets.push({ id: GLOBAL_SEARCH_BUCKET_RECENT, items: recent });
  }

  if (favorites.length > 0) {
    buckets.push({
      id: GLOBAL_SEARCH_BUCKET_FAVORITES,
      items: favorites.map(markGlobalSearchFavoriteResult),
    });
  }

  return buckets;
};
