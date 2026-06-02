/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import type { ReactNode } from 'react';
import React from 'react';
import { GLOBAL_SEARCH_BUCKET_ACTIONS, GLOBAL_SEARCH_BUCKET_RECENT } from '@kbn/global-search-plugin/public';
import { ACTIONS_ITEMS_MAIN_LIMIT } from '../actions/constants';
import { actionToOption } from '../actions/action_to_option';
import type { GlobalSearchAction } from '../actions/types';
import { filterActionsByTerm } from './filter_bucket_subset';
import type { GlobalSearchResultsView } from './build_selectable_options';
import type { SearchModalBucketSection } from './build_modal_bucket_sections';
import { GlobalSearchBucketMoreButton } from './bucket_more_button';
import { i18nStrings } from '../strings';

export const shouldShowGlobalSearchActions = (
  term: string,
  view: GlobalSearchResultsView
): boolean => view === 'actions' || view === 'main';

const getMainViewActions = (
  actions: GlobalSearchAction[],
  term: string
): GlobalSearchAction[] =>
  term.length === 0 ? actions : filterActionsByTerm(actions, term);

const buildActionsSection = ({
  actions,
  title,
  headerAction,
}: {
  actions: GlobalSearchAction[];
  title: string;
  headerAction?: ReactNode;
}): SearchModalBucketSection => ({
  id: GLOBAL_SEARCH_BUCKET_ACTIONS,
  title,
  options: actions.map(actionToOption),
  headerAction,
});

export const buildActionsModalSection = ({
  actions,
  actionsTitle,
  view,
  onShowAllActions,
}: {
  actions: GlobalSearchAction[];
  actionsTitle: string;
  view: GlobalSearchResultsView;
  onShowAllActions?: () => void;
}): SearchModalBucketSection | undefined => {
  if (actions.length === 0) {
    return undefined;
  }

  if (view === 'actions') {
    return buildActionsSection({ actions, title: actionsTitle });
  }

  const visibleActions = actions.slice(0, ACTIONS_ITEMS_MAIN_LIMIT);
  const hasMoreActions =
    actions.length > ACTIONS_ITEMS_MAIN_LIMIT && onShowAllActions !== undefined;

  if (visibleActions.length === 0) {
    return undefined;
  }

  return buildActionsSection({
    actions: visibleActions,
    title: actionsTitle,
    headerAction: hasMoreActions ? (
      <GlobalSearchBucketMoreButton
        onClick={onShowAllActions}
        ariaLabel={i18nStrings.actionsShowAllAriaText}
        data-test-subj="global-search-actions-more"
      />
    ) : undefined,
  });
};

export const insertActionsModalSections = ({
  sections,
  actions,
  actionsTitle,
  term,
  view,
  onShowAllActions,
}: {
  sections: SearchModalBucketSection[];
  actions: GlobalSearchAction[];
  actionsTitle: string;
  term: string;
  view: GlobalSearchResultsView;
  onShowAllActions?: () => void;
}): SearchModalBucketSection[] => {
  if (!shouldShowGlobalSearchActions(term, view)) {
    return sections;
  }

  if (view === 'actions') {
    const actionsSection = buildActionsModalSection({
      actions: filterActionsByTerm(actions, term),
      actionsTitle,
      view,
      onShowAllActions,
    });

    return actionsSection ? [actionsSection] : [];
  }

  const mainViewActions = getMainViewActions(actions, term);
  const actionsSection = buildActionsModalSection({
    actions: mainViewActions,
    actionsTitle,
    view,
    onShowAllActions: term.length === 0 ? onShowAllActions : undefined,
  });

  if (!actionsSection) {
    return sections;
  }

  const recentIndex = sections.findIndex((section) => section.id === GLOBAL_SEARCH_BUCKET_RECENT);
  const insertAt = recentIndex >= 0 ? recentIndex + 1 : 0;

  return [...sections.slice(0, insertAt), actionsSection, ...sections.slice(insertAt)];
};

export const insertActionsSelectableOptions = ({
  options,
  actions,
  actionsTitle,
  term,
  view,
  onShowAllActions,
}: {
  options: EuiSelectableTemplateSitewideOption[];
  actions: GlobalSearchAction[];
  actionsTitle: string;
  term: string;
  view: GlobalSearchResultsView;
  onShowAllActions?: () => void;
}): EuiSelectableTemplateSitewideOption[] => {
  if (!shouldShowGlobalSearchActions(term, view)) {
    return options;
  }

  if (view === 'actions') {
    const filteredActions = filterActionsByTerm(actions, term);

    if (filteredActions.length === 0) {
      return [];
    }

    return [
      {
        label: actionsTitle,
        isGroupLabel: true,
        className: 'globalSearchBucketHeader',
        'data-test-subj': `global-search-bucket-${GLOBAL_SEARCH_BUCKET_ACTIONS}-all`,
      },
      ...filteredActions.map(actionToOption),
    ];
  }

  const mainViewActions = getMainViewActions(actions, term);
  const visibleActions = mainViewActions.slice(0, ACTIONS_ITEMS_MAIN_LIMIT);
  const hasMoreActions =
    term.length === 0 &&
    actions.length > ACTIONS_ITEMS_MAIN_LIMIT &&
    onShowAllActions !== undefined;

  if (visibleActions.length === 0) {
    return options;
  }

  const actionsHeader: EuiSelectableTemplateSitewideOption = {
    label: actionsTitle,
    isGroupLabel: true,
    className: 'globalSearchBucketHeader',
    append: hasMoreActions ? (
      <GlobalSearchBucketMoreButton
        onClick={onShowAllActions}
        ariaLabel={i18nStrings.actionsShowAllAriaText}
        data-test-subj="global-search-actions-more"
      />
    ) : undefined,
    'data-test-subj': `global-search-bucket-${GLOBAL_SEARCH_BUCKET_ACTIONS}`,
  };

  const actionOptions = visibleActions.map(actionToOption);
  const recentHeaderIndex = options.findIndex(
    (option) => option['data-test-subj'] === `global-search-bucket-${GLOBAL_SEARCH_BUCKET_RECENT}`
  );

  if (recentHeaderIndex < 0) {
    return [actionsHeader, ...actionOptions, ...options];
  }

  let insertAt = recentHeaderIndex + 1;
  for (let i = recentHeaderIndex + 1; i < options.length; i++) {
    if (options[i].isGroupLabel) {
      break;
    }
    insertAt = i + 1;
  }

  return [
    ...options.slice(0, insertAt),
    actionsHeader,
    ...actionOptions,
    ...options.slice(insertAt),
  ];
};
