/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import type { UseEuiTheme } from '@elastic/eui';
import { globalSearchBucketHeaderStyles } from '../buckets/bucket_header_styles';

const APPEND_OFFSET_PX = 4;

export const globalSearchSelectableListStyles = (euiThemeContext: UseEuiTheme) => css`
  ${globalSearchBucketHeaderStyles(euiThemeContext)}

  .euiSelectableListItem__append {
    margin-inline-start: -${APPEND_OFFSET_PX}px;
    padding-inline-end: ${APPEND_OFFSET_PX}px;
  }
`;
