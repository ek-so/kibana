/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiTitle } from '@elastic/eui';
import type { ReactNode } from 'react';
import React from 'react';

export interface GlobalSearchBucketHeaderProps {
  title: string;
  action?: ReactNode;
  'data-test-subj'?: string;
}

export const GlobalSearchBucketHeader = ({
  title,
  action,
  'data-test-subj': dataTestSubj,
}: GlobalSearchBucketHeaderProps) => (
  <div className="globalSearchBucketHeader" data-test-subj={dataTestSubj}>
    <EuiTitle size="xxxs">
      <h3>{title}</h3>
    </EuiTitle>
    {action ? <div className="globalSearchBucketHeader__action">{action}</div> : null}
  </div>
);
