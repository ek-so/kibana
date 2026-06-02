/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '@kbn/global-search-plugin/public';
import type { GlobalSearchAction } from '../actions/types';

export const matchesBucketSubsetSearchTerm = (value: string, term: string): boolean =>
  term.length === 0 || value.toLowerCase().includes(term.toLowerCase());

export const filterRecentPagesByTerm = (
  items: GlobalSearchResult[],
  term: string
): GlobalSearchResult[] =>
  items.filter((item) => matchesBucketSubsetSearchTerm(item.title, term));

export const filterFavoritesByTerm = (
  items: GlobalSearchResult[],
  term: string
): GlobalSearchResult[] =>
  items.filter((item) => matchesBucketSubsetSearchTerm(item.title, term));

export const filterActionsByTerm = (
  actions: GlobalSearchAction[],
  term: string
): GlobalSearchAction[] =>
  actions.filter(
    (action) =>
      matchesBucketSubsetSearchTerm(action.title, term) ||
      (action.appendLabel ? matchesBucketSubsetSearchTerm(action.appendLabel, term) : false)
  );
