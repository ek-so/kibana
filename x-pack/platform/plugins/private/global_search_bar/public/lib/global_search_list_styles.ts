/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import type { UseEuiTheme } from '@elastic/eui';
import { globalSearchBucketHeaderStyles } from '../buckets/bucket_header_styles';
import { SEARCH_MODAL_ROW_HEIGHT_PX } from '../components/types';

const APPEND_OFFSET_PX = 4;
const MODAL_PREPEND_ICON_WRAPPER_SIZE_PX = 28;
const MODAL_PREPEND_ICON_SIZE_PX = 14;

export const globalSearchSelectableListStyles = (euiThemeContext: UseEuiTheme) => css`
  ${globalSearchBucketHeaderStyles(euiThemeContext)}

  .euiSelectableListItem:not(.globalSearchBucketHeader) {
    overflow: hidden;
  }

  .euiSelectableListItem__append {
    margin-inline-start: -${APPEND_OFFSET_PX}px;
    padding-inline-end: ${APPEND_OFFSET_PX}px;
  }
`;

/** Fixed 40px rows for the project search modal (results and section headers). */
export const globalSearchModalListStyles = (euiThemeContext: UseEuiTheme) => css`
  ${globalSearchSelectableListStyles(euiThemeContext)}

  .euiSelectableListItem {
    block-size: ${SEARCH_MODAL_ROW_HEIGHT_PX}px;
    min-block-size: ${SEARCH_MODAL_ROW_HEIGHT_PX}px;
    max-block-size: ${SEARCH_MODAL_ROW_HEIGHT_PX}px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .euiSelectableListItem .euiListItemLayout,
  .euiSelectableListItem .euiListItemLayout__action {
    min-block-size: 100%;
  }

  .euiSelectableListItem .euiListItemLayout__text {
    padding-block: 0;
  }

  .euiSelectableListItem [data-test-subj='globalSearchResultPrependIcon'] {
    inline-size: ${MODAL_PREPEND_ICON_WRAPPER_SIZE_PX}px;
    block-size: ${MODAL_PREPEND_ICON_WRAPPER_SIZE_PX}px;
  }

  .euiSelectableListItem [data-test-subj='globalSearchResultPrependIcon'] .euiIcon {
    inline-size: ${MODAL_PREPEND_ICON_SIZE_PX}px;
    block-size: ${MODAL_PREPEND_ICON_SIZE_PX}px;
  }

  .globalSearchBucketHeader.euiSelectableListItem::before {
    display: none;
  }
`;
