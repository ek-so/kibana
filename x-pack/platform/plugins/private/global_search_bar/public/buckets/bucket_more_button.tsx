/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButtonEmpty } from '@elastic/eui';
import React from 'react';
import { i18nStrings } from '../strings';

const stopPointerActivation = (event: React.MouseEvent) => {
  event.stopPropagation();
};

export interface GlobalSearchBucketMoreButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  label?: string;
  'data-test-subj'?: string;
}

export const GlobalSearchBucketMoreButton = ({
  onClick,
  ariaLabel = i18nStrings.recentShowAllAriaText,
  label = i18nStrings.recentMore,
  'data-test-subj': dataTestSubj = 'global-search-bucket-more',
}: GlobalSearchBucketMoreButtonProps) => (
  <EuiButtonEmpty
    aria-label={ariaLabel}
    className="globalSearchBucketHeader__more"
    color="primary"
    data-test-subj={dataTestSubj}
    type="button"
    onMouseDown={stopPointerActivation}
    onClick={(event) => {
      stopPointerActivation(event);
      onClick();
    }}
    iconType="chevronSingleRight"
    iconSide="right"
    size="xs"
  >
    {label}
  </EuiButtonEmpty>
);
