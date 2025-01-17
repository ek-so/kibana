/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import { euiThemeVars } from '@kbn/ui-theme';

export const containerCss = css`
  border-bottom: 1px solid ${euiThemeVars.euiColorLightShade};
`;

export const itemContentCss = css`
  color: ${euiThemeVars.euiColorPrimary};
  flex-basis: content;
`;
