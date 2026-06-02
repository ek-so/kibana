/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '../types';
import { organizeGlobalSearchResults } from './organize_results';
import {
  GLOBAL_SEARCH_BUCKET_FAVORITES,
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
  it('places favorite items in the favorites bucket when idle', () => {
    const buckets = organizeGlobalSearchResults({
      results: [],
      recent: [],
      favorites: [createResult({ id: 'dash-1', type: 'dashboard', title: 'My Dashboard' })],
      term: '',
    });

    expect(buckets.map((b) => b.id)).toEqual([GLOBAL_SEARCH_BUCKET_FAVORITES]);
    expect(buckets[0].items.map((i) => i.title)).toEqual(['My Dashboard']);
  });

  it('shows recent before favorites and keeps starred items in favorites', () => {
    const recentItem = createResult({
      id: 'dash-recent',
      type: 'dashboard',
      title: 'Recent Dashboard',
      url: '/app/dashboards#/view/recent',
    });
    const favoriteItem = createResult({
      id: 'dash-fav',
      type: 'dashboard',
      title: 'Favorite Dashboard',
      url: '/app/dashboards#/view/fav',
    });

    const buckets = organizeGlobalSearchResults({
      results: [],
      recent: [recentItem],
      favorites: [recentItem, favoriteItem],
      term: '',
    });

    expect(buckets.map((b) => b.id)).toEqual([
      GLOBAL_SEARCH_BUCKET_RECENT,
      GLOBAL_SEARCH_BUCKET_FAVORITES,
    ]);
    expect(buckets[1].items.map((i) => i.title)).toEqual(['Recent Dashboard', 'Favorite Dashboard']);
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
      favorites: [recentDashboard],
      term: 'dash',
    });

    expect(buckets.map((b) => b.id)).toEqual([GLOBAL_SEARCH_BUCKET_NAVIGATE]);
    expect(buckets[0].items.map((i) => i.title)).toEqual(['Sales Dashboard', 'Dashboards']);
  });

  it('merges matching favorites with applications in navigate when searching', () => {
    const favoriteDashboard = createResult({
      id: 'dash-fav',
      type: 'dashboard',
      title: 'Starred Dashboard',
      url: '/app/dashboards#/view/fav',
    });

    const buckets = organizeGlobalSearchResults({
      results: [
        createResult({
          id: 'dashboards',
          type: 'application',
          title: 'Dashboards',
          url: '/app/dashboards',
          score: 85,
        }),
        createResult({
          id: 'dash-fav',
          type: 'dashboard',
          title: 'Starred Dashboard',
          url: '/app/dashboards#/view/fav',
          score: 80,
        }),
      ],
      favorites: [favoriteDashboard],
      term: 'dash',
    });

    expect(buckets.map((b) => b.id)).toEqual([GLOBAL_SEARCH_BUCKET_NAVIGATE]);
    expect(buckets[0].items.map((i) => i.title)).toEqual(['Starred Dashboard', 'Dashboards']);
    expect(buckets[0].items[0].meta?.isFavorite).toBe(true);
  });
});
