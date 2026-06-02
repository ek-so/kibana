/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '../types';
import { organizeGlobalSearchResults } from './organize_results';
import {
  GLOBAL_SEARCH_BUCKET_NAVIGATE,
  GLOBAL_SEARCH_BUCKET_RECENT,
  GLOBAL_SEARCH_BUCKET_RESULTS,
} from './types';

const createResult = (
  partial: Pick<GlobalSearchResult, 'id' | 'type' | 'title'> &
    Partial<Pick<GlobalSearchResult, 'score' | 'url'>>
): GlobalSearchResult => ({
  id: partial.id,
  type: partial.type,
  title: partial.title,
  url: partial.url ?? `/app/${partial.id}`,
  score: partial.score ?? 50,
});

describe('organizeGlobalSearchResults', () => {
  it('places application results in the navigate bucket', () => {
    const buckets = organizeGlobalSearchResults({
      results: [createResult({ id: 'discover', type: 'application', title: 'Discover' })],
      recent: [],
      term: '',
    });

    expect(buckets.map((b) => b.id)).toEqual([GLOBAL_SEARCH_BUCKET_NAVIGATE]);
    expect(buckets[0].items.map((i) => i.title)).toEqual(['Discover']);
  });

  it('shows recent before navigate and omits duplicate urls from navigate', () => {
    const recentItem = createResult({
      id: 'discover',
      type: 'application',
      title: 'Discover',
      url: '/app/discover',
    });

    const buckets = organizeGlobalSearchResults({
      results: [
        recentItem,
        createResult({ id: 'dashboards', type: 'application', title: 'Dashboards', url: '/app/dashboards' }),
      ],
      recent: [recentItem],
      term: '',
    });

    expect(buckets.map((b) => b.id)).toEqual([
      GLOBAL_SEARCH_BUCKET_RECENT,
      GLOBAL_SEARCH_BUCKET_NAVIGATE,
    ]);
    expect(buckets[1].items.map((i) => i.title)).toEqual(['Dashboards']);
  });

  it('splits search hits into navigate and results buckets', () => {
    const buckets = organizeGlobalSearchResults({
      results: [
        createResult({ id: 'discover', type: 'application', title: 'Discover', score: 90 }),
        createResult({ id: 'dash-1', type: 'dashboard', title: 'My dashboard', score: 80 }),
      ],
      recent: [
        createResult({
          id: 'recent',
          type: 'application',
          title: 'Recent app',
          url: '/app/recent',
        }),
      ],
      term: 'dash',
    });

    expect(buckets.map((b) => b.id)).toEqual([
      GLOBAL_SEARCH_BUCKET_NAVIGATE,
      GLOBAL_SEARCH_BUCKET_RESULTS,
    ]);
    expect(buckets[0].items.map((i) => i.title)).toEqual(['Discover']);
    expect(buckets[1].items.map((i) => i.title)).toEqual(['My dashboard']);
  });

  it('excludes recent when searching', () => {
    const recentDashboard = createResult({
      id: 'recent-dash',
      type: 'dashboard',
      title: 'Sales Dashboard',
      url: '/app/dashboards#/view/1',
    });

    const buckets = organizeGlobalSearchResults({
      results: [
        createResult({
          id: 'dashboards',
          type: 'application',
          title: 'Dashboards',
          url: '/app/dashboards',
        }),
      ],
      recent: [recentDashboard],
      term: 'dash',
    });

    expect(buckets.map((b) => b.id)).toEqual([GLOBAL_SEARCH_BUCKET_NAVIGATE]);
    expect(buckets[0].items.map((i) => i.title)).toEqual(['Dashboards']);
  });

  it('sorts navigate alphabetically when the term is empty', () => {
    const buckets = organizeGlobalSearchResults({
      results: [
        createResult({ id: 'z', type: 'application', title: 'Zebra' }),
        createResult({ id: 'a', type: 'application', title: 'Alpha' }),
      ],
      recent: [],
      term: '',
    });

    expect(buckets[0].items.map((i) => i.title)).toEqual(['Alpha', 'Zebra']);
  });
});
