/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '@kbn/core/public';
import type { InternalChromeStart } from '@kbn/core-chrome-browser-internal';
import type { GlobalSearchPluginStart } from '@kbn/global-search-plugin/public';
import type { SavedObjectTaggingPluginStart } from '@kbn/saved-objects-tagging-plugin/public';
import type { UsageCollectionSetup } from '@kbn/usage-collection-plugin/public';
import React from 'react';
import { map } from 'rxjs';
import { SearchBar } from './components/search_bar';
import type { GlobalSearchBarConfigType } from './types';
import { EventReporter, eventTypes } from './telemetry';
import type { SearchProps } from './components/types';
import { createSearchModalController } from './lib/search_modal_controller';

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

    const { openSearchModal, toggleSearchModal } = createSearchModalController(core, searchProps);

    if (core.chrome.next.isEnabled) {
      core.chrome.next.globalSearch.set({
        onClick: toggleSearchModal,
      });
    }

    core.chrome.navControls.registerCenter({
      order: 1000,
      content: (
        <SearchBar
          {...searchProps}
          chromeStyle$={core.chrome.getChromeStyle$()}
          onOpenSearchModal={openSearchModal}
        />
      ),
    });

    return {};
  }
}
