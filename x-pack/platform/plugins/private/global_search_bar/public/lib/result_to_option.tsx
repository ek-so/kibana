/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import type { GlobalSearchResult } from '@kbn/global-search-plugin/common/types';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import type { Tag } from '@kbn/saved-objects-tagging-oss-plugin/common';
import { GlobalSearchResultAppend } from '../components/global_search_result_append';

export const resultToOption = (
  result: GlobalSearchResult,
  searchTagIds: string[],
  getTagList?: SavedObjectTaggingPluginStart['ui']['getTagList'],
  getNavigationParentTitle?: (url: string) => string | undefined
): EuiSelectableTemplateSitewideOption => {
  const { id, title, url, icon, type, meta = {} } = result;
  const { tagIds = [] } = meta as { tagIds: string[] };
  // only displaying icons for applications and integrations
  const useIcon =
    type === 'application' ||
    type === 'integration' ||
    type.toLowerCase() === 'enterprise search' ||
    type.toLowerCase() === 'elasticsearch' ||
    type.toLowerCase() === 'search' ||
    type.toLowerCase() === 'index' ||
    type.toLowerCase() === 'connector';
  const option: EuiSelectableTemplateSitewideOption = {
    key: id,
    label: title,
    url,
    type,
    icon: { type: useIcon && icon ? icon : 'empty' },
    'data-test-subj': `nav-search-option`,
  };

  const matchedTags: Tag[] = [];

  if (tagIds.length && getTagList) {
    const tagList = getTagList();
    for (let i = 0; i < tagIds.length; i++) {
      const foundTag = tagList.find((tag) => tag.id === tagIds[i]);
      if (!foundTag) {
        //  eslint-disable-next-line no-console
        console.warn(
          `SearchBar: Tag with id "${tagIds[i]}" not found. Tag "${tagIds[i]}" is referenced by the search result "${result.type}:${result.id}". Skipping displaying the missing tag.`
        );
      } else {
        matchedTags.push(foundTag);
      }
    }
  }

  const parentTitle = getNavigationParentTitle?.(result.url);

  if (parentTitle || matchedTags.length > 0) {
    option.append = (
      <GlobalSearchResultAppend
        parentTitle={parentTitle}
        tags={matchedTags}
        searchTagIds={searchTagIds}
      />
    );
  }

  return option;
};
