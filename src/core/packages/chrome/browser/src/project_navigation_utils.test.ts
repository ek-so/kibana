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
import { getNavigationParentForUrl, getNavigationParentTitleForUrl } from './project_navigation_utils';

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
        icon: 'productDiscover',
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

  it('returns undefined parent title for top-level navigation items', () => {
    expect(
      getNavigationParentTitleForUrl({
        url: '/foo/app/discover',
        navigationTree,
      })
    ).toBeUndefined();
  });

  it('returns the active nav item icon for top-level items', () => {
    expect(
      getNavigationParentForUrl({
        url: '/foo/app/discover',
        navigationTree,
      })
    ).toEqual({
      icon: 'productDiscover',
      matchedInNavigation: true,
    });
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
          icon: 'gear',
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

  it('returns the parent navigation icon for deeply nested items', () => {
    const stackManagementTree: NavigationTreeDefinitionUI = {
      id: 'es',
      footer: [
        {
          id: 'stack_management',
          title: 'Stack Management',
          icon: 'gear',
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
      getNavigationParentForUrl({
        url: '/foo/app/monitoring',
        navigationTree: stackManagementTree,
      })
    ).toEqual({
      title: 'Stack Management',
      icon: 'gear',
      matchedInNavigation: true,
    });
  });

  it('reports when a URL is not in the navigation tree', () => {
    expect(
      getNavigationParentForUrl({
        url: '/foo/app/unknown-dashboard',
        navigationTree,
      })
    ).toEqual({
      matchedInNavigation: false,
    });
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
