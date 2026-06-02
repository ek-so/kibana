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
  GLOBAL_SEARCH_BUCKET_NAVIGATE,
  GLOBAL_SEARCH_BUCKET_RECENT,
  type GlobalSearchBucket,
  type GlobalSearchBucketId,
} from '@kbn/global-search-plugin/public';
import type { NavigationParentContext } from '@kbn/core-chrome-browser';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import { resultToOption } from '../lib';
import { getRecentPages, RECENT_ITEMS_MAIN_LIMIT } from '../recent/recent_store';
import { RecentBucketMoreButton } from './recent_bucket_header_actions';
import type { GlobalSearchResultsView } from './build_selectable_options';
import { NAVIGATE_ITEMS_MAIN_LIMIT } from './build_selectable_options';

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
}: {
  buckets: GlobalSearchBucket[];
  bucketTitles: Record<GlobalSearchBucketId, string>;
  searchTagIds: string[];
  getTagList?: SavedObjectTaggingPluginStart['ui']['getTagList'];
  getNavigationParent?: (url: string) => NavigationParentContext;
  view?: GlobalSearchResultsView;
  onShowAllRecent?: () => void;
}): SearchModalBucketSection[] => {
  if (view === 'recent') {
    const allRecentItems = getRecentPages();

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

  const sections: SearchModalBucketSection[] = [];

  for (const bucket of buckets) {
    if (bucket.items.length === 0) {
      continue;
    }

    const isRecentBucket = bucket.id === GLOBAL_SEARCH_BUCKET_RECENT;
    const isNavigateBucket = bucket.id === GLOBAL_SEARCH_BUCKET_NAVIGATE;
    const visibleItems = isRecentBucket
      ? bucket.items.slice(0, RECENT_ITEMS_MAIN_LIMIT)
      : isNavigateBucket
      ? bucket.items.slice(0, NAVIGATE_ITEMS_MAIN_LIMIT)
      : bucket.items;
    const hasMoreRecentItems =
      isRecentBucket && bucket.items.length > RECENT_ITEMS_MAIN_LIMIT && onShowAllRecent;

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
      ) : undefined,
    });
  }

  return sections;
};
