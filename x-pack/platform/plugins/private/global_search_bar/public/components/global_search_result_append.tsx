/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import type { Tag } from '@kbn/saved-objects-tagging-oss-plugin/common';
import { ResultTagList } from './result_tag_list';

interface GlobalSearchResultAppendProps {
  parentTitle?: string;
  tags?: Tag[];
  searchTagIds: string[];
}

export const GlobalSearchResultAppend = ({
  parentTitle,
  tags = [],
  searchTagIds,
}: GlobalSearchResultAppendProps) => {
  if (!parentTitle && tags.length === 0) {
    return null;
  }

  return (
    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
      {parentTitle ? (
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            {parentTitle}
          </EuiText>
        </EuiFlexItem>
      ) : null}
      {tags.length > 0 ? (
        <EuiFlexItem grow={false}>
          <ResultTagList tags={tags} searchTagIds={searchTagIds} />
        </EuiFlexItem>
      ) : null}
    </EuiFlexGroup>
  );
};
