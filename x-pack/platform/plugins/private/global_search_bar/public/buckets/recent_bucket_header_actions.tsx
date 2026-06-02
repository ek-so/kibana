/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18nStrings } from '../strings';
import { GlobalSearchBucketMoreButton } from './bucket_more_button';

export interface RecentBucketMoreButtonProps {
  onClick: () => void;
}

export const RecentBucketMoreButton = ({ onClick }: RecentBucketMoreButtonProps) => (
  <GlobalSearchBucketMoreButton
    onClick={onClick}
    ariaLabel={i18nStrings.recentShowAllAriaText}
    data-test-subj="global-search-recent-more"
  />
);
