/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { NavigationTreeDefinitionUI } from './project_navigation';
import type { ChromeNavLink } from './nav_links';
import { getNavigationParentTitleForUrl } from './project_navigation_utils';

const getDeepLink = (id: string, url: string): ChromeNavLink => ({
  id,
  title: id,
  url,
  baseUrl: url,
  href: url,
  category: undefined,
  order: 0,
  euiIconType: 'empty',
  visibleIn: ['globalSearch', 'projectSideNav'],
});

describe('getNavigationParentTitleForUrl', () => {
  const navigationTree: NavigationTreeDefinitionUI = {
    id: 'es',
    body: [
      {
        id: 'home',
        title: 'Home',
        path: 'home',
        renderAs: 'home',
        breadcrumbStatus: 'hidden',
      },
      {
        id: 'discover',
        title: 'Discover',
        path: 'discover',
        deepLink: getDeepLink('discover', '/foo/app/discover'),
      },
      {
        id: 'ml',
        title: 'Machine Learning',
        path: 'ml',
        children: [
          {
            id: 'anomaly_detection',
            title: 'Anomaly Detection',
            path: 'ml.anomaly_detection',
            deepLink: getDeepLink('anomaly_detection', '/foo/app/ml/anomaly_detection'),
          },
        ],
      },
    ],
  };

  it('returns undefined for top-level navigation items', () => {
    expect(
      getNavigationParentTitleForUrl({
        url: '/foo/app/discover',
        navigationTree,
      })
    ).toBeUndefined();
  });

  it('returns the parent title for nested navigation items', () => {
    expect(
      getNavigationParentTitleForUrl({
        url: '/foo/app/ml/anomaly_detection',
        navigationTree,
      })
    ).toBe('Machine Learning');
  });

  it('returns the panel-level parent for deeply nested stack management items', () => {
    const stackManagementTree: NavigationTreeDefinitionUI = {
      id: 'es',
      footer: [
        {
          id: 'stack_management',
          title: 'Stack Management',
          breadcrumbStatus: 'hidden',
          renderAs: 'panelOpener',
          children: [
            {
              id: 'stack_management_home',
              title: '',
              children: [],
            },
            {
              title: 'Cluster performance',
              children: [
                {
                  id: 'monitoring',
                  title: 'Stack Monitoring',
                  deepLink: getDeepLink('monitoring', '/foo/app/monitoring'),
                },
              ],
            },
          ],
        },
      ],
    };

    expect(
      getNavigationParentTitleForUrl({
        url: '/foo/app/monitoring',
        navigationTree: stackManagementTree,
      })
    ).toBe('Stack Management');
  });

  it('returns undefined when the URL does not match the navigation tree', () => {
    expect(
      getNavigationParentTitleForUrl({
        url: '/foo/app/unknown',
        navigationTree,
      })
    ).toBeUndefined();
  });

  it('returns undefined when the navigation tree is empty', () => {
    expect(
      getNavigationParentTitleForUrl({
        url: '/foo/app/discover',
        navigationTree: { id: 'es', body: [] },
      })
    ).toBeUndefined();
  });
});
