/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  GLOBAL_SEARCH_BUCKET_NAVIGATE,
  GLOBAL_SEARCH_BUCKET_RECENT,
} from '@kbn/global-search-plugin/public';
import type { GlobalSearchResult } from '@kbn/global-search-plugin/public';
import { buildSelectableOptionsFromBuckets } from './build_selectable_options';
import { getRecentPages } from '../recent/recent_store';
import { buildModalBucketSections } from './build_modal_bucket_sections';

jest.mock('../recent/recent_store', () => ({
  getRecentPages: jest.fn(),
  RECENT_ITEMS_MAIN_LIMIT: 3,
}));

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

const mockGetRecentPages = getRecentPages as jest.MockedFunction<typeof getRecentPages>;

describe('buildSelectableOptionsFromBuckets', () => {
  beforeEach(() => {
    mockGetRecentPages.mockReset();
  });

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
    expect(recentGroupLabel?.className).toBe('globalSearchBucketHeader');
    expect(getSelectableLabels(options)).toEqual(['recent-0', 'recent-1', 'recent-2']);
  });

  it('limits navigate items to five in the main view', () => {
    const navigateItems = Array.from({ length: 8 }, (_, index) => createResult(`nav-${index}`));

    const options = buildSelectableOptionsFromBuckets({
      buckets: [{ id: GLOBAL_SEARCH_BUCKET_NAVIGATE, items: navigateItems }],
      bucketTitles,
      suggestions: [],
      searchTagIds: [],
    });

    expect(getSelectableLabels(options)).toEqual([
      'nav-0',
      'nav-1',
      'nav-2',
      'nav-3',
      'nav-4',
    ]);
    expect(
      options.find((option) => option.isGroupLabel && option.label === 'Navigate')?.append
    ).toBeUndefined();
  });

  it('builds separate modal bucket sections without group labels in options', () => {
    const recentItems = Array.from({ length: 2 }, (_, index) => createResult(`recent-${index}`));
    const navigateItems = Array.from({ length: 2 }, (_, index) => createResult(`nav-${index}`));

    const sections = buildModalBucketSections({
      buckets: [
        { id: GLOBAL_SEARCH_BUCKET_RECENT, items: recentItems },
        { id: GLOBAL_SEARCH_BUCKET_NAVIGATE, items: navigateItems },
      ],
      bucketTitles,
      searchTagIds: [],
    });

    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('Recent');
    expect(sections[0].options).toHaveLength(2);
    expect(sections[0].options.every((option) => !option.isGroupLabel)).toBe(true);
    expect(sections[1].title).toBe('Navigate');
  });

  it('shows all recent items from the recent store in the recent view', () => {
    const recentItems = Array.from({ length: 7 }, (_, index) => createResult(`recent-${index}`));
    mockGetRecentPages.mockReturnValue(recentItems);

    const options = buildSelectableOptionsFromBuckets({
      buckets: [{ id: GLOBAL_SEARCH_BUCKET_RECENT, items: recentItems.slice(0, 3) }],
      bucketTitles,
      suggestions: [{ suggestion: 'type: dashboard' }],
      searchTagIds: [],
      view: 'recent',
    });

    expect(options.some((option) => option.type === '__suggestion__')).toBe(false);
    expect(
      options.find((option) => option.isGroupLabel && option.label === 'Recent')?.append
    ).toBeUndefined();
    expect(getSelectableLabels(options)).toHaveLength(7);
    expect(mockGetRecentPages).toHaveBeenCalled();
  });
});

const getSelectableLabels = (options: Array<{ label?: string; isGroupLabel?: boolean }>) =>
  options.filter((option) => !option.isGroupLabel).map((option) => option.label);
