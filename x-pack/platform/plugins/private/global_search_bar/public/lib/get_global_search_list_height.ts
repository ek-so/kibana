/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import {
  GLOBAL_SEARCH_LIST_ROW_HEIGHT_PX,
  GLOBAL_SEARCH_POPOVER_LIST_MAX_HEIGHT_PX,
} from '../components/types';

/** Matches EUI `getListItemSize` extra height for non-first group labels. */
export const GLOBAL_SEARCH_GROUP_LABEL_EXTRA_HEIGHT_PX = 16;

/**
 * Height for a virtualized selectable list: sum of row sizes up to `maxHeight`.
 * Mirrors EUI `getListItemSize` so list height matches rendered rows.
 */
export const getGlobalSearchSelectableListHeight = (
  options: EuiSelectableTemplateSitewideOption[],
  {
    rowHeight = GLOBAL_SEARCH_LIST_ROW_HEIGHT_PX,
    maxHeight = GLOBAL_SEARCH_POPOVER_LIST_MAX_HEIGHT_PX,
  }: {
    rowHeight?: number;
    maxHeight?: number;
  } = {}
): number | undefined => {
  if (options.length === 0) {
    return undefined;
  }

  const contentHeight = options.reduce((total, option, index) => {
    if (option.isGroupLabel) {
      return (
        total +
        (index > 0 ? rowHeight + GLOBAL_SEARCH_GROUP_LABEL_EXTRA_HEIGHT_PX : rowHeight)
      );
    }

    return total + rowHeight;
  }, 0);

  return Math.min(contentHeight, maxHeight);
};
