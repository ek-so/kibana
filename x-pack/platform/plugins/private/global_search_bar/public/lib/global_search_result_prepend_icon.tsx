/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { css } from '@emotion/react';
import { EuiIcon, useEuiTheme, type IconType } from '@elastic/eui';

export const GLOBAL_SEARCH_RESULT_ICON_SIZE_PX = 16;
export const GLOBAL_SEARCH_RESULT_ICON_WRAPPER_SIZE_PX = 32;

export type GlobalSearchResultPrependIconColor = 'subdued' | 'primary' | 'accent';

export interface GlobalSearchResultPrependIconProps {
  type: IconType;
  color?: GlobalSearchResultPrependIconColor;
}

export const GlobalSearchResultPrependIcon = ({
  type,
  color = 'subdued',
}: GlobalSearchResultPrependIconProps) => {
  const { euiTheme } = useEuiTheme();

  if (type === 'empty') {
    return null;
  }

  const wrapperStyles = css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    inline-size: ${GLOBAL_SEARCH_RESULT_ICON_WRAPPER_SIZE_PX}px;
    block-size: ${GLOBAL_SEARCH_RESULT_ICON_WRAPPER_SIZE_PX}px;
    border-radius: 50%;
    background-color: ${color === 'primary'
      ? euiTheme.colors.backgroundLightPrimary
      : color === 'accent'
      ? euiTheme.colors.backgroundLightAccent
      : euiTheme.colors.backgroundLightText};
  `;

  const iconStyles = css`
    inline-size: ${GLOBAL_SEARCH_RESULT_ICON_SIZE_PX}px;
    block-size: ${GLOBAL_SEARCH_RESULT_ICON_SIZE_PX}px;
    ${color === 'accent' ? `color: ${euiTheme.colors.accent};` : ''}
  `;

  const iconColor = color === 'accent' ? undefined : color;

  return (
    <span css={wrapperStyles} data-test-subj="globalSearchResultPrependIcon">
      <EuiIcon type={type} color={iconColor} size="s" css={iconStyles} aria-hidden />
    </span>
  );
};

export const createGlobalSearchResultPrepend = (
  type: IconType,
  color?: GlobalSearchResultPrependIconColor
): React.ReactNode | undefined => {
  if (type === 'empty') {
    return undefined;
  }

  return <GlobalSearchResultPrependIcon type={type} color={color} />;
};
