/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '@kbn/global-search-plugin/common/types';
import { isGlobalSearchFavoriteResult } from '@kbn/global-search-plugin/public';
import type { GlobalSearchResultPrependIconColor } from './global_search_result_prepend_icon';

export const resolveResultPrependIconColor = (
  result: GlobalSearchResult,
  override?: GlobalSearchResultPrependIconColor
): GlobalSearchResultPrependIconColor | undefined =>
  override ?? (isGlobalSearchFavoriteResult(result) ? 'accent' : undefined);
