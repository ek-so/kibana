/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

export const DASHBOARD_SAVED_OBJECT_TYPE = 'dashboard';

export const DASHBOARDS_APP_PATH = '/app/dashboards';

/** Product icon for dashboard saved objects in global search cells. */
export const DASHBOARD_RESULT_ICON = 'productDashboard';

export const DASHBOARDS_PARENT_TITLE = i18n.translate(
  'xpack.globalSearchBar.actions.createDashboard.append',
  {
    defaultMessage: 'Dashboards',
  }
);
