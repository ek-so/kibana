/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ChromeStyle, NavigationTreeDefinitionUI } from '@kbn/core-chrome-browser';
import type { ApplicationStart } from '@kbn/core/public';
import type { GlobalSearchPluginStart } from '@kbn/global-search-plugin/public';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import type { Observable } from 'rxjs';
import type { EventReporter } from '../telemetry';

export const SEARCH_MODAL_SELECTOR_PREFIX = 'chromeProjectNextSearchModal';
export const SEARCH_MODAL_HEIGHT_PX = 560;
export const SEARCH_MODAL_WIDTH_PX = 800;
export const SEARCH_MODAL_PADDING_PX = 8;
/** Row height for virtualized global search lists (EuiSelectableTemplateSitewide default). */
export const GLOBAL_SEARCH_LIST_ROW_HEIGHT_PX = 40;

/** Max height of the results list in the search popover. */
export const GLOBAL_SEARCH_POPOVER_LIST_MAX_HEIGHT_PX = 500;

export const SEARCH_MODAL_ROW_HEIGHT_PX = GLOBAL_SEARCH_LIST_ROW_HEIGHT_PX;

export interface ProjectNavigationState {
  navigationTree: NavigationTreeDefinitionUI;
}

/* @internal */
export interface SearchProps {
  globalSearch: GlobalSearchPluginStart & { searchCharLimit: number };
  navigateToUrl: ApplicationStart['navigateToUrl'];
  reportEvent: EventReporter;
  taggingApi?: SavedObjectTaggingPluginStart;
  basePathUrl: string;
  getNavigation$?: () => Observable<ProjectNavigationState | null>;
  prependBasePath?: (path: string) => string;
}

/* @internal */
export interface SearchBarProps extends SearchProps {
  chromeStyle$: Observable<ChromeStyle>;
  onOpenSearchModal?: () => void;
}

/* @internal */
export interface SearchModalProps extends SearchProps {
  onClose: () => void;
}
