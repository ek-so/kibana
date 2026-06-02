/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  GLOBAL_SEARCH_OFF_MENU_ICON,
  resolveGlobalSearchPrependIcon,
} from './global_search_result_icon';

describe('resolveGlobalSearchPrependIcon', () => {
  it('prefers the navigation tree icon when present', () => {
    expect(
      resolveGlobalSearchPrependIcon({
        type: 'application',
        resultIcon: 'logoKibana',
        navigation: { matchedInNavigation: true, icon: 'productDiscover' },
      })
    ).toBe('productDiscover');
  });

  it('uses the result icon for saved-object results outside the navigation menu', () => {
    expect(
      resolveGlobalSearchPrependIcon({
        type: 'dashboard',
        resultIcon: 'productDashboard',
        navigation: { matchedInNavigation: false },
      })
    ).toBe('productDashboard');
  });

  it('falls back to the grid icon for saved-object results without an icon', () => {
    expect(
      resolveGlobalSearchPrependIcon({
        type: 'dashboard',
        navigation: { matchedInNavigation: false },
      })
    ).toBe(GLOBAL_SEARCH_OFF_MENU_ICON);
  });

  it('uses the grid icon instead of solution logos for applications outside the menu', () => {
    expect(
      resolveGlobalSearchPrependIcon({
        type: 'application',
        resultIcon: 'logoKibana',
        navigation: { matchedInNavigation: false },
      })
    ).toBe(GLOBAL_SEARCH_OFF_MENU_ICON);
  });

  it('uses the result icon for saved objects matched in navigation without a nav icon', () => {
    expect(
      resolveGlobalSearchPrependIcon({
        type: 'dashboard',
        resultIcon: 'productDashboard',
        navigation: { matchedInNavigation: true, title: 'Dashboards' },
      })
    ).toBe('productDashboard');
  });

  it('keeps integration icons outside the navigation menu', () => {
    expect(
      resolveGlobalSearchPrependIcon({
        type: 'integration',
        resultIcon: 'logoIntegrations',
        navigation: { matchedInNavigation: false },
      })
    ).toBe('logoIntegrations');
  });
});
