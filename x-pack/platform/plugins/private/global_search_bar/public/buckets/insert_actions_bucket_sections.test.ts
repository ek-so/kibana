/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { GLOBAL_SEARCH_BUCKET_ACTIONS, GLOBAL_SEARCH_BUCKET_RECENT } from '@kbn/global-search-plugin/public';
import {
  buildActionsModalSection,
  insertActionsModalSections,
} from './insert_actions_bucket_sections';
import type { SearchModalBucketSection } from './build_modal_bucket_sections';

const createAction = (id: string) => ({
  id,
  title: `Action ${id}`,
  icon: 'plus' as const,
  execute: jest.fn(),
});

describe('insertActionsModalSections', () => {
  it('inserts the actions section after recent when the query is empty', () => {
    const sections: SearchModalBucketSection[] = [
      { id: GLOBAL_SEARCH_BUCKET_RECENT, title: 'Recent', options: [] },
      { id: 'navigate' as SearchModalBucketSection['id'], title: 'Navigate', options: [] },
    ];

    const result = insertActionsModalSections({
      sections,
      actions: [createAction('create-dashboard')],
      actionsTitle: 'Actions',
      term: '',
      view: 'main',
    });

    expect(result.map((section) => section.id)).toEqual([
      GLOBAL_SEARCH_BUCKET_RECENT,
      GLOBAL_SEARCH_BUCKET_ACTIONS,
      'navigate',
    ]);
    expect(result[1].options).toHaveLength(1);
  });

  it('does not insert actions when the user is searching in the main view', () => {
    const sections: SearchModalBucketSection[] = [
      { id: GLOBAL_SEARCH_BUCKET_RECENT, title: 'Recent', options: [] },
    ];

    const result = insertActionsModalSections({
      sections,
      actions: [createAction('create-dashboard')],
      actionsTitle: 'Actions',
      term: 'dash',
      view: 'main',
    });

    expect(result).toBe(sections);
  });

  it('returns only the actions section in the nested actions view', () => {
    const result = insertActionsModalSections({
      sections: [],
      actions: [createAction('a'), createAction('b')],
      actionsTitle: 'Actions',
      term: '',
      view: 'actions',
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(GLOBAL_SEARCH_BUCKET_ACTIONS);
    expect(result[0].options).toHaveLength(2);
  });

  it('filters actions in the nested actions view', () => {
    const result = insertActionsModalSections({
      sections: [],
      actions: [createAction('create-dashboard'), createAction('create-rule')],
      actionsTitle: 'Actions',
      term: 'rule',
      view: 'actions',
    });

    expect(result).toHaveLength(1);
    expect(result[0].options).toHaveLength(1);
    expect(result[0].options[0].key).toBe('create-rule');
  });
});

describe('buildActionsModalSection', () => {
  it('adds a More header action when there are more actions than the main limit', () => {
    const onShowAllActions = jest.fn();
    const section = buildActionsModalSection({
      actions: ['a', 'b', 'c', 'd'].map(createAction),
      actionsTitle: 'Actions',
      view: 'main',
      onShowAllActions,
    });

    expect(section?.options).toHaveLength(3);
    expect(section?.headerAction).toBeTruthy();
  });
});
