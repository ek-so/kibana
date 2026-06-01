/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '@kbn/global-search-plugin/public';
import type { RecentPageRecord } from './types';

const STORAGE_KEY_PREFIX = 'kibana.globalSearch.recent.v1';
const MAX_RECENT_ITEMS = 10;

/** Maximum recent pages shown in the main search popover before "More". */
export const RECENT_ITEMS_MAIN_LIMIT = 3;

export const getActiveSpaceId = (): string => {
  if (typeof window === 'undefined') {
    return 'default';
  }
  const match = window.location.pathname.match(/\/s\/([^/]+)\//);
  return match?.[1] ?? 'default';
};

const getStorageKey = (spaceId: string) => `${STORAGE_KEY_PREFIX}.${spaceId}`;

const readRecords = (spaceId: string): RecentPageRecord[] => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(spaceId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as RecentPageRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeRecords = (spaceId: string, records: RecentPageRecord[]) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(getStorageKey(spaceId), JSON.stringify(records));
};

export const recordRecentPage = (result: GlobalSearchResult, spaceId = getActiveSpaceId()) => {
  const records = readRecords(spaceId).filter((record) => record.url !== result.url);
  const next: RecentPageRecord = {
    id: result.id,
    type: result.type,
    title: result.title,
    url: result.url,
    icon: result.icon,
    meta: result.meta,
    lastAccessed: Date.now(),
  };

  writeRecords(spaceId, [next, ...records].slice(0, MAX_RECENT_ITEMS));
};

export const getRecentPages = (spaceId = getActiveSpaceId()): GlobalSearchResult[] => {
  return readRecords(spaceId)
    .sort((a, b) => b.lastAccessed - a.lastAccessed)
    .map((record) => ({
      id: record.id,
      type: record.type,
      title: record.title,
      url: record.url,
      icon: record.icon,
      meta: record.meta,
      score: 100,
    }));
};

