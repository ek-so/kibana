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
    ${logicalCSS('padding-block', euiTheme.size.xs)}
    min-block-size: auto;

    &:not(:first-child) {
      ${logicalCSS('padding-block-start', euiTheme.size.s)}

      &::before {
        inset-block-start: ${euiTheme.size.xs};
      }
    }
  }
`;
