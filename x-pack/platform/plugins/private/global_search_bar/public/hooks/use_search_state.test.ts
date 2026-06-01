/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  GlobalSearchBatchedResults,
  GlobalSearchResult,
} from '@kbn/global-search-plugin/public';
import { act, renderHook } from '@testing-library/react';
import { Subject, of } from 'rxjs';
import { useSearchState } from './use_search_state';

jest.mock('@elastic/apm-rum', () => ({
  apm: {
    captureError: jest.fn(),
  },
}));

jest.mock('../suggestions', () => ({
  getSuggestions: jest.fn(() => []),
}));

jest.mock('../lib', () => ({
  resultToOption: jest.fn((r: { id: string; title: string; url: string; type: string }) => ({
    key: r.id,
    label: r.title,
    url: r.url,
    type: r.type,
  })),
  suggestionToOption: jest.fn((s: { suggestion: string }) => ({
    label: s.suggestion,
    type: '__suggestion__',
    suggestion: s.suggestion,
  })),
}));

jest.mock('../search_syntax', () => ({
  parseSearchParams: jest.fn((value: string) => ({
    term: value,
    filters: { types: [], tags: [] },
  })),
}));

const mockGetRecentPages = jest.fn(() => []);
const mockRecordRecentPage = jest.fn();

jest.mock('../recent/recent_store', () => ({
  ...jest.requireActual('../recent/recent_store'),
  getRecentPages: () => mockGetRecentPages(),
  filterRecentPagesForTerm: jest.fn((recent: unknown[]) => recent),
  recordRecentPage: (...args: unknown[]) => mockRecordRecentPage(...args),
}));

const getSelectableLabels = (options: Array<{ label?: string; isGroupLabel?: boolean }>) =>
  options.filter((option) => !option.isGroupLabel).map((option) => option.label);

type Result =
  | string
  | {
      id: string;
      type?: string;
      score?: number;
      categoryLabel?: string | null;
    };

const createResult = (result: Result): GlobalSearchResult => {
  const id = typeof result === 'string' ? result : result.id;
  const type = typeof result === 'string' ? 'application' : result.type ?? 'application';
  const score = typeof result === 'string' ? 42 : result.score ?? 42;

  const categoryLabel =
    typeof result === 'string'
      ? 'Kibana'
      : result.categoryLabel !== undefined
      ? result.categoryLabel
      : type === 'application'
      ? 'Kibana'
      : 'Test';

  return {
    id,
    type,
    title: id,
    url: `/app/test/${id}`,
    score,
    meta: { categoryLabel },
  };
};

const createBatch = (...results: Result[]): GlobalSearchBatchedResults => ({
  results: results.map(createResult),
});

