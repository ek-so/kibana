/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  CoreSetup,
  CoreStart,
  OverlayRef,
  Plugin,
  PluginInitializerContext,
} from '@kbn/core/public';
import type { InternalChromeStart } from '@kbn/core-chrome-browser-internal';
import type { GlobalSearchPluginStart } from '@kbn/global-search-plugin/public';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import type { UsageCollectionSetup } from '@kbn/usage-collection-plugin/public';
import React from 'react';
import { map } from 'rxjs';
import { toMountPoint } from '@kbn/react-kibana-mount';
import { SearchBar } from './components/search_bar';
import type { GlobalSearchBarConfigType } from './types';
import { EventReporter, eventTypes } from './telemetry';
import type { SearchProps } from './components/types';
import { SEARCH_MODAL_SELECTOR_PREFIX } from './components/types';
import { SearchModal } from './components/search_modal';

export interface GlobalSearchBarPluginStartDeps {
  globalSearch: GlobalSearchPluginStart;
  savedObjectsTagging?: SavedObjectTaggingPluginStart;
  usageCollection?: UsageCollectionSetup;
}

export class GlobalSearchBarPlugin implements Plugin<{}, {}, {}, GlobalSearchBarPluginStartDeps> {
  private config: GlobalSearchBarConfigType;

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<GlobalSearchBarConfigType>();
  }

  public setup({ analytics }: CoreSetup) {
    eventTypes.forEach((eventType) => {
      analytics.registerEventType(eventType);
    });

    return {};
  }

  public start(core: CoreStart, startDeps: GlobalSearchBarPluginStartDeps) {
    const { globalSearch, savedObjectsTagging, usageCollection } = startDeps;
    const { application, http } = core;
    const reportEvent = new EventReporter({ analytics: core.analytics, usageCollection });
    const internalChrome = core.chrome as InternalChromeStart;

    const searchProps: SearchProps = {
      globalSearch: { ...globalSearch, searchCharLimit: this.config.input_max_limit },
      navigateToUrl: application.navigateToUrl,
      taggingApi: savedObjectsTagging,
      basePathUrl: http.basePath.prepend('/plugins/globalSearchBar/assets/'),
      reportEvent,
      getNavigation$: internalChrome.project?.getNavigation$
        ? () =>
            internalChrome.project.getNavigation$().pipe(map(({ navigationTree }) => ({ navigationTree })))
        : undefined,
      prependBasePath: http.basePath.prepend.bind(http.basePath),
    };

    let activeModalRef: OverlayRef | null = null;
    let modalSessionId = 0;

    const closeModal = () => {
      activeModalRef?.close();
      activeModalRef = null;
    };

    const toggleSearchModal = () => {
      if (activeModalRef) {
        closeModal();
        return;
      }

      modalSessionId += 1;

      activeModalRef = core.overlays.openModal(
        toMountPoint(
          <SearchModal
            key={modalSessionId}
            {...searchProps}
            onClose={() => {
              closeModal();
            }}
          />,
          core
        ),
        {
          className: SEARCH_MODAL_SELECTOR_PREFIX,
          'data-test-subj': SEARCH_MODAL_SELECTOR_PREFIX,
          outsideClickCloses: true,
        }
      );
      activeModalRef.onClose.then(() => {
        activeModalRef = null;
      });
    };

    if (core.chrome.next.isEnabled) {
      core.chrome.next.globalSearch.set({
        onClick: toggleSearchModal,
      });
    }

    core.chrome.navControls.registerCenter({
      order: 1000,
      content: <SearchBar {...searchProps} chromeStyle$={core.chrome.getChromeStyle$()} />,
    });

    return {};
  }
}
