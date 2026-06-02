/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import React from 'react';
import { i18nStrings } from '../strings';

const stopPointerActivation = (event: React.MouseEvent) => {
  event.stopPropagation();
};

export interface SearchModalConfigureAppendProps {
  onClick: () => void;
}

export const SearchModalConfigureAppend = ({ onClick }: SearchModalConfigureAppendProps) => (
  <EuiToolTip content={i18nStrings.configureSearchResultsTooltip} anchorProps={{ className: 'globalSearchModalConfigureAppend' }}>
    <EuiButtonIcon
      aria-label={i18nStrings.configureSearchResultsAriaText}
      color="text"
      data-test-subj="global-search-modal-configure"
      display="empty"
      iconType="gear"
      onMouseDown={stopPointerActivation}
      onClick={(event) => {
        stopPointerActivation(event);
        onClick();
      }}
      size="s"
    />
  </EuiToolTip>
);
