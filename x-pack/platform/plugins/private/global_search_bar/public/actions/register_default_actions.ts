/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { DASHBOARDS_PARENT_TITLE } from '../lib/dashboards_app';
import type { GlobalSearchAction, GlobalSearchActionExecuteContext } from './types';
import { getGlobalSearchActionById, registerGlobalSearchAction } from './registry';

const CREATE_DASHBOARD_ACTION_ID = 'create-dashboard';
const CREATE_DATA_VIEW_ACTION_ID = 'create-data-view';
const CREATE_VISUALIZATION_ACTION_ID = 'create-visualization';
const CREATE_RULE_ACTION_ID = 'create-rule';

const registerActionIfAbsent = (action: GlobalSearchAction): void => {
  if (getGlobalSearchActionById(action.id)) {
    return;
  }

  registerGlobalSearchAction(action);
};

export const registerDefaultGlobalSearchActions = (): void => {
  registerActionIfAbsent({
    id: CREATE_DASHBOARD_ACTION_ID,
    title: i18n.translate('xpack.globalSearchBar.actions.createDashboard.title', {
      defaultMessage: 'Create dashboard',
    }),
    appendLabel: DASHBOARDS_PARENT_TITLE,
    icon: 'plus',
    execute: ({ navigateToApp }: GlobalSearchActionExecuteContext) => {
      // Same navigation as the "Create dashboard" button on the All dashboards listing.
      navigateToApp('dashboards', { path: '#/create' });
    },
  });

  registerActionIfAbsent({
    id: CREATE_DATA_VIEW_ACTION_ID,
    title: i18n.translate('xpack.globalSearchBar.actions.createDataView.title', {
      defaultMessage: 'Create data view',
    }),
    appendLabel: i18n.translate('xpack.globalSearchBar.actions.createDataView.append', {
      defaultMessage: 'Management',
    }),
    icon: 'indexOpen',
    execute: ({ navigateToApp }: GlobalSearchActionExecuteContext) => {
      navigateToApp('management', { path: 'kibana/dataViews/create' });
    },
  });

  registerActionIfAbsent({
    id: CREATE_VISUALIZATION_ACTION_ID,
    title: i18n.translate('xpack.globalSearchBar.actions.createVisualization.title', {
      defaultMessage: 'Create visualization',
    }),
    appendLabel: DASHBOARDS_PARENT_TITLE,
    icon: 'chartBarVertical',
    execute: ({ navigateToApp }: GlobalSearchActionExecuteContext) => {
      navigateToApp('lens', { path: '/' });
    },
  });

  registerActionIfAbsent({
    id: CREATE_RULE_ACTION_ID,
    title: i18n.translate('xpack.globalSearchBar.actions.createRule.title', {
      defaultMessage: 'Create rule',
    }),
    appendLabel: i18n.translate('xpack.globalSearchBar.actions.createRule.append', {
      defaultMessage: 'Rules',
    }),
    icon: 'bell',
    execute: ({ navigateToApp }: GlobalSearchActionExecuteContext) => {
      navigateToApp('management', {
        path: 'insightsAndAlerting/triggersActions/rules/create',
      });
    },
  });
};
