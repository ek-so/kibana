/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { GLOBAL_SEARCH_BUCKET_RECENT } from '@kbn/global-search-plugin/public';
import type { GlobalSearchResult } from '@kbn/global-search-plugin/public';
import { buildSelectableOptionsFromBuckets } from './build_selectable_options';

jest.mock('../lib', () => ({
  resultToOption: jest.fn((result: GlobalSearchResult) => ({
    key: result.id,
    label: result.title,
    url: result.url,
    type: result.type,
  })),
  suggestionToOption: jest.fn((suggestion: { suggestion: string }) => ({
    label: suggestion.suggestion,
    type: '__suggestion__',
    suggestion: suggestion.suggestion,
  })),
}));

const createResult = (id: string): GlobalSearchResult => ({
  id,
  type: 'application',
  title: id,
  url: `/app/${id}`,
  score: 100,
  meta: { categoryLabel: 'Kibana' },
});

const bucketTitles = {
  recent: 'Recent',
  navigate: 'Navigate',
  results: 'Results',
};

describe('buildSelectableOptionsFromBuckets', () => {
  it('limits recent items to three in the main view and adds a More action', () => {
    const recentItems = Array.from({ length: 7 }, (_, index) => createResult(`recent-${index}`));
    const onShowAllRecent = jest.fn();

    const options = buildSelectableOptionsFromBuckets({
      buckets: [{ id: GLOBAL_SEARCH_BUCKET_RECENT, items: recentItems }],
      bucketTitles,
      suggestions: [],
      searchTagIds: [],
      onShowAllRecent,
    });

    const recentGroupLabel = options.find(
      (option) => option.isGroupLabel && option.label === 'Recent'
    );

    expect(recentGroupLabel?.append).toBeTruthy();
    expect(getSelectableLabels(options)).toEqual(['recent-0', 'recent-1', 'recent-2']);
    expect(recentGroupLabel?.className).toContain('globalSearchBucketHeader--withMore');
  });

  it('shows all recent items in the recent view with a back action', () => {
    const recentItems = Array.from({ length: 7 }, (_, index) => createResult(`recent-${index}`));
    const onBackToMain = jest.fn();

    const options = buildSelectableOptionsFromBuckets({
      buckets: [{ id: GLOBAL_SEARCH_BUCKET_RECENT, items: recentItems }],
      bucketTitles,
      suggestions: [{ suggestion: 'type: dashboard' }],
      searchTagIds: [],
      view: 'recent',
      onBackToMain,
    });

    expect(options.some((option) => option.type === '__suggestion__')).toBe(false);
    expect(options.some((option) => option.isGroupLabel && option.prepend)).toBe(true);
    expect(getSelectableLabels(options)).toHaveLength(7);
  });
});

const getSelectableLabels = (options: Array<{ label?: string; isGroupLabel?: boolean }>) =>
  options.filter((option) => !option.isGroupLabel).map((option) => option.label);
