/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '@testing-library/react';
import type { GlobalSearchResult } from '@kbn/global-search-plugin/common/types';
import { GLOBAL_SEARCH_FAVORITE_META_KEY } from '@kbn/global-search-plugin/public';
import type { Tag } from '@kbn/saved-objects-tagging-oss-plugin/common';
import { resultToOption } from './result_to_option';

const getPrependIconType = (prepend: React.ReactNode): string | undefined => {
  const { container } = render(React.createElement(React.Fragment, null, prepend));
  return container.querySelector('[data-euiicon-type]')?.getAttribute('data-euiicon-type') ?? undefined;
};

const createSearchResult = (parts: Partial<GlobalSearchResult> = {}): GlobalSearchResult => ({
  id: 'id',
  title: 'title',
  type: 'application',
  icon: 'some-icon',
  score: 100,
  url: '/url',
  meta: {},
  ...parts,
});

describe('resultToOption', () => {
  it('converts the result to the expected format', () => {
    const input = createSearchResult({});
    const option = resultToOption(input, []);
    expect(option).toEqual(
      expect.objectContaining({
        key: input.id,
        label: input.title,
        url: input.url,
        type: input.type,
        'data-test-subj': expect.any(String),
      })
    );
    expect(option.prepend).toBeDefined();
    expect(getPrependIconType(option.prepend)).toBeDefined();
  });

  it('uses icon for `application` type', () => {
    const input = createSearchResult({ type: 'application', icon: 'app-icon' });
    const option = resultToOption(input, []);

    expect(getPrependIconType(option.prepend)).toBe('app-icon');
  });

  it('uses icon for `integration` type', () => {
    const input = createSearchResult({ type: 'integration', icon: 'integ-icon' });
    const option = resultToOption(input, []);

    expect(getPrependIconType(option.prepend)).toBe('integ-icon');
  });

  it('uses icon for `index` type', () => {
    const input = createSearchResult({ type: 'index', icon: 'index-icon' });
    const option = resultToOption(input, []);

    expect(getPrependIconType(option.prepend)).toBe('index-icon');
  });

  it('uses icon for `connector` type', () => {
    const input = createSearchResult({ type: 'connector', icon: 'connector-icon' });
    const option = resultToOption(input, []);

    expect(getPrependIconType(option.prepend)).toBe('connector-icon');
  });

  it('uses the result icon for dashboard items not in the navigation menu', () => {
    const input = createSearchResult({ type: 'dashboard', icon: 'productDashboard' });
    const option = resultToOption(input, [], undefined, () => ({ matchedInNavigation: false }));

    expect(getPrependIconType(option.prepend)).toBe('productDashboard');
  });

  it('keeps the integration icon when not in the navigation menu', () => {
    const input = createSearchResult({ type: 'integration', icon: 'integ-icon' });
    const option = resultToOption(input, [], undefined, () => ({ matchedInNavigation: false }));

    expect(getPrependIconType(option.prepend)).toBe('integ-icon');
  });

  it('uses the provider icon for applications not in the menu when navigation is unavailable', () => {
    const input = createSearchResult({ type: 'application', icon: 'logoKibana' });
    const option = resultToOption(input, []);

    expect(getPrependIconType(option.prepend)).toBe('logoKibana');
  });

  it("doesn't crash on unknown tag", () => {
    const input = createSearchResult({
      type: 'dashboard',
      meta: { categoryLabel: 'category', displayName: 'foo', tagIds: ['known', 'unknown'] },
    });

    const getTagList = (): Tag[] => {
      return [
        {
          id: 'known',
          name: 'Known',
          description: 'Known',
          managed: false,
          color: '#000000',
        },
      ];
    };
    const logSpy = jest.spyOn(console, 'warn').mockImplementation();

    const option = resultToOption(input, [], getTagList);
    expect(logSpy).toBeCalledWith(
      'SearchBar: Tag with id "unknown" not found. Tag "unknown" is referenced by the search result "dashboard:id". Skipping displaying the missing tag.'
    );
    expect(option.append).toMatchInlineSnapshot(`
      <GlobalSearchResultAppend
        parentTitle="Dashboards"
        searchTagIds={Array []}
        tags={
          Array [
            Object {
              "color": "#000000",
              "description": "Known",
              "id": "known",
              "managed": false,
              "name": "Known",
            },
          ]
        }
      />
    `);
  });

  it('adds the navigation parent title to the append area', () => {
    const input = createSearchResult({ url: '/app/ml/anomaly_detection' });
    const option = resultToOption(input, [], undefined, () => ({
      title: 'Machine Learning',
      matchedInNavigation: true,
    }));

    expect(option.append).toMatchInlineSnapshot(`
      <GlobalSearchResultAppend
        parentTitle="Machine Learning"
        searchTagIds={Array []}
        tags={Array []}
      />
    `);
  });

  it('uses the navigation parent icon as the cell prepend when available', () => {
    const input = createSearchResult({
      url: '/app/monitoring',
      type: 'application',
      icon: 'monitoringApp',
    });
    const option = resultToOption(input, [], undefined, () => ({
      title: 'Stack Management',
      icon: 'gear',
      matchedInNavigation: true,
    }));

    expect(getPrependIconType(option.prepend)).toBe('gear');
  });

  it('uses the active nav item icon for top-level items', () => {
    const input = createSearchResult({
      url: '/app/discover',
      type: 'application',
      icon: 'oldDiscoverIcon',
    });
    const option = resultToOption(input, [], undefined, () => ({
      icon: 'productDiscover',
      matchedInNavigation: true,
    }));

    expect(getPrependIconType(option.prepend)).toBe('productDiscover');
  });

  it('falls back to the result icon when the navigation parent has no icon', () => {
    const input = createSearchResult({
      url: '/app/ml/anomaly_detection',
      type: 'application',
      icon: 'machineLearningApp',
    });
    const option = resultToOption(input, [], undefined, () => ({
      title: 'Machine Learning',
      matchedInNavigation: true,
    }));

    expect(getPrependIconType(option.prepend)).toBe('machineLearningApp');
  });

  it('does not set prepend when the resolved icon is empty', () => {
    const input = createSearchResult({ type: 'unknown-type', icon: undefined });
    const option = resultToOption(input, []);

    expect(option.prepend).toBeUndefined();
  });

  it('shows Dashboards as the append parent for dashboard results without a nav parent title', () => {
    const input = createSearchResult({
      type: 'dashboard',
      url: '/app/dashboards#/view/abc',
      icon: 'productDashboard',
    });
    const option = resultToOption(input, [], undefined, () => ({
      matchedInNavigation: false,
    }));

    expect(option.append).toMatchInlineSnapshot(`
      <GlobalSearchResultAppend
        parentTitle="Dashboards"
        searchTagIds={Array []}
        tags={Array []}
      />
    `);
  });

  it('uses accent prepend styling for favorite results', () => {
    const input = createSearchResult({
      icon: 'productDashboard',
      meta: { [GLOBAL_SEARCH_FAVORITE_META_KEY]: true },
    });
    const option = resultToOption(input, []);
    const { getByTestId } = render(React.createElement(React.Fragment, null, option.prepend));

    expect(getByTestId('globalSearchResultPrependIcon')).toHaveStyle({
      backgroundColor: 'var(--euiColorBackgroundLightAccent)',
    });
  });
});
