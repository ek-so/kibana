/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { of } from 'rxjs';
import { loadFavoriteDashboardResults } from './load_favorite_dashboards';

const mockGetFavorites = jest.fn();
const mockHttpPost = jest.fn();

jest.mock('@kbn/content-management-favorites-public', () => ({
  FavoritesClient: jest.fn().mockImplementation(() => ({
    getFavorites: mockGetFavorites,
  })),
}));

describe('loadFavoriteDashboardResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFavorites.mockResolvedValue({ favoriteIds: ['dash-1'] });
    mockHttpPost.mockResolvedValue({
      saved_objects: [
        {
          id: 'dash-1',
          type: 'dashboard',
          attributes: { title: 'My dashboard' },
        },
      ],
    });
  });

  it('requests dashboard objects with the bulk_get array body shape', async () => {
    const http = { post: mockHttpPost } as any;
    const userProfile = { getEnabled$: () => of(true) } as any;

    const results = await loadFavoriteDashboardResults({ http, userProfile });

    expect(mockHttpPost).toHaveBeenCalledWith('/api/saved_objects/_bulk_get', {
      body: JSON.stringify([{ id: 'dash-1', type: 'dashboard' }]),
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'dash-1',
      title: 'My dashboard',
      type: 'dashboard',
      url: '/app/dashboards#/view/dash-1',
    });
  });
});
