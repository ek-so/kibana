/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiFormLabel,
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiSelectableTemplateSitewide,
  euiSelectableTemplateSitewideRenderOptions,
  mathWithUnits,
  useEuiBreakpoint,
  useEuiMinBreakpoint,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import React, { useCallback, useMemo, useState } from 'react';
import useEvent from 'react-use/lib/useEvent';
import useObservable from 'react-use/lib/useObservable';
import { isMac } from '@kbn/shared-ux-utility';
import { i18nStrings } from '../strings';
import type { SearchBarProps } from './types';
import { EmptyMessage } from './empty_message';
import { SearchPlaceholder } from './search_placeholder';
import { CharLimitExceededMessage } from './char_limit_exceeded_message';
import { SearchFooter } from './search_footer';
import { getGlobalSearchSelectableListHeight } from '../lib/get_global_search_list_height';
import { globalSearchSelectableListStyles } from '../lib/global_search_list_styles';
import { useSearchState } from '../hooks/use_search_state';
import { blurEvent } from '.';

export const SearchBar = ({
  globalSearch,
  taggingApi,
  navigateToUrl,
  reportEvent,
  chromeStyle$,
  basePathUrl,
  getNavigation$,
  prependBasePath,
  onOpenSearchModal,
}: SearchBarProps) => {
  const euiThemeContext = useEuiTheme();
  const { euiTheme } = euiThemeContext;
  const chromeStyle = useObservable(chromeStyle$);

  const [buttonRef, setButtonRef] = useState<HTMLDivElement | null>(null);
  const [showAppend, setShowAppend] = useState<boolean>(true);

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
    searchRef,
    triggerInitialLoad,
  } = useSearchState({
    globalSearch,
    taggingApi,
    navigateToUrl,
    reportEvent,
    getNavigation$,
    prependBasePath,
    onResultSelect: () => {
      (document.activeElement as HTMLElement).blur();
      if (searchRef.current) {
        setSearchValue('');
        searchRef.current.dispatchEvent(blurEvent);
      }
    },
  });

  const styles = css({
    [useEuiBreakpoint(['m', 'l'])]: {
      width: mathWithUnits(euiTheme.size.xxl, (x) => x * 10),
    },
    [useEuiMinBreakpoint('xl')]: {
      width: mathWithUnits(euiTheme.size.xxl, (x) => x * 15),
    },
  });

  const listHeight = useMemo(() => getGlobalSearchSelectableListHeight(options), [options]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === '/' && (isMac ? event.metaKey : event.ctrlKey)) {
        event.preventDefault();
        reportEvent.shortcutUsed();
        if (chromeStyle === 'project') {
          onOpenSearchModal?.();
          return;
        }
        if (searchRef.current) {
          searchRef.current.focus();
        } else if (buttonRef) {
          (buttonRef.children[0] as HTMLButtonElement).click();
        }
      }
    },
    [chromeStyle, buttonRef, searchRef, reportEvent, onOpenSearchModal]
  );

  const keyboardShortcutTooltip = `${i18nStrings.keyboardShortcutTooltip.prefix}: ${
    isMac ? i18nStrings.keyboardShortcutTooltip.onMac : i18nStrings.keyboardShortcutTooltip.onNotMac
  }`;

  useEvent('keydown', onKeyDown);

  if (chromeStyle === 'project') {
    return (
      <EuiHeaderSectionItemButton
        aria-label={i18nStrings.showSearchAriaText}
        color="text"
        data-test-subj="nav-search-reveal"
        onClick={() => {
          onOpenSearchModal?.();
        }}
      >
        <EuiIcon type="magnify" size="m" aria-hidden={true} />
      </EuiHeaderSectionItemButton>
    );
  }

  return (
    <EuiSelectableTemplateSitewide
      {...(listHeight !== undefined ? { height: listHeight } : {})}
      isLoading={isLoading}
      isPreFiltered
      onChange={onChange}
      onActiveOptionChange={onActiveOptionChange}
      options={options}
      css={styles}
      popoverButtonBreakpoints={['xs', 's']}
      singleSelection="always"
      renderOption={(option) => euiSelectableTemplateSitewideRenderOptions(option, searchValue)}
      colorModes={{ search: 'dark', popover: 'global' }}
      listProps={{
        ...selectableListProps,
        className: 'eui-yScroll',
        css: globalSearchSelectableListStyles(euiThemeContext),
      }}
      searchProps={{
        value: searchValue,
        onInput: (e: React.UIEvent<HTMLInputElement>) => setSearchValue(e.currentTarget.value),
        'data-test-subj': 'nav-search-input',
        inputRef: setSearchRef,
        compressed: true,
        'aria-label': i18nStrings.placeholderText,
        placeholder: i18nStrings.placeholderText,
        onFocus: () => {
          reportEvent.searchFocus();
          triggerInitialLoad();
          setShowAppend(false);
        },
        onBlur: () => {
          reportEvent.searchBlur();
          setShowAppend(!searchValue.length);
        },
        fullWidth: true,
        append: showAppend ? (
          <EuiFormLabel
            title={keyboardShortcutTooltip}
            css={{ fontFamily: euiTheme.font.familyCode }}
          >
            {isMac ? '⌘/' : '^/'}
          </EuiFormLabel>
        ) : undefined,
      }}
      errorMessage={
        searchCharLimitExceeded ? <CharLimitExceededMessage basePathUrl={basePathUrl} /> : null
      }
      emptyMessage={<EmptyMessage />}
      noMatchesMessage={<SearchPlaceholder basePath={basePathUrl} />}
      popoverProps={{
        zIndex: Number(euiTheme.levels.navigation),
        'data-test-subj': 'nav-search-popover',
        panelClassName: 'navSearch__panel',
        repositionOnScroll: true,
        popoverRef: setButtonRef,
        panelStyle: { marginTop: '6px' },
      }}
      popoverButton={
        <EuiHeaderSectionItemButton aria-label={i18nStrings.popoverButton}>
          <EuiIcon type="magnify" size="m" aria-hidden={true} />
        </EuiHeaderSectionItemButton>
      }
      popoverFooter={<SearchFooter />}
    />
  );
};
