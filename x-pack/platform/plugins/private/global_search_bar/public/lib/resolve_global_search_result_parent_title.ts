/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { NavigationParentContext } from '@kbn/core-chrome-browser';
import { DASHBOARD_SAVED_OBJECT_TYPE, DASHBOARDS_PARENT_TITLE } from './dashboards_app';

export const resolveGlobalSearchResultParentTitle = ({
  type,
  navigation,
}: {
  type: string;
  navigation?: NavigationParentContext;
}): string | undefined => {
  if (navigation?.title) {
    return navigation.title;
  }

  if (type === DASHBOARD_SAVED_OBJECT_TYPE) {
    return DASHBOARDS_PARENT_TITLE;
  }

  return undefined;
};
