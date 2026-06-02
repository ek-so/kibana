/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import { EuiHorizontalRule } from '@elastic/eui';
import React from 'react';

export const GLOBAL_SEARCH_BUCKET_DIVIDER_CLASS = 'globalSearchBucketDivider';

export const isGlobalSearchBucketDividerOption = (
  option: Pick<EuiSelectableTemplateSitewideOption, 'className'>
): boolean => option.className?.includes(GLOBAL_SEARCH_BUCKET_DIVIDER_CLASS) ?? false;

export const createBucketDividerOption = (): EuiSelectableTemplateSitewideOption => ({
  label: ' ',
  disabled: true,
  className: GLOBAL_SEARCH_BUCKET_DIVIDER_CLASS,
  'data-test-subj': 'global-search-bucket-divider',
});

export const GlobalSearchBucketDivider = () => (
  <EuiHorizontalRule aria-hidden margin="none" />
);
