/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '../types';
import {
  filterGlobalSearchFavoritesByTerm,
  isGlobalSearchFavoriteResult,
  markGlobalSearchFavoriteResult,
} from './favorite_meta';
import { GLOBAL_SEARCH_FAVORITE_META_KEY } from '../item_kinds';

const createResult = (title: string): GlobalSearchResult => ({
  id: '1',
  type: 'dashboard',
  title,
  url: '/app/dashboards#/view/1',
  score: 100,
});

describe('favorite_meta', () => {
  it('marks and detects favorite results', () => {
    const marked = markGlobalSearchFavoriteResult(createResult('Dashboard'));

    expect(marked.meta?.[GLOBAL_SEARCH_FAVORITE_META_KEY]).toBe(true);
    expect(isGlobalSearchFavoriteResult(marked)).toBe(true);
    expect(isGlobalSearchFavoriteResult(createResult('Other'))).toBe(false);
  });

  it('filters favorites by search term', () => {
    const items = [
      createResult('Sales Dashboard'),
      createResult('Discover logs'),
    ];

    expect(filterGlobalSearchFavoritesByTerm(items, 'dash').map((i) => i.title)).toEqual([
      'Sales Dashboard',
    ]);
  });
});
