/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import type { UseEuiTheme } from '@elastic/eui';
import { logicalCSS } from '@elastic/eui';
export const globalSearchBucketHeaderStyles = ({ euiTheme }: UseEuiTheme) => css`
  .globalSearchBucketHeader.euiSelectableListItem {
    display: flex;
    align-items: center;
    gap: ${euiTheme.size.xs};
    inline-size: 100%;
    min-block-size: auto;

    &::before {
      display: none;
    }
  }

  .globalSearchBucketHeader:not(.euiSelectableListItem) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${euiTheme.size.xs};
    box-sizing: border-box;
    inline-size: 100%;
  }

  .globalSearchBucketHeader__action,
  .globalSearchBucketHeader__more {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    ${logicalCSS('margin-left', 'auto')}
  }
`;
