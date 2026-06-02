/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18nStrings } from '../strings';
import { GlobalSearchBucketMoreButton } from '../buckets/bucket_more_button';

export interface FavoritesBucketMoreButtonProps {
  onClick: () => void;
}

export const FavoritesBucketMoreButton = ({ onClick }: FavoritesBucketMoreButtonProps) => (
  <GlobalSearchBucketMoreButton
    onClick={onClick}
    ariaLabel={i18nStrings.favoritesShowAllAriaText}
    data-test-subj="global-search-favorites-more"
  />
);
