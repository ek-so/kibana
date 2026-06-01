/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '@kbn/global-search-plugin/public';
import { getRecentPages, recordRecentPage } from './recent_store';

const createResult = (partial: Partial<GlobalSearchResult> & Pick<GlobalSearchResult, 'url'>): GlobalSearchResult => ({
  id: partial.id ?? 'id',
  type: partial.type ?? 'application',
  title: partial.title ?? 'Title',
  url: partial.url,
  score: partial.score ?? 100,
  icon: partial.icon,
  meta: partial.meta,
});

describe('recent_store', () => {
  const spaceId = 'test-space';
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = value;
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
      },
      configurable: true,
    });
  });

  it('records and returns recent pages newest first', () => {
    recordRecentPage(
      createResult({ id: 'a', url: '/app/a', title: 'A' }),
      spaceId
    );
    recordRecentPage(
      createResult({ id: 'b', url: '/app/b', title: 'B' }),
      spaceId
    );

    expect(getRecentPages(spaceId).map((page) => page.title)).toEqual(['B', 'A']);
  });

  it('moves an existing url to the top', () => {
    recordRecentPage(createResult({ id: 'a', url: '/app/a', title: 'A' }), spaceId);
    recordRecentPage(createResult({ id: 'b', url: '/app/b', title: 'B' }), spaceId);
    recordRecentPage(createResult({ id: 'a', url: '/app/a', title: 'A' }), spaceId);

    expect(getRecentPages(spaceId).map((page) => page.title)).toEqual(['A', 'B']);
  });

});
