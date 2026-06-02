/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiHorizontalRule,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiSelectable,
  euiSelectableTemplateSitewideRenderOptions,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { i18nStrings } from '../strings';
import { SearchFooter } from './search_footer';
import { SearchPlaceholder } from './search_placeholder';
import { useSearchState } from '../hooks/use_search_state';
import type { SearchModalProps } from './types';
import { globalSearchSelectableListStyles } from '../lib/global_search_list_styles';
import { EmptyMessage } from './empty_message';
import { SEARCH_MODAL_PADDING_PX, SEARCH_MODAL_SELECTOR_PREFIX } from './types';
import { CharLimitExceededMessage } from './char_limit_exceeded_message';
import { useSearchModalStack } from '../hooks/use_search_modal_stack';
import {
  GLOBAL_SEARCH_MODAL_RECENT_SCREEN_ID,
  isRecentModalScreen,
} from '../search_modal/search_modal_stack';
import { SearchNestedBackPrepend } from './search_nested_back_prepend';

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
    options,
    isLoading,
    searchCharLimitExceeded,
    onChange,
    onActiveOptionChange,
    selectableListProps,
    setSearchRef,
    triggerInitialLoad,
  } = useSearchState({
    globalSearch,
    taggingApi,
    navigateToUrl,
    reportEvent,
    getNavigation$,
    prependBasePath,
    onResultSelect: onClose,
    nestedRecentContext,
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
    // Intentionally mount-only: `triggerInitialLoad` changes when options update; re-running
    // would reset the nested stack right after "More" is clicked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyles = css`
    padding: ${SEARCH_MODAL_PADDING_PX}px;
  `;

  const bodyStyles = css`
    .euiModalBody__overflow {
      padding: ${SEARCH_MODAL_PADDING_PX}px;
      display: flex;
      flex-direction: column;
      justify-content: ${isLoading || options.length === 0 ? 'center' : 'flex-start'};
    }

    ${globalSearchSelectableListStyles({ euiTheme })}
  `;

  const footerStyles = css`
    padding: ${SEARCH_MODAL_PADDING_PX}px;
  `;

  return (
    <EuiSelectable
      isLoading={isLoading}
      isPreFiltered
      onChange={onChange}
      onActiveOptionChange={onActiveOptionChange}
      options={options}
      singleSelection="always"
      renderOption={(option) =>
        euiSelectableTemplateSitewideRenderOptions(option, searchValue)
      }
      listProps={{
        ...selectableListProps,
        className: 'eui-yScroll',
        showIcons: false,
      }}
      height="full"
      searchProps={{
        autoFocus: true,
        value: searchValue,
        onInput: (e: React.UIEvent<HTMLInputElement>) => setSearchValue(e.currentTarget.value),
        prepend: isNested ? (
          <SearchNestedBackPrepend onClick={handleNestedBack} />
        ) : undefined,
        'data-test-subj': `${SEARCH_MODAL_SELECTOR_PREFIX}Input`,
        inputRef: setSearchRef,
        compressed: false,
        'aria-label': i18nStrings.modalPlaceholderText,
        placeholder: showRecentListInNested
          ? currentScreen.title
          : i18nStrings.modalPlaceholderText,
        fullWidth: true,
      }}
      errorMessage={
        searchCharLimitExceeded ? <CharLimitExceededMessage basePathUrl={basePathUrl} /> : null
      }
      emptyMessage={<EmptyMessage />}
      noMatchesMessage={<SearchPlaceholder basePath={basePathUrl} />}
      searchable
    >
      {(list, search) => (
        <>
          <EuiModalHeader
            css={headerStyles}
            data-test-subj={
              isNested
                ? `${SEARCH_MODAL_SELECTOR_PREFIX}HeaderNested`
                : `${SEARCH_MODAL_SELECTOR_PREFIX}Header`
            }
          >
            {search}
          </EuiModalHeader>
          <EuiModalBody css={bodyStyles}>{list}</EuiModalBody>
          <EuiHorizontalRule margin="none" />
          <EuiModalFooter
            css={footerStyles}
            data-test-subj={`${SEARCH_MODAL_SELECTOR_PREFIX}Footer`}
          >
            <SearchFooter />
          </EuiModalFooter>
        </>
      )}
    </EuiSelectable>
  );
};
