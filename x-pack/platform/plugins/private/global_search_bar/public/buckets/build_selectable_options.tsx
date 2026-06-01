/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import React from 'react';
import {
  GLOBAL_SEARCH_BUCKET_RECENT,
  type GlobalSearchBucket,
  type GlobalSearchBucketId,
} from '@kbn/global-search-plugin/public';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import type { SearchSuggestion } from '../suggestions';
import { resultToOption, suggestionToOption } from '../lib';
import { RECENT_ITEMS_MAIN_LIMIT } from '../recent/recent_store';
import { RecentBucketBackButton, RecentBucketMoreButton } from './recent_bucket_header_actions';

export type GlobalSearchResultsView = 'main' | 'recent';

export interface BucketDisplayConfig {
  id: GlobalSearchBucketId;
  title: string;
}

const buildResultOptions = ({
  items,
  searchTagIds,
  getTagList,
}: {
  items: GlobalSearchBucket['items'];
  searchTagIds: string[];
  getTagList?: SavedObjectTaggingPluginStart['ui']['getTagList'];
}): EuiSelectableTemplateSitewideOption[] =>
  items.map((item) => ({
    ...resultToOption(item, searchTagIds, getTagList),
    'data-test-subj': `nav-search-option`,
  }));

export const buildSelectableOptionsFromBuckets = ({
  buckets,
  bucketTitles,
  suggestions,
  searchTagIds,
  getTagList,
  view = 'main',
  onShowAllRecent,
  onBackToMain,
}: {
  buckets: GlobalSearchBucket[];
  bucketTitles: Record<GlobalSearchBucketId, string>;
  suggestions: SearchSuggestion[];
  searchTagIds: string[];
  getTagList?: SavedObjectTaggingPluginStart['ui']['getTagList'];
  view?: GlobalSearchResultsView;
  onShowAllRecent?: () => void;
  onBackToMain?: () => void;
}): EuiSelectableTemplateSitewideOption[] => {
  const recentBucket = buckets.find((bucket) => bucket.id === GLOBAL_SEARCH_BUCKET_RECENT);
  const recentItems = recentBucket?.items ?? [];

  if (view === 'recent') {
    if (recentItems.length === 0) {
      return [];
    }

    return [
      {
        label: bucketTitles[GLOBAL_SEARCH_BUCKET_RECENT],
        isGroupLabel: true,
        prepend: onBackToMain ? <RecentBucketBackButton onClick={onBackToMain} /> : undefined,
        'data-test-subj': `global-search-bucket-${GLOBAL_SEARCH_BUCKET_RECENT}-all`,
      },
      ...buildResultOptions({ items: recentItems, searchTagIds, getTagList }),
    ];
  }

  const options: EuiSelectableTemplateSitewideOption[] = suggestions.map(suggestionToOption);

  for (const bucket of buckets) {
    if (bucket.items.length === 0) {
      continue;
    }

    const isRecentBucket = bucket.id === GLOBAL_SEARCH_BUCKET_RECENT;
    const visibleItems = isRecentBucket
      ? bucket.items.slice(0, RECENT_ITEMS_MAIN_LIMIT)
      : bucket.items;
    const hasMoreRecentItems =
      isRecentBucket && bucket.items.length > RECENT_ITEMS_MAIN_LIMIT && onShowAllRecent;

    if (visibleItems.length === 0) {
      continue;
    }

    options.push({
      label: bucketTitles[bucket.id],
      isGroupLabel: true,
      className: hasMoreRecentItems ? 'globalSearchBucketHeader--withMore' : undefined,
      append: hasMoreRecentItems ? (
        <RecentBucketMoreButton onClick={onShowAllRecent} />
      ) : undefined,
      'data-test-subj': `global-search-bucket-${bucket.id}`,
    });

    options.push(...buildResultOptions({ items: visibleItems, searchTagIds, getTagList }));
  }

  return options;
};
