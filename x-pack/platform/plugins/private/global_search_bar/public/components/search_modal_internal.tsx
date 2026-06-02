/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiFieldSearch,
  EuiHorizontalRule,
  EuiLoadingSpinner,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { i18nStrings } from '../strings';
import { SearchFooter } from './search_footer';
import { SearchPlaceholder } from './search_placeholder';
import { useSearchState } from '../hooks/use_search_state';
import type { SearchModalProps } from './types';
import { globalSearchModalListStyles } from '../lib/global_search_list_styles';
import { EmptyMessage } from './empty_message';
import { SEARCH_MODAL_PADDING_PX, SEARCH_MODAL_SELECTOR_PREFIX } from './types';
import { CharLimitExceededMessage } from './char_limit_exceeded_message';
import { useSearchModalStack } from '../hooks/use_search_modal_stack';
import {
  GLOBAL_SEARCH_MODAL_RECENT_SCREEN_ID,
  isRecentModalScreen,
} from '../search_modal/search_modal_stack';
import { SearchNestedBackPrepend } from './search_nested_back_prepend';
import { GlobalSearchBucketHeader } from './global_search_bucket_header';
import { SearchModalBucketSelectable } from './search_modal_bucket_selectable';
import type { SearchModalBucketSection } from '../buckets/build_modal_bucket_sections';

