/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolveGlobalSearchResultParentTitle } from './resolve_global_search_result_parent_title';
import { DASHBOARDS_PARENT_TITLE } from './dashboards_app';

describe('resolveGlobalSearchResultParentTitle', () => {
  it('prefers the navigation tree parent title when present', () => {
    expect(
      resolveGlobalSearchResultParentTitle({
        type: 'dashboard',
        navigation: { matchedInNavigation: true, title: 'Analytics' },
      })
    ).toBe('Analytics');
  });

  it('uses Dashboards for dashboard saved objects without a navigation parent', () => {
    expect(
      resolveGlobalSearchResultParentTitle({
        type: 'dashboard',
        navigation: { matchedInNavigation: false },
      })
    ).toBe(DASHBOARDS_PARENT_TITLE);

    expect(
      resolveGlobalSearchResultParentTitle({
        type: 'dashboard',
        navigation: { matchedInNavigation: true },
      })
    ).toBe(DASHBOARDS_PARENT_TITLE);
  });

  it('returns undefined for non-dashboard types without navigation parent', () => {
    expect(
      resolveGlobalSearchResultParentTitle({
        type: 'application',
        navigation: { matchedInNavigation: true },
      })
    ).toBeUndefined();
  });
});
