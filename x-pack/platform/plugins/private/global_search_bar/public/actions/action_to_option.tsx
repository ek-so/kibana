/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import { GlobalSearchResultAppend } from '../components/global_search_result_append';
import { createGlobalSearchResultPrepend } from '../lib/global_search_result_prepend_icon';
import type { GlobalSearchAction } from './types';
import { GLOBAL_SEARCH_ACTION_OPTION_TYPE } from './types';

export const actionToOption = (action: GlobalSearchAction): EuiSelectableTemplateSitewideOption => {
  const option: EuiSelectableTemplateSitewideOption = {
    key: action.id,
    label: action.title,
    type: GLOBAL_SEARCH_ACTION_OPTION_TYPE,
    prepend: createGlobalSearchResultPrepend(action.icon, 'primary'),
    'data-test-subj': 'nav-search-action-option',
  };

  if (action.appendLabel) {
    option.append = (
      <GlobalSearchResultAppend parentTitle={action.appendLabel} tags={[]} searchTagIds={[]} />
    );
  }

  return option;
};
