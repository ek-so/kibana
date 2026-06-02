/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import type { NavigationParentContext } from '@kbn/core-chrome-browser';
import type { GlobalSearchResult } from '@kbn/global-search-plugin/common/types';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import type { Tag } from '@kbn/saved-objects-tagging-oss-plugin/common';
import { GlobalSearchResultAppend } from '../components/global_search_result_append';
import { resolveGlobalSearchPrependIcon } from './global_search_result_icon';
import { createGlobalSearchResultPrepend } from './global_search_result_prepend_icon';
import type { GlobalSearchResultPrependIconColor } from './global_search_result_prepend_icon';
import { resolveResultPrependIconColor } from './resolve_result_prepend_icon_color';
import { resolveGlobalSearchResultParentTitle } from './resolve_global_search_result_parent_title';

export const resultToOption = (
  result: GlobalSearchResult,
  searchTagIds: string[],
  getTagList?: SavedObjectTaggingPluginStart['ui']['getTagList'],
  getNavigationParent?: (url: string) => NavigationParentContext,
  prependIconColor?: GlobalSearchResultPrependIconColor
): EuiSelectableTemplateSitewideOption => {
  const { id, title, url, icon, type, meta = {} } = result;
  const { tagIds = [] } = meta as { tagIds: string[] };
  const navigation = getNavigationParent?.(url);
  const parentTitle = resolveGlobalSearchResultParentTitle({ type, navigation });

  const prependIconType = resolveGlobalSearchPrependIcon({
    type,
    resultIcon: icon,
    navigation,
  });

  const option: EuiSelectableTemplateSitewideOption = {
    key: id,
    label: title,
    url,
    type,
    prepend: createGlobalSearchResultPrepend(
      prependIconType,
      resolveResultPrependIconColor(result, prependIconColor)
    ),
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
