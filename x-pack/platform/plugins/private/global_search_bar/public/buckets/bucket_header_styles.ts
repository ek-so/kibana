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
  .euiSelectableList__groupLabel {
    display: flex;
    align-items: center;
    gap: ${euiTheme.size.xs};
    inline-size: 100%;
    ${logicalCSS('padding-block', euiTheme.size.xs)}
    min-block-size: auto;

    &::before {
      pointer-events: none;
    }

    &:not(:first-child) {
      ${logicalCSS('padding-block-start', euiTheme.size.s)}

      &::before {
        inset-block-start: ${euiTheme.size.xs};
      }
    }
  }

  .globalSearchBucketHeader__more,
  .globalSearchBucketHeader__back {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }

  .globalSearchBucketHeader--withMore {
    justify-content: space-between;
  }

  .globalSearchBucketHeader__more {
    ${logicalCSS('margin-inline-start', 'auto')}
    ${logicalCSS('margin-inline-end', `calc(-1 * ${euiTheme.size.xs})`)}
  }
`;