describe('useSearchState', () => {
  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    jest.clearAllMocks();
    mockGetRecentPages.mockReturnValue([]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const makeDeps = (overrides?: { searchCharLimit?: number }) => {
    const globalSearch = {
      searchCharLimit: overrides?.searchCharLimit ?? 1000,
      getSearchableTypes: jest.fn().mockResolvedValue(['application', 'test']),
      find: jest.fn().mockReturnValue(of(createBatch())),
    } as any;

    const navigateToUrl = jest.fn();
    const reportEvent = {
      searchRequest: jest.fn(),
      navigateToApplication: jest.fn(),
      navigateToSavedObject: jest.fn(),
    } as any;

    return { globalSearch, navigateToUrl, reportEvent };
  };

  const triggerInitialLoadAndRunDebounce = async (result: { current: any }) => {
    act(() => {
      result.current.triggerInitialLoad();
    });

    // allow getSearchableTypes async effect to resolve
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      jest.advanceTimersByTime(350);
    });
  };

  it('shows recent pages immediately when the modal opens', async () => {
    mockGetRecentPages.mockReturnValue([
      createResult({ id: 'recent-discover', type: 'application', title: 'Discover' }),
    ]);

    const { globalSearch, navigateToUrl, reportEvent } = makeDeps();

    const { result } = renderHook(() =>
      useSearchState({
        globalSearch,
        navigateToUrl,
        reportEvent,
      })
    );

    act(() => {
      result.current.triggerInitialLoad();
    });

    const labels = getSelectableLabels(result.current.options);
    expect(labels).toContain('recent-discover');
    expect(
      result.current.options.some(
        (option: { isGroupLabel?: boolean; label?: string }) =>
          option.isGroupLabel && option.label === 'Recent'
      )
    ).toBe(true);
  });

  it('limits recent pages to three items in the main search view', async () => {
    mockGetRecentPages.mockReturnValue(
      Array.from({ length: 7 }, (_, index) =>
        createResult({ id: `recent-${index}`, type: 'application', title: `Recent ${index}` })
      )
    );

    const { globalSearch, navigateToUrl, reportEvent } = makeDeps();

    const { result } = renderHook(() =>
      useSearchState({
        globalSearch,
        navigateToUrl,
        reportEvent,
      })
    );

    act(() => {
      result.current.triggerInitialLoad();
    });

    const recentLabels = getSelectableLabels(result.current.options);
    expect(recentLabels).toHaveLength(3);
    expect(recentLabels).toEqual(['recent-0', 'recent-1', 'recent-2']);
    expect(
      result.current.options.some(
        (option: { isGroupLabel?: boolean; append?: unknown }) =>
          option.isGroupLabel && option.append
      )
    ).toBe(true);
  });

  it('displays an error state and does not search again when the search input exceeds the specified char limit', async () => {
    const { globalSearch, navigateToUrl, reportEvent } = makeDeps({ searchCharLimit: 1 });

    const { result } = renderHook(() =>
      useSearchState({
        globalSearch,
        navigateToUrl,
        reportEvent,
      })
    );

    // Initial load triggers the first (empty) search
    await triggerInitialLoadAndRunDebounce(result);

    expect(globalSearch.find).toHaveBeenCalledTimes(1);

    // Exceed the limit
    act(() => {
      result.current.setSearchValue('aaa');
    });

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(result.current.searchCharLimitExceeded).toBe(true);
    expect(globalSearch.find).toHaveBeenCalledTimes(1); // no additional search calls
  });

  it('correctly filters and sorts results by title when the search value is empty', async () => {
    const { globalSearch, navigateToUrl, reportEvent } = makeDeps();

    globalSearch.find.mockReturnValueOnce(
      of(createBatch('Discover', 'Canvas'), createBatch({ id: 'Visualize', type: 'test' }, 'Graph'))
    );

    const { result } = renderHook(() =>
      useSearchState({
        globalSearch,
        navigateToUrl,
        reportEvent,
      })
    );

    await triggerInitialLoadAndRunDebounce(result);

    const labels = getSelectableLabels(result.current.options);
    expect(labels).toEqual(['Canvas', 'Discover', 'Graph']); // Visualize (type=test) filtered out
  });

  it('search term triggers searchRequest and sorts results by score (descending)', async () => {
    const { globalSearch, navigateToUrl, reportEvent } = makeDeps();

    // first call = initial empty load
    globalSearch.find.mockReturnValueOnce(of(createBatch('Discover')));

    // second call = user typed search
    globalSearch.find.mockReturnValueOnce(
      of(
        createBatch(
          { id: 'Lowest score', type: 'application', score: 1 },
          { id: 'Highest score', type: 'application', score: 100 }
        )
      )
    );

    const { result } = renderHook(() =>
      useSearchState({
        globalSearch,
        navigateToUrl,
        reportEvent,
      })
    );

    await triggerInitialLoadAndRunDebounce(result);

    act(() => {
      result.current.setSearchValue('d');
    });

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(reportEvent.searchRequest).toHaveBeenCalledTimes(1);

    const labels = getSelectableLabels(result.current.options);
    expect(labels).toEqual(['Highest score', 'Lowest score']);
  });

  it('only displays results from the last search', async () => {
    const { globalSearch, navigateToUrl, reportEvent } = makeDeps();

    const firstSearch$ = new Subject<GlobalSearchBatchedResults>();

    // first call = initial empty load
    globalSearch.find.mockReturnValueOnce(firstSearch$);

    // second call = user typed search
    globalSearch.find.mockReturnValueOnce(
      of(
        createBatch(
          { id: 'Visualize', type: 'application', score: 10 },
          { id: 'Map', type: 'application', score: 20 }
        )
      )
    );

    const { result } = renderHook(() =>
      useSearchState({
        globalSearch,
        navigateToUrl,
        reportEvent,
      })
    );

    await triggerInitialLoadAndRunDebounce(result);
    expect(globalSearch.find).toHaveBeenCalledTimes(1);

    // New query -> should cancel previous subscription + set new results
    act(() => {
      result.current.setSearchValue('d');
    });

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(globalSearch.find).toHaveBeenCalledTimes(2);

    const lastLabels = getSelectableLabels(result.current.options);
    expect(lastLabels).toEqual(['Map', 'Visualize']);

    // Late emission from first search should NOT override
    act(() => {
      firstSearch$.next(createBatch('Discover', 'Canvas'));
      firstSearch$.complete();
    });

    const labelsAfterLateEmit = getSelectableLabels(result.current.options);
    expect(labelsAfterLateEmit).toEqual(['Map', 'Visualize']);
  });

  it('navigates when EUI passes a clicked option without checked state', async () => {
    const { globalSearch, navigateToUrl, reportEvent } = makeDeps();

    const { result } = renderHook(() =>
      useSearchState({
        globalSearch,
        navigateToUrl,
        reportEvent,
      })
    );

    await triggerInitialLoadAndRunDebounce(result);

    const clickedOption = {
      key: 'discover',
      label: 'Discover',
      url: '/app/discover',
      type: 'application',
    };

    act(() => {
      result.current.onChange([clickedOption], {} as MouseEvent, clickedOption);
    });

    expect(navigateToUrl).toHaveBeenCalledWith('/app/discover');
  });

  it('navigates on pointer activation via onActiveOptionChange', async () => {
    const { globalSearch, navigateToUrl, reportEvent } = makeDeps();

    const { result } = renderHook(() =>
      useSearchState({
        globalSearch,
        navigateToUrl,
        reportEvent,
      })
    );

    await triggerInitialLoadAndRunDebounce(result);

    const clickedOption = {
      key: 'discover',
      label: 'Discover',
      url: '/app/discover',
      type: 'application',
    };

    act(() => {
      const listItem = document.createElement('div');
      listItem.className = 'euiSelectableListItem';
      listItem.closest = () => listItem;

      result.current.selectableListProps.onMouseDown?.({
        target: listItem,
        nativeEvent: new MouseEvent('mousedown'),
      } as unknown as React.MouseEvent);
      result.current.onActiveOptionChange?.(clickedOption);
    });

    expect(navigateToUrl).toHaveBeenCalledWith('/app/discover');
  });
});
