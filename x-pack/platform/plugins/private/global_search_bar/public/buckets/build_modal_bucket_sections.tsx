/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import type { ReactNode } from 'react';
import React from 'react';
import {
  GLOBAL_SEARCH_BUCKET_ACTIONS,
  GLOBAL_SEARCH_BUCKET_FAVORITES,
  GLOBAL_SEARCH_BUCKET_NAVIGATE,
  GLOBAL_SEARCH_BUCKET_RECENT,
  type GlobalSearchBucket,
  type GlobalSearchBucketId,
  type GlobalSearchResult,
} from '@kbn/global-search-plugin/public';
import type { NavigationParentContext } from '@kbn/core-chrome-browser';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import { resultToOption } from '../lib';
import { getRecentPages, RECENT_ITEMS_MAIN_LIMIT } from '../recent/recent_store';
import { FAVORITES_ITEMS_MAIN_LIMIT } from '../favorites/constants';
import { FavoritesBucketMoreButton } from '../favorites/favorites_bucket_header_actions';
import { filterFavoritesByTerm, filterRecentPagesByTerm } from './filter_bucket_subset';
import { RecentBucketMoreButton } from './recent_bucket_header_actions';
import type { GlobalSearchResultsView } from './build_selectable_options';
import { NAVIGATE_ITEMS_MAIN_LIMIT } from './build_selectable_options';
import type { GlobalSearchAction } from '../actions/types';
import { filterActionsByTerm } from './filter_bucket_subset';
import { insertActionsModalSections } from './insert_actions_bucket_sections';

export interface SearchModalBucketSection {
  id: GlobalSearchBucketId;
  title: string;
  options: EuiSelectableTemplateSitewideOption[];
  headerAction?: ReactNode;
}

const buildResultOptions = ({
  items,
  searchTagIds,
  getTagList,
  getNavigationParent,
}: {
  items: GlobalSearchBucket['items'];
  searchTagIds: string[];
  getTagList?: SavedObjectTaggingPluginStart['ui']['getTagList'];
  getNavigationParent?: (url: string) => NavigationParentContext;
}): EuiSelectableTemplateSitewideOption[] =>
  items.map((item) => ({
    ...resultToOption(item, searchTagIds, getTagList, getNavigationParent),
    'data-test-subj': 'nav-search-option',
  }));

export const buildModalBucketSections = ({
  buckets,
  bucketTitles,
  searchTagIds,
  getTagList,
  getNavigationParent,
  view = 'main',
  onShowAllRecent,
  onShowAllActions,
  onShowAllFavorites,
  actions = [],
  favorites = [],
  term = '',
}: {
  buckets: GlobalSearchBucket[];
  bucketTitles: Record<GlobalSearchBucketId, string>;
  searchTagIds: string[];
  getTagList?: SavedObjectTaggingPluginStart['ui']['getTagList'];
  getNavigationParent?: (url: string) => NavigationParentContext;
  view?: GlobalSearchResultsView;
  onShowAllRecent?: () => void;
  onShowAllActions?: () => void;
  onShowAllFavorites?: () => void;
  actions?: GlobalSearchAction[];
  favorites?: GlobalSearchResult[];
  term?: string;
}): SearchModalBucketSection[] => {
  if (view === 'actions') {
    return insertActionsModalSections({
      sections: [],
      actions: filterActionsByTerm(actions, term),
      actionsTitle: bucketTitles[GLOBAL_SEARCH_BUCKET_ACTIONS],
      term,
      view,
      onShowAllActions,
    });
  }

  if (view === 'recent') {
    const allRecentItems = filterRecentPagesByTerm(getRecentPages(), term);

    if (allRecentItems.length === 0) {
      return [];
    }

    return [
      {
        id: GLOBAL_SEARCH_BUCKET_RECENT,
        title: bucketTitles[GLOBAL_SEARCH_BUCKET_RECENT],
        options: buildResultOptions({
          items: allRecentItems,
          searchTagIds,
          getTagList,
          getNavigationParent,
        }),
      },
    ];
  }

  if (view === 'favorites') {
    const allFavoriteItems = filterFavoritesByTerm(favorites, term);

    if (allFavoriteItems.length === 0) {
      return [];
    }

    return [
      {
        id: GLOBAL_SEARCH_BUCKET_FAVORITES,
        title: bucketTitles[GLOBAL_SEARCH_BUCKET_FAVORITES],
        options: buildResultOptions({
          items: allFavoriteItems,
          searchTagIds,
          getTagList,
          getNavigationParent,
        }),
      },
    ];
  }

  const sections: SearchModalBucketSection[] = [];

  for (const bucket of buckets) {
    if (bucket.items.length === 0) {
      continue;
    }

    const isRecentBucket = bucket.id === GLOBAL_SEARCH_BUCKET_RECENT;
    const isFavoritesBucket = bucket.id === GLOBAL_SEARCH_BUCKET_FAVORITES;
    const isNavigateBucket = bucket.id === GLOBAL_SEARCH_BUCKET_NAVIGATE;
    const visibleItems = isRecentBucket
      ? bucket.items.slice(0, RECENT_ITEMS_MAIN_LIMIT)
      : isFavoritesBucket
      ? bucket.items.slice(0, FAVORITES_ITEMS_MAIN_LIMIT)
      : isNavigateBucket
      ? bucket.items.slice(0, NAVIGATE_ITEMS_MAIN_LIMIT)
      : bucket.items;
    const hasMoreRecentItems =
      isRecentBucket && bucket.items.length > RECENT_ITEMS_MAIN_LIMIT && onShowAllRecent;
    const hasMoreFavoriteItems =
      isFavoritesBucket &&
      bucket.items.length > FAVORITES_ITEMS_MAIN_LIMIT &&
      onShowAllFavorites;

    if (visibleItems.length === 0) {
      continue;
    }

    sections.push({
      id: bucket.id,
      title: bucketTitles[bucket.id],
      options: buildResultOptions({
        items: visibleItems,
        searchTagIds,
        getTagList,
        getNavigationParent,
      }),
      headerAction: hasMoreRecentItems ? (
        <RecentBucketMoreButton onClick={onShowAllRecent} />
      ) : hasMoreFavoriteItems ? (
        <FavoritesBucketMoreButton onClick={onShowAllFavorites} />
      ) : undefined,
    });
  }

  return insertActionsModalSections({
    sections,
    actions,
    actionsTitle: bucketTitles[GLOBAL_SEARCH_BUCKET_ACTIONS],
    term,
    view,
    onShowAllActions,
  });
};
