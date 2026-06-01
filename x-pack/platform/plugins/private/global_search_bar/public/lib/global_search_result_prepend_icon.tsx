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

export interface GlobalSearchResultPrependIconProps {
  type: IconType;
}

export const GlobalSearchResultPrependIcon = ({ type }: GlobalSearchResultPrependIconProps) => {
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
    background-color: ${euiTheme.colors.backgroundLightText};
  `;

  const iconStyles = css`
    inline-size: ${GLOBAL_SEARCH_RESULT_ICON_SIZE_PX}px;
    block-size: ${GLOBAL_SEARCH_RESULT_ICON_SIZE_PX}px;
  `;

  return (
    <span css={wrapperStyles} data-test-subj="globalSearchResultPrependIcon">
      <EuiIcon type={type} color="subdued" size="s" css={iconStyles} aria-hidden />
    </span>
  );
};

export const createGlobalSearchResultPrepend = (type: IconType): React.ReactNode | undefined => {
  if (type === 'empty') {
    return undefined;
  }

  return <GlobalSearchResultPrependIcon type={type} />;
};
