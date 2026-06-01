/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import type { SearchSuggestion } from '../suggestions';
import { createGlobalSearchResultPrepend } from './global_search_result_prepend_icon';

export const suggestionToOption = (
  suggestion: SearchSuggestion
): EuiSelectableTemplateSitewideOption => {
  const { key, label, description, icon, suggestedSearch } = suggestion;
  return {
    key,
    label,
    type: '__suggestion__',
    prepend: createGlobalSearchResultPrepend(icon),
    suggestion: suggestedSearch,
    meta: [{ text: description }],
    'data-test-subj': `nav-search-option`,
  };
};