export const SearchModalInternal = ({
  globalSearch,
  taggingApi,
  navigateToUrl,
  reportEvent,
  basePathUrl,
  onClose,
  getNavigation$,
  prependBasePath,
}: SearchModalProps) => {
  const { euiTheme } = useEuiTheme();
  const modalStack = useSearchModalStack();
  const { currentScreen, isNested, pushScreen, popScreen, resetStack } = modalStack;

  const searchValueRef = useRef('');
  const setSearchValueRef = useRef<(value: string) => void>(() => {});
  const nestedRecentContext = isNested && isRecentModalScreen(currentScreen.id);

  const {
    searchValue,
    setSearchValue,
    isLoading,
    searchCharLimitExceeded,
    onChange,
    onActiveOptionChange,
    selectableListProps,
    setSearchRef,
    triggerInitialLoad,
    modalBucketSections,
    suggestionOptions,
  } = useSearchState({
    globalSearch,
    taggingApi,
    navigateToUrl,
    reportEvent,
    getNavigation$,
    prependBasePath,
    onResultSelect: onClose,
    nestedRecentContext,
    useModalBucketLayout: true,
    onShowAllRecent: () => {
      pushScreen(
        { id: GLOBAL_SEARCH_MODAL_RECENT_SCREEN_ID, title: i18nStrings.bucketRecent },
        searchValueRef.current
      );
      setSearchValueRef.current('');
    },
  });

  searchValueRef.current = searchValue;
  setSearchValueRef.current = setSearchValue;

  const showRecentListInNested = nestedRecentContext && searchValue.trim() === '';

  const handleNestedBack = useCallback(() => {
    const parentSnapshot = popScreen();
    if (parentSnapshot) {
      setSearchValue(parentSnapshot.searchValue);
    }
  }, [popScreen, setSearchValue]);

  useEffect(() => {
    triggerInitialLoad();
    reportEvent.searchFocus();

    return () => {
      reportEvent.searchBlur();
      resetStack();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyles = css`
    padding-block-start: ${SEARCH_MODAL_PADDING_PX}px;
    padding-inline: ${SEARCH_MODAL_PADDING_PX}px;
    padding-block-end: 0;
  `;

  const bodyStyles = css`
    .euiModalBody__overflow {
      padding: ${SEARCH_MODAL_PADDING_PX}px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0;
    }

    ${globalSearchModalListStyles({ euiTheme })}
  `;

  const footerStyles = css`
    padding: ${SEARCH_MODAL_PADDING_PX}px;
  `;

  const hasBucketContent =
    modalBucketSections.length > 0 || suggestionOptions.length > 0;
  const showEmptyState = !isLoading && !hasBucketContent && !searchCharLimitExceeded;
  const showNoMatches =
    !isLoading &&
    !searchCharLimitExceeded &&
    searchValue.trim().length > 0 &&
    modalBucketSections.length === 0 &&
    suggestionOptions.length === 0;

  const renderBucketSection = (section: SearchModalBucketSection, index: number) => (
    <React.Fragment key={section.id}>
      {index > 0 ? (
        <div className="globalSearchModalSectionDivider">
          <EuiHorizontalRule margin="none" />
        </div>
      ) : null}
      <section className="globalSearchModalBucket" data-test-subj={`global-search-modal-bucket-${section.id}`}>
        <GlobalSearchBucketHeader
          title={section.title}
          action={section.headerAction}
          data-test-subj={`global-search-bucket-${section.id}`}
        />
        <SearchModalBucketSelectable
          options={section.options}
          searchValue={searchValue}
          onChange={onChange}
          onActiveOptionChange={onActiveOptionChange}
          listProps={selectableListProps}
          data-test-subj={`global-search-modal-bucket-${section.id}-list`}
        />
      </section>
    </React.Fragment>
  );

  return (
    <>
      <EuiModalHeader
        css={headerStyles}
        data-test-subj={
          isNested
            ? `${SEARCH_MODAL_SELECTOR_PREFIX}HeaderNested`
            : `${SEARCH_MODAL_SELECTOR_PREFIX}Header`
        }
      >
        <EuiFieldSearch
          autoFocus
          fullWidth
          value={searchValue}
          onChange={(event) => setSearchValue(event.currentTarget.value)}
          prepend={
            isNested ? <SearchNestedBackPrepend onClick={handleNestedBack} /> : undefined
          }
          inputRef={setSearchRef}
          data-test-subj={`${SEARCH_MODAL_SELECTOR_PREFIX}Input`}
          aria-label={i18nStrings.modalPlaceholderText}
          placeholder={
            showRecentListInNested ? currentScreen.title : i18nStrings.modalPlaceholderText
          }
          isInvalid={searchCharLimitExceeded}
        />
      </EuiModalHeader>

      {searchCharLimitExceeded ? (
        <div css={css`padding: 0 ${SEARCH_MODAL_PADDING_PX}px`}>
          <CharLimitExceededMessage basePathUrl={basePathUrl} />
        </div>
      ) : null}

      <EuiModalBody css={bodyStyles}>
        {isLoading && !hasBucketContent ? (
          <EuiLoadingSpinner size="m" css={css`align-self: center`} />
        ) : null}

        {suggestionOptions.length > 0 ? (
          <section
            className="globalSearchModalBucket"
            data-test-subj="global-search-modal-bucket-suggestions"
          >
            <SearchModalBucketSelectable
              options={suggestionOptions}
              searchValue={searchValue}
              onChange={onChange}
              onActiveOptionChange={onActiveOptionChange}
              listProps={selectableListProps}
              data-test-subj="global-search-modal-bucket-suggestions-list"
            />
          </section>
        ) : null}

        {suggestionOptions.length > 0 && modalBucketSections.length > 0 ? (
          <div className="globalSearchModalSectionDivider">
            <EuiHorizontalRule margin="none" />
          </div>
        ) : null}

        {modalBucketSections.map(renderBucketSection)}

        {showEmptyState ? <EmptyMessage /> : null}
        {showNoMatches ? <SearchPlaceholder basePath={basePathUrl} /> : null}
      </EuiModalBody>

      <EuiHorizontalRule margin="none" />
      <EuiModalFooter
        css={footerStyles}
        data-test-subj={`${SEARCH_MODAL_SELECTOR_PREFIX}Footer`}
      >
        <SearchFooter />
      </EuiModalFooter>
    </>
  );
};
