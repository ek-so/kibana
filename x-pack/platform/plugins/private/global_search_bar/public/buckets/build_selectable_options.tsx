/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import {
  GLOBAL_SEARCH_BUCKET_NAVIGATE,
  GLOBAL_SEARCH_BUCKET_RECENT,
  type GlobalSearchBucket,
  type GlobalSearchBucketId,
} from '@kbn/global-search-plugin/public';
import type { NavigationParentContext } from '@kbn/core-chrome-browser';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import type { SearchSuggestion } from '../suggestions';
import { resultToOption, suggestionToOption } from '../lib';
import { getRecentPages, RECENT_ITEMS_MAIN_LIMIT } from '../recent/recent_store';
import { RecentBucketMoreButton } from './recent_bucket_header_actions';

export type GlobalSearchResultsView = 'main' | 'recent';

/** Maximum navigate items shown in the main search popover. */
export const NAVIGATE_ITEMS_MAIN_LIMIT = 5;

export interface BucketDisplayConfig {
  id: GlobalSearchBucketId;
  title: string;
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
    'data-test-subj': `nav-search-option`,
  }));

export const buildSelectableOptionsFromBuckets = ({
  buckets,
  bucketTitles,
  suggestions,
  searchTagIds,
  getTagList,
  getNavigationParent,
  view = 'main',
  onShowAllRecent,
}: {
  buckets: GlobalSearchBucket[];
  bucketTitles: Record<GlobalSearchBucketId, string>;
  suggestions: SearchSuggestion[];
  searchTagIds: string[];
  getTagList?: SavedObjectTaggingPluginStart['ui']['getTagList'];
  getNavigationParent?: (url: string) => NavigationParentContext;
  view?: GlobalSearchResultsView;
  onShowAllRecent?: () => void;
}): EuiSelectableTemplateSitewideOption[] => {
  if (view === 'recent') {
    const allRecentItems = getRecentPages();

    if (allRecentItems.length === 0) {
      return [];
    }

    return [
      {
        label: bucketTitles[GLOBAL_SEARCH_BUCKET_RECENT],
        isGroupLabel: true,
        className: 'globalSearchBucketHeader',
        'data-test-subj': `global-search-bucket-${GLOBAL_SEARCH_BUCKET_RECENT}-all`,
      },
      ...buildResultOptions({
        items: allRecentItems,
        searchTagIds,
        getTagList,
        getNavigationParent,
      }),
    ];
  }

  const options: EuiSelectableTemplateSitewideOption[] = suggestions.map(suggestionToOption);

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

    options.push({
      label: bucketTitles[bucket.id],
      isGroupLabel: true,
      className: `globalSearchBucketHeader${
        hasMoreRecentItems ? ' globalSearchBucketHeader--withMore' : ''
      }`,
      append: hasMoreRecentItems ? (
        <RecentBucketMoreButton onClick={onShowAllRecent} />
      ) : undefined,
      'data-test-subj': `global-search-bucket-${bucket.id}`,
    });

    options.push(...buildResultOptions({ items: visibleItems, searchTagIds, getTagList, getNavigationParent }));
  }

  return options;
};
