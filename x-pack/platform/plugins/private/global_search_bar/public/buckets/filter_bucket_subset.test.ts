/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  filterActionsByTerm,
  filterRecentPagesByTerm,
} from './filter_bucket_subset';
import type { GlobalSearchAction } from '../actions/types';

describe('filter_bucket_subset', () => {
  it('filters recent pages by title', () => {
    const items = [
      { id: '1', title: 'Sales Dashboard', url: '/a', type: 'dashboard', score: 1, meta: {} },
      { id: '2', title: 'Discover', url: '/b', type: 'application', score: 1, meta: {} },
    ];

    expect(filterRecentPagesByTerm(items, 'dash').map((item) => item.title)).toEqual([
      'Sales Dashboard',
    ]);
  });

  it('filters actions by title and append label', () => {
    const actions: GlobalSearchAction[] = [
      {
        id: 'create-dashboard',
        title: 'Create dashboard',
        appendLabel: 'Dashboards',
        icon: 'plus',
        execute: jest.fn(),
      },
      {
        id: 'create-rule',
        title: 'Create rule',
        appendLabel: 'Rules',
        icon: 'bell',
        execute: jest.fn(),
      },
    ];

    expect(filterActionsByTerm(actions, 'rule').map((action) => action.id)).toEqual([
      'create-rule',
    ]);
    expect(filterActionsByTerm(actions, 'dashboards').map((action) => action.id)).toEqual([
      'create-dashboard',
    ]);
  });
});
