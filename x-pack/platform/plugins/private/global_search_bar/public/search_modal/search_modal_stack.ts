/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/** Root screen of the global search modal stack. */
export const GLOBAL_SEARCH_MODAL_ROOT_SCREEN_ID = 'root';

/** All recent pages screen (opened from Recent → More). */
export const GLOBAL_SEARCH_MODAL_RECENT_SCREEN_ID = 'recent';

/** Extend with new screen ids; push via `useSearchModalStack().pushScreen({ id, title }, searchValue)`. */
export type GlobalSearchModalScreenId =
  | typeof GLOBAL_SEARCH_MODAL_ROOT_SCREEN_ID
  | typeof GLOBAL_SEARCH_MODAL_RECENT_SCREEN_ID
  | (string & {});

export interface GlobalSearchModalStackSnapshot {
  searchValue: string;
}

export interface GlobalSearchModalStackFrame {
  id: GlobalSearchModalScreenId;
  /** Context label shown in the nested search input (e.g. section title or query). */
  title: string;
  snapshot: GlobalSearchModalStackSnapshot;
}

export const createRootStackFrame = (): GlobalSearchModalStackFrame => ({
  id: GLOBAL_SEARCH_MODAL_ROOT_SCREEN_ID,
  title: '',
  snapshot: { searchValue: '' },
});

export const isRecentModalScreen = (
  screenId: GlobalSearchModalScreenId
): screenId is typeof GLOBAL_SEARCH_MODAL_RECENT_SCREEN_ID =>
  screenId === GLOBAL_SEARCH_MODAL_RECENT_SCREEN_ID;
