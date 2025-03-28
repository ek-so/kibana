/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { estypes } from '@elastic/elasticsearch';
import { Filter, FilterMeta, FILTERS, FilterStateStore } from './types';

/** @public */
export type CustomFilter = Filter;

/**
 *
 * @param indexPatternString
 * @param queryDsl
 * @param disabled
 * @param negate
 * @param alias
 * @param store
 * @returns
 *
 * @public
 */
export function buildCustomFilter(
  indexPatternString: string,
  queryDsl: estypes.QueryDslQueryContainer,
  disabled: boolean,
  negate: boolean,
  alias: string | null,
  store: FilterStateStore
): Filter {
  const meta: FilterMeta = {
    index: indexPatternString,
    type: FILTERS.CUSTOM,
    disabled,
    negate,
    alias,
  };
  const filter: Filter = { ...queryDsl, meta };
  filter.$state = { store };
  return filter;
}
