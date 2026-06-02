/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IconType } from '@elastic/eui';
import type { NavigationParentContext } from '@kbn/core-chrome-browser';

/** Prepend icon for search results that are not in the project navigation menu. */
export const GLOBAL_SEARCH_OFF_MENU_ICON: IconType = 'grid';

const isIntegrationType = (type: string): boolean => type === 'integration';

const usesResultProviderIcon = (type: string): boolean =>
  type === 'application' ||
  isIntegrationType(type) ||
  type.toLowerCase() === 'enterprise search' ||
  type.toLowerCase() === 'elasticsearch' ||
  type.toLowerCase() === 'search' ||
  type.toLowerCase() === 'index' ||
  type.toLowerCase() === 'connector';

export const resolveGlobalSearchPrependIcon = ({
  type,
  resultIcon,
  navigation,
}: {
  type: string;
  resultIcon?: string;
  navigation?: NavigationParentContext;
}): IconType => {
  if (navigation?.icon) {
    return navigation.icon;
  }

  if (navigation?.matchedInNavigation === false) {
    if (isIntegrationType(type)) {
      return resultIcon ?? GLOBAL_SEARCH_OFF_MENU_ICON;
    }

    // Applications outside the nav tree use a neutral icon so solution logos are not misleading.
    if (type === 'application') {
      return GLOBAL_SEARCH_OFF_MENU_ICON;
    }

    // Saved objects and other in-app pages (e.g. favorited dashboards) keep their type icon.
    if (resultIcon) {
      return resultIcon;
    }

    return GLOBAL_SEARCH_OFF_MENU_ICON;
  }

  if (usesResultProviderIcon(type) && resultIcon) {
    return resultIcon;
  }

  if (resultIcon) {
    return resultIcon;
  }

  return 'empty';
};
