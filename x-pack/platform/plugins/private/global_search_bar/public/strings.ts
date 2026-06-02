/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

export const i18nStrings = {
  bucketRecent: i18n.translate('xpack.globalSearchBar.searchBar.bucket.recent', {
    defaultMessage: 'Recent',
  }),
  bucketNavigate: i18n.translate('xpack.globalSearchBar.searchBar.bucket.navigate', {
    defaultMessage: 'Navigate',
  }),
  bucketResults: i18n.translate('xpack.globalSearchBar.searchBar.bucket.results', {
    defaultMessage: 'Results',
  }),
  bucketActions: i18n.translate('xpack.globalSearchBar.searchBar.bucket.actions', {
    defaultMessage: 'Actions',
  }),
  recentMore: i18n.translate('xpack.globalSearchBar.searchBar.recent.more', {
    defaultMessage: 'More',
  }),
  recentShowAllAriaText: i18n.translate('xpack.globalSearchBar.searchBar.recent.showAllAriaText', {
    defaultMessage: 'Show all recent pages',
  }),
  actionsShowAllAriaText: i18n.translate('xpack.globalSearchBar.searchBar.actions.showAllAriaText', {
    defaultMessage: 'Show all actions',
  }),
  recentBackAriaText: i18n.translate('xpack.globalSearchBar.searchBar.recent.backAriaText', {
    defaultMessage: 'Back to search results',
  }),
  nestedBackAriaText: i18n.translate('xpack.globalSearchBar.searchBar.nested.backAriaText', {
    defaultMessage: 'Back to previous search',
  }),
  placeholderText: i18n.translate('xpack.globalSearchBar.searchBar.placeholder', {
    defaultMessage: 'Find pages, perform actions, ask Agent and more...',
  }),
  modalPlaceholderText: i18n.translate('xpack.globalSearchBar.searchModal.placeholder', {
    defaultMessage: 'Find pages, perform actions, ask Agent and more...',
  }),
  recentNestedPlaceholderText: i18n.translate(
    'xpack.globalSearchBar.searchModal.recentNestedPlaceholder',
    {
      defaultMessage: 'Find in recent...',
    }
  ),
  actionsNestedPlaceholderText: i18n.translate(
    'xpack.globalSearchBar.searchModal.actionsNestedPlaceholder',
    {
      defaultMessage: 'Find in actions...',
    }
  ),
  popoverButton: i18n.translate('xpack.globalSearchBar.searchBar.mobileSearchButtonAriaLabel', {
    defaultMessage: 'Site-wide search',
  }),
  showSearchAriaText: i18n.translate('xpack.globalSearchBar.searchBar.showSearchAriaText', {
    defaultMessage: 'Show search bar',
  }),
  closeSearchAriaText: i18n.translate('xpack.globalSearchBar.searchBar.closeSearchAriaText', {
    defaultMessage: 'Close search bar',
  }),
  keyboardShortcutTooltip: {
    prefix: i18n.translate('xpack.globalSearchBar.searchBar.shortcutTooltip.description', {
      defaultMessage: 'Keyboard shortcut',
    }),
    onMac: i18n.translate('xpack.globalSearchBar.searchBar.shortcutTooltip.macCommandDescription', {
      defaultMessage: 'Command + /',
    }),

    onNotMac: i18n.translate(
      'xpack.globalSearchBar.searchBar.shortcutTooltip.windowsCommandDescription',
      {
        defaultMessage: 'Control + /',
      }
    ),
  },
};
