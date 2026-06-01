/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GlobalSearchResult } from '@kbn/global-search-plugin/common/types';
import type { Tag } from '@kbn/saved-objects-tagging-oss-plugin/common';
import { resultToOption } from './result_to_option';

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
    expect(resultToOption(input, [])).toEqual({
      key: input.id,
      label: input.title,
      url: input.url,
      type: input.type,
      icon: { type: expect.any(String) },
      'data-test-subj': expect.any(String),
    });
  });

  it('uses icon for `application` type', () => {
    const input = createSearchResult({ type: 'application', icon: 'app-icon' });
    expect(resultToOption(input, [])).toEqual(
      expect.objectContaining({
        icon: { type: 'app-icon' },
      })
    );
  });

  it('uses icon for `integration` type', () => {
    const input = createSearchResult({ type: 'integration', icon: 'integ-icon' });
    expect(resultToOption(input, [])).toEqual(
      expect.objectContaining({
        icon: { type: 'integ-icon' },
      })
    );
  });

  it('uses icon for `index` type', () => {
    const input = createSearchResult({ type: 'index', icon: 'index-icon' });
    expect(resultToOption(input, [])).toEqual(
      expect.objectContaining({
        icon: { type: 'index-icon' },
      })
    );
  });

  it('uses icon for `connector` type', () => {
    const input = createSearchResult({ type: 'connector', icon: 'connector-icon' });
    expect(resultToOption(input, [])).toEqual(
      expect.objectContaining({
        icon: { type: 'connector-icon' },
      })
    );
  });

  it('uses a grid icon for items not in the navigation menu', () => {
    const input = createSearchResult({ type: 'dashboard', icon: 'dash-icon' });
    const option = resultToOption(input, [], undefined, () => ({ matchedInNavigation: false }));

    expect(option.icon).toEqual({ type: 'grid' });
  });

  it('keeps the integration icon when not in the navigation menu', () => {
    const input = createSearchResult({ type: 'integration', icon: 'integ-icon' });
    const option = resultToOption(input, [], undefined, () => ({ matchedInNavigation: false }));

    expect(option.icon).toEqual({ type: 'integ-icon' });
  });

  it('uses the provider icon for applications not in the menu when navigation is unavailable', () => {
    const input = createSearchResult({ type: 'application', icon: 'logoKibana' });
    expect(resultToOption(input, [])).toEqual(
      expect.objectContaining({
        icon: { type: 'logoKibana' },
      })
    );
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

    expect(option.icon).toEqual({ type: 'gear' });
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

    expect(option.icon).toEqual({ type: 'productDiscover' });
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

    expect(option.icon).toEqual({ type: 'machineLearningApp' });
  });
});
