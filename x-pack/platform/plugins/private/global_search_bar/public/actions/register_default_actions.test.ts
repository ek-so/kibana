/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getGlobalSearchActionById } from './registry';
import { registerDefaultGlobalSearchActions } from './register_default_actions';

describe('registerDefaultGlobalSearchActions', () => {
  it('registers enough default actions to show the Actions More control', () => {
    registerDefaultGlobalSearchActions();

    expect(getGlobalSearchActionById('create-dashboard')).toBeDefined();
    expect(getGlobalSearchActionById('create-data-view')).toBeDefined();
    expect(getGlobalSearchActionById('create-visualization')).toBeDefined();
    expect(getGlobalSearchActionById('create-rule')).toBeDefined();
  });

  it('navigates to the new dashboard editor like the listing create button', () => {
    registerDefaultGlobalSearchActions();

    const action = getGlobalSearchActionById('create-dashboard');
    const navigateToApp = jest.fn();
    const navigateToUrl = jest.fn();

    action?.execute({ navigateToApp, navigateToUrl });

    expect(navigateToApp).toHaveBeenCalledWith('dashboards', { path: '#/create' });
    expect(navigateToUrl).not.toHaveBeenCalled();
  });
});
