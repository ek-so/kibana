/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpStart, UserProfileServiceStart } from '@kbn/core/public';
import { FavoritesClient } from '@kbn/content-management-favorites-public';
import type { GlobalSearchResult } from '@kbn/global-search-plugin/public';

const DASHBOARD_APP_ID = 'dashboards';
const DASHBOARD_SAVED_OBJECT_TYPE = 'dashboard';

interface BulkGetSavedObjectResponse {
  id: string;
  type: string;
  attributes: {
    title?: string;
  };
  references?: Array<{ type: string; id: string }>;
  error?: {
    statusCode: number;
  };
}

const mapDashboardToSearchResult = (object: BulkGetSavedObjectResponse): GlobalSearchResult => ({
  id: object.id,
  title: object.attributes.title ?? object.id,
  type: DASHBOARD_SAVED_OBJECT_TYPE,
  url: `/app/dashboards#/view/${encodeURIComponent(object.id)}`,
  icon: 'dashboardApp',
  score: 100,
  meta: {
    tagIds: object.references?.filter((ref) => ref.type === 'tag').map((ref) => ref.id) ?? [],
    displayName: DASHBOARD_SAVED_OBJECT_TYPE,
  },
});

export const loadFavoriteDashboardResults = async ({
  http,
  userProfile,
}: {
  http: HttpStart;
  userProfile: UserProfileServiceStart;
}): Promise<GlobalSearchResult[]> => {
  const favoritesClient = new FavoritesClient(DASHBOARD_APP_ID, DASHBOARD_SAVED_OBJECT_TYPE, {
    http,
    userProfile,
  });

  const { favoriteIds } = await favoritesClient.getFavorites();

  if (favoriteIds.length === 0) {
    return [];
  }

  const { saved_objects: savedObjects } = await http.post<{
    saved_objects: BulkGetSavedObjectResponse[];
  }>('/api/saved_objects/_bulk_get', {
    body: JSON.stringify(
      favoriteIds.map((id) => ({ id, type: DASHBOARD_SAVED_OBJECT_TYPE }))
    ),
  });

  const resultsById = new Map<string, GlobalSearchResult>();

  for (const savedObject of savedObjects) {
    if (savedObject.error) {
      continue;
    }

    resultsById.set(savedObject.id, mapDashboardToSearchResult(savedObject));
  }

  return favoriteIds
    .map((id) => resultsById.get(id))
    .filter((result): result is GlobalSearchResult => result !== undefined);
};
