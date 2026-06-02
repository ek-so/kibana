/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreStart, OverlayRef } from '@kbn/core/public';
import React from 'react';
import { toMountPoint } from '@kbn/react-kibana-mount';
import { SearchModal } from '../components/search_modal';
import type { SearchProps } from '../components/types';
import { SEARCH_MODAL_SELECTOR_PREFIX } from '../components/types';

export interface SearchModalController {
  openSearchModal: () => void;
  closeSearchModal: () => void;
  toggleSearchModal: () => void;
}

export const createSearchModalController = (
  core: CoreStart,
  searchProps: SearchProps
): SearchModalController => {
  let activeModalRef: OverlayRef | null = null;
  let modalSessionId = 0;

  const closeSearchModal = () => {
    activeModalRef?.close();
    activeModalRef = null;
  };

  const openSearchModal = () => {
    if (activeModalRef) {
      return;
    }

    modalSessionId += 1;

    activeModalRef = core.overlays.openModal(
      toMountPoint(
        <SearchModal
          key={modalSessionId}
          {...searchProps}
          onClose={() => {
            closeSearchModal();
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

  const toggleSearchModal = () => {
    if (activeModalRef) {
      closeSearchModal();
      return;
    }

    openSearchModal();
  };

  return { openSearchModal, closeSearchModal, toggleSearchModal };
};
