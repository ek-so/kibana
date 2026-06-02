/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import type { UseEuiTheme } from '@elastic/eui';
import { globalSearchBucketHeaderStyles } from '../buckets/bucket_header_styles';
import {
  SEARCH_MODAL_BUCKET_HEADER_HEIGHT_PX,
  SEARCH_MODAL_PADDING_PX,
  SEARCH_MODAL_ROW_HEIGHT_PX,
} from '../components/types';

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

/** Modal bucket lists: fixed 40px rows, compact icons, truncated append. */
export const globalSearchModalListStyles = (euiThemeContext: UseEuiTheme) => css`
  ${globalSearchSelectableListStyles(euiThemeContext)}

  .globalSearchModalBucket__list .euiSelectableListItem {
    block-size: ${SEARCH_MODAL_ROW_HEIGHT_PX}px;
    min-block-size: ${SEARCH_MODAL_ROW_HEIGHT_PX}px;
    max-block-size: ${SEARCH_MODAL_ROW_HEIGHT_PX}px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .globalSearchModalBucket__list .euiListItemLayout,
  .globalSearchModalBucket__list .euiListItemLayout__action {
    min-block-size: 100%;
  }

  .globalSearchModalBucket__list .euiListItemLayout__text {
    padding-block: 0;
  }

  .globalSearchModalBucket__list .euiListItemLayout__append {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .globalSearchModalBucket__list [data-test-subj='globalSearchResultPrependIcon'] {
    inline-size: ${MODAL_PREPEND_ICON_WRAPPER_SIZE_PX}px;
    block-size: ${MODAL_PREPEND_ICON_WRAPPER_SIZE_PX}px;
  }

  .globalSearchModalBucket__list [data-test-subj='globalSearchResultPrependIcon'] .euiIcon {
    inline-size: ${MODAL_PREPEND_ICON_SIZE_PX}px;
    block-size: ${MODAL_PREPEND_ICON_SIZE_PX}px;
  }

  .globalSearchModalSectionDivider {
    margin-block: ${SEARCH_MODAL_PADDING_PX}px;
    padding: 0;
  }

  .globalSearchModalBucket .globalSearchBucketHeader:not(.euiSelectableListItem) {
    block-size: ${SEARCH_MODAL_BUCKET_HEADER_HEIGHT_PX}px;
    min-block-size: ${SEARCH_MODAL_BUCKET_HEADER_HEIGHT_PX}px;
    max-block-size: ${SEARCH_MODAL_BUCKET_HEADER_HEIGHT_PX}px;
    padding-block: 0;
    box-sizing: border-box;
  }

  .globalSearchModalBucket .globalSearchBucketHeader:not(.euiSelectableListItem) h3 {
    margin: 0;
  }

  .globalSearchModalBucket .euiSelectable {
    flex: 0 0 auto;
  }

  .globalSearchModalBucket .euiSelectableList {
    flex: 0 0 auto;
  }
`;
