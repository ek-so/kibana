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
    ${logicalCSS('padding-vertical', euiTheme.size.xs)}
    ${logicalCSS('padding-left', euiTheme.size.s)}
    min-block-size: auto;

    &::before {
      pointer-events: none;
    }

    &:not(:first-child) {
      ${logicalCSS('padding-top', euiTheme.size.s)}

      &::before {
        inset-block-start: ${euiTheme.size.xs};
      }
    }
  }

  .globalSearchBucketHeader__more {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }

  .globalSearchBucketHeader--withMore {
    justify-content: space-between;
  }

  .globalSearchBucketHeader__more {
    ${logicalCSS('margin-left', 'auto')}
    ${logicalCSS('margin-right', `calc(-1 * ${euiTheme.size.xs})`)}
  }
`;
