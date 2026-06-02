/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiSelectable,
  type EuiSelectableProps,
  type EuiSelectableTemplateSitewideOption,
  euiSelectableTemplateSitewideRenderOptions,
} from '@elastic/eui';
import React from 'react';
import { SEARCH_MODAL_ROW_HEIGHT_PX } from './types';

export interface SearchModalBucketSelectableProps {
  options: EuiSelectableTemplateSitewideOption[];
  searchValue: string;
  onChange: EuiSelectableProps['onChange'];
  onActiveOptionChange: EuiSelectableProps['onActiveOptionChange'];
  listProps?: EuiSelectableProps['listProps'];
  'data-test-subj'?: string;
}

export const SearchModalBucketSelectable = ({
  options,
  searchValue,
  onChange,
  onActiveOptionChange,
  listProps,
  'data-test-subj': dataTestSubj,
}: SearchModalBucketSelectableProps) => {
  if (options.length === 0) {
    return null;
  }

  return (
    <EuiSelectable
      data-test-subj={dataTestSubj}
      isPreFiltered
      onChange={onChange}
      onActiveOptionChange={onActiveOptionChange}
      options={options}
      renderOption={(option) => euiSelectableTemplateSitewideRenderOptions(option, searchValue)}
      searchable={false}
      singleSelection="always"
      listProps={{
        ...listProps,
        rowHeight: SEARCH_MODAL_ROW_HEIGHT_PX,
        isVirtualized: false,
        showIcons: false,
        className: 'globalSearchModalBucket__list',
      }}
    >
      {(list) => list}
    </EuiSelectable>
  );
};
