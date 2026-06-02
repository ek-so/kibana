/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import { getGlobalSearchSelectableListHeight } from './get_global_search_list_height';

describe('getGlobalSearchSelectableListHeight', () => {
  it('returns undefined when there are no options', () => {
    expect(getGlobalSearchSelectableListHeight([])).toBeUndefined();
  });

  it('sums row heights to fit content', () => {
    const options: EuiSelectableTemplateSitewideOption[] = [
      { label: 'Recent', isGroupLabel: true },
      { label: 'Discover', key: '1' },
      { label: 'Dashboard', key: '2' },
    ];

    expect(getGlobalSearchSelectableListHeight(options, { rowHeight: 52, maxHeight: 500 })).toBe(156);
  });

  it('adds extra height for group labels after the first', () => {
    const options: EuiSelectableTemplateSitewideOption[] = [
      { label: 'Recent', isGroupLabel: true },
      { label: 'Discover', key: '1' },
      { label: 'Navigate', isGroupLabel: true },
      { label: 'Settings', key: '2' },
    ];

    expect(getGlobalSearchSelectableListHeight(options, { rowHeight: 52, maxHeight: 500 })).toBe(224);
  });

  it('caps height at the configured maximum', () => {
    const options = Array.from({ length: 20 }, (_, index) => ({
      label: `Item ${index}`,
      key: `${index}`,
    }));

    expect(getGlobalSearchSelectableListHeight(options, { rowHeight: 52, maxHeight: 500 })).toBe(500);
  });
});
