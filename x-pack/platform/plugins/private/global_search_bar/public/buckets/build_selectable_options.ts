/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import type { GlobalSearchBucket, GlobalSearchBucketId } from '@kbn/global-search-plugin/public';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import type { SearchSuggestion } from '../suggestions';
import { resultToOption, suggestionToOption } from '../lib';

export interface BucketDisplayConfig {
  id: GlobalSearchBucketId;
  title: string;
}

export const buildSelectableOptionsFromBuckets = ({
  buckets,
  bucketTitles,
  suggestions,
  searchTagIds,
  getTagList,
}: {
  buckets: GlobalSearchBucket[];
  bucketTitles: Record<GlobalSearchBucketId, string>;
  suggestions: SearchSuggestion[];
  searchTagIds: string[];
  getTagList?: SavedObjectTaggingPluginStart['ui']['getTagList'];
}): EuiSelectableTemplateSitewideOption[] => {
  const options: EuiSelectableTemplateSitewideOption[] = suggestions.map(suggestionToOption);

  for (const bucket of buckets) {
    if (bucket.items.length === 0) {
      continue;
    }

    options.push({
      label: bucketTitles[bucket.id],
      isGroupLabel: true,
      'data-test-subj': `global-search-bucket-${bucket.id}`,
    });

    for (const item of bucket.items) {
      options.push({
        ...resultToOption(item, searchTagIds, getTagList),
        'data-test-subj': `nav-search-option`,
      });
    }
  }

  return options;
};
