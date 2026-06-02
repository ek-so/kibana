/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFlexGroup, EuiFlexItem, EuiTitle } from '@elastic/eui';
import { css } from '@emotion/react';
import React from 'react';
import { SEARCH_MODAL_ROW_HEIGHT_PX } from './types';
import { SearchNestedBackPrepend } from './search_nested_back_prepend';

export interface SearchModalNestedTitleHeaderProps {
  title: string;
  onBack: () => void;
}

export const SearchModalNestedTitleHeader = ({ title, onBack }: SearchModalNestedTitleHeaderProps) => (
  <EuiFlexGroup
    alignItems="center"
    gutterSize="s"
    responsive={false}
    css={css`
      min-block-size: ${SEARCH_MODAL_ROW_HEIGHT_PX}px;
    `}
    data-test-subj="global-search-modal-nested-title-header"
  >
    <EuiFlexItem grow={false}>
      <SearchNestedBackPrepend onClick={onBack} />
    </EuiFlexItem>
    <EuiFlexItem>
      <EuiTitle size="xs">
        <h2>{title}</h2>
      </EuiTitle>
    </EuiFlexItem>
  </EuiFlexGroup>
);
