/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButtonEmpty, EuiButtonIcon } from '@elastic/eui';
import React from 'react';
import { i18nStrings } from '../strings';

const stopPointerActivation = (event: React.MouseEvent) => {
  event.stopPropagation();
};

export interface RecentBucketMoreButtonProps {
  onClick: () => void;
}

export const RecentBucketMoreButton = ({ onClick }: RecentBucketMoreButtonProps) => (
  <EuiButtonEmpty
    aria-label={i18nStrings.recentShowAllAriaText}
    className="globalSearchBucketHeader__more"
    color="primary"
    data-test-subj="global-search-recent-more"
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
    {i18nStrings.recentMore}
  </EuiButtonEmpty>
);
