/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFormPrepend } from '@elastic/eui';
import React from 'react';
import { i18nStrings } from '../strings';

const stopPointerActivation = (event: React.MouseEvent) => {
  event.stopPropagation();
};

export interface SearchNestedBackPrependProps {
  onClick: () => void;
}

export const SearchNestedBackPrepend = ({ onClick }: SearchNestedBackPrependProps) => (
  <EuiFormPrepend
    aria-label={i18nStrings.nestedBackAriaText}
    className="globalSearchNestedBackPrepend"
    data-test-subj="global-search-nested-back"
    iconLeft="arrowLeft"
    type="button"
    onMouseDown={stopPointerActivation}
    onClick={(event) => {
      stopPointerActivation(event);
      onClick();
    }}
  />
);
