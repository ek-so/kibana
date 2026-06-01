/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableProps, EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import type { EuiSelectableOnChangeEvent } from '@elastic/eui/src/components/selectable/selectable';
import type { MouseEvent, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Subscription } from 'rxjs';
import type {
  GlobalSearchBucketId,
  GlobalSearchFindParams,
  GlobalSearchResult,
} from '@kbn/global-search-plugin/public';
import {
  GLOBAL_SEARCH_BUCKET_NAVIGATE,
  GLOBAL_SEARCH_BUCKET_RECENT,
  GLOBAL_SEARCH_BUCKET_RESULTS,
  organizeGlobalSearchResults,
} from '@kbn/global-search-plugin/public';
import useDebounce from 'react-use/lib/useDebounce';
import useObservable from 'react-use/lib/useObservable';
import { apm } from '@elastic/apm-rum';
import useMountedState from 'react-use/lib/useMountedState';
import { getNavigationParentTitleForUrl } from '@kbn/core-chrome-browser';
import { map, of } from 'rxjs';
import type { SearchSuggestion } from '../suggestions';
import { getSuggestions } from '../suggestions';
import type { SearchProps } from '../components/types';
import { parseSearchParams } from '../search_syntax';
import { buildSelectableOptionsFromBuckets } from '../buckets/build_selectable_options';
import type { GlobalSearchResultsView } from '../buckets/build_selectable_options';
import {
  filterRecentPagesForTerm,
  getRecentPages,
  recordRecentPage,
} from '../recent/recent_store';
import { i18nStrings } from '../strings';

const UNKNOWN_TAG_ID = '__unknown__';

const bucketTitles: Record<GlobalSearchBucketId, string> = {
  [GLOBAL_SEARCH_BUCKET_RECENT]: i18nStrings.bucketRecent,
  [GLOBAL_SEARCH_BUCKET_NAVIGATE]: i18nStrings.bucketNavigate,
  [GLOBAL_SEARCH_BUCKET_RESULTS]: i18nStrings.bucketResults,
};

interface UseSearchStateOptions extends Omit<SearchProps, 'basePathUrl'> {
  /** Called after a result is selected and navigation is triggered. */
  onResultSelect?: () => void;
}

export interface SearchStateResult {
  searchValue: string;
  setSearchValue: (value: string) => void;
  options: EuiSelectableTemplateSitewideOption[];
  isLoading: boolean;
  searchCharLimitExceeded: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
  setSearchRef: (ref: HTMLInputElement | null) => void;
  triggerInitialLoad: () => void;
  onChange: (
    selection: EuiSelectableTemplateSitewideOption[],
    event: EuiSelectableOnChangeEvent,
    changedOption?: EuiSelectableTemplateSitewideOption
  ) => void;
  onActiveOptionChange: NonNullable<EuiSelectableProps['onActiveOptionChange']>;
  selectableListProps: NonNullable<EuiSelectableProps['listProps']>;
}

const getSelectableRank = (
  selection: EuiSelectableTemplateSitewideOption[],
  selected: EuiSelectableTemplateSitewideOption
): number | null => {
  let rank = 0;
  for (const option of selection) {
    if (option.isGroupLabel) {
      continue;
    }
    rank += 1;
    if (option.key === selected.key && option.label === selected.label) {
      return rank;
    }
  }
  return null;
};

export const useSearchState = ({
  globalSearch,
  taggingApi,
  navigateToUrl,
  reportEvent,
  onResultSelect,
  getNavigation$,
  prependBasePath = (path) => path,
}: UseSearchStateOptions): SearchStateResult => {
  const isMounted = useMountedState();

  const navigationTree$ = useMemo(() => {
    if (!getNavigation$) {
      return of(null);
    }
    return getNavigation$().pipe(map((state) => state?.navigationTree ?? null));
  }, [getNavigation$]);
  const navigationTree = useObservable(navigationTree$, null);

  const getNavigationParentTitle = useCallback(
    (url: string) => {
      if (!navigationTree) {
        return undefined;
      }

      return getNavigationParentTitleForUrl({
        url,
        navigationTree,
        prependBasePath,
      });
    },
    [navigationTree, prependBasePath]
  );

  const [initialLoad, setInitialLoad] = useState(false);
  const [loadGeneration, setLoadGeneration] = useState(0);
  const [searchValue, setSearchValue] = useState<string>('');
  const [options, setOptions] = useState<EuiSelectableTemplateSitewideOption[]>([]);
  const [searchableTypes, setSearchableTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchCharLimitExceeded, setSearchCharLimitExceeded] = useState(false);
  const [resultsView, setResultsView] = useState<GlobalSearchResultsView>('main');

  const showAllRecent = useCallback(() => {
    setResultsView('recent');
  }, []);

  const backToMainResults = useCallback(() => {
    setResultsView('main');
  }, []);

  const searchSubscription = useRef<Subscription | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const latestResultsRef = useRef<GlobalSearchResult[]>([]);
  const lastUpdateParamsRef = useRef<{
    results: GlobalSearchResult[];
    suggestions: SearchSuggestion[];
    searchTagIds: string[];
    term: string;
  } | null>(null);

  const setSearchRef = useCallback((ref: HTMLInputElement | null) => {
    searchRef.current = ref;
  }, []);

  // Initialize searchableTypes data
  useEffect(() => {
    if (initialLoad) {
      const fetch = async () => {
        const types = await globalSearch.getSearchableTypes();
        setSearchableTypes(types);
      };
      fetch();
    }
  }, [globalSearch, initialLoad]);

  // Whenever searchValue changes, isLoading = true
  useEffect(() => {
    setIsLoading(true);
  }, [searchValue]);

  // Cleanup subscription when component unmounts
  useEffect(() => {
    return () => {
      searchSubscription.current?.unsubscribe();
    };
  }, []);

  const loadSuggestions = useCallback(
    (term: string) => {
      return getSuggestions({
        searchTerm: term,
        searchableTypes,
        tagCache: taggingApi?.cache,
      });
    },
    [taggingApi, searchableTypes]
  );

  const updateOptions = useCallback(
    (
      results: GlobalSearchResult[],
      suggestions: SearchSuggestion[],
      searchTagIds: string[] = [],
      term = ''
    ) => {
      lastUpdateParamsRef.current = { results, suggestions, searchTagIds, term };
      const recent = filterRecentPagesForTerm(getRecentPages(), term);
      const buckets = organizeGlobalSearchResults({ results, recent, term });

      setOptions(
        buildSelectableOptionsFromBuckets({
          buckets,
          bucketTitles,
          suggestions,
          searchTagIds,
          getTagList: taggingApi?.ui.getTagList,
          getNavigationParentTitle,
          view: resultsView,
          onShowAllRecent: showAllRecent,
          onBackToMain: backToMainResults,
        })
      );
    },
    [taggingApi, resultsView, showAllRecent, backToMainResults, getNavigationParentTitle]
  );

  useEffect(() => {
    const params = lastUpdateParamsRef.current;
    if (!params || !initialLoad) {
      return;
    }

    updateOptions(params.results, params.suggestions, params.searchTagIds, params.term);
  }, [resultsView, updateOptions, initialLoad]);

  useEffect(() => {
    const params = lastUpdateParamsRef.current;
    if (!params || !initialLoad) {
      return;
    }

    updateOptions(params.results, params.suggestions, params.searchTagIds, params.term);
  }, [navigationTree, updateOptions, initialLoad]);

  const triggerInitialLoad = useCallback(() => {
    setResultsView('main');
    setInitialLoad(true);
    setLoadGeneration((generation) => generation + 1);
    // Show Recent immediately; do not wait for the debounced find() round-trip.
    updateOptions(latestResultsRef.current, [], [], '');
    setIsLoading(true);
  }, [updateOptions]);

  useDebounce(
    () => {
      if (initialLoad) {
        // cancel pending search if not completed yet
        if (searchSubscription.current) {
          searchSubscription.current?.unsubscribe();
          searchSubscription.current = null;
        }

        if (searchValue.length > globalSearch.searchCharLimit) {
          // setting this will display an error message to the user
          setSearchCharLimitExceeded(true);
          return;
        } else {
          setSearchCharLimitExceeded(false);
        }

        const normalizedTerm = searchValue.toLowerCase();
        const suggestions = loadSuggestions(normalizedTerm);

        let aggregatedResults: GlobalSearchResult[] = [];

        if (searchValue.length !== 0) {
          reportEvent.searchRequest();
        }

        const rawParams = parseSearchParams(normalizedTerm, searchableTypes);
        let tagIds: string[] | undefined;
        if (taggingApi && rawParams.filters.tags) {
          tagIds = rawParams.filters.tags.map(
            (tagName) => taggingApi.ui.getTagIdFromName(tagName) ?? UNKNOWN_TAG_ID
          );
        } else {
          tagIds = undefined;
        }
        const searchParams: GlobalSearchFindParams = {
          term: rawParams.term,
          types: rawParams.filters.types,
          tags: tagIds,
        };

        searchSubscription.current = globalSearch.find(searchParams, {}).subscribe({
          next: ({ results }) => {
            if (!isMounted()) {
              return;
            }

            if (searchValue.length > 0) {
              aggregatedResults = [...results, ...aggregatedResults].sort(
                (a, b) => b.score - a.score
              );
              latestResultsRef.current = aggregatedResults;
              updateOptions(aggregatedResults, suggestions, searchParams.tags, normalizedTerm);
              return;
            }

            // Empty query: only indexed navigation pages (applications)
            const applicationResults = results.filter(({ type }) => type === 'application');
            const seenUrls = new Set(aggregatedResults.map((result) => result.url));
            aggregatedResults = [
              ...applicationResults.filter((result) => {
                if (seenUrls.has(result.url)) {
                  return false;
                }
                seenUrls.add(result.url);
                return true;
              }),
              ...aggregatedResults,
            ];
            latestResultsRef.current = aggregatedResults;
            updateOptions(aggregatedResults, suggestions, searchParams.tags, '');
          },
          error: (err) => {
            setIsLoading(false);

            // Not doing anything on error right now because it'll either just show the previous
            // results or empty results which is basically what we want anyways
            apm.captureError(err, {
              labels: {
                SearchValue: searchValue,
              },
            });
          },
          complete: () => {
            setIsLoading(false);
          },
        });
      }
    },
    350,
    [searchValue, loadSuggestions, searchableTypes, initialLoad, loadGeneration, updateOptions]
  );

  const onResultSelectRef = useRef(onResultSelect);
  onResultSelectRef.current = onResultSelect;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // EuiSelectable highlights options on mousedown before click. When the search input is focused,
  // that focus transition can swallow the click, so we navigate on pointer activation instead.
  const isPointerSelectRef = useRef(false);
  const pointerSelectHandledRef = useRef(false);
  const pointerEventRef = useRef<EuiSelectableOnChangeEvent | null>(null);

  const handleOptionSelect = useCallback(
    (
      selected: EuiSelectableTemplateSitewideOption,
      event: EuiSelectableOnChangeEvent,
      selection: EuiSelectableTemplateSitewideOption[] = optionsRef.current
    ) => {
      if (selected.isGroupLabel) {
        return;
      }

      const selectedRank = getSelectableRank(selection, selected);
      const selectedLabel = selected.label ?? null;

      // @ts-ignore - ts error is "union type is too complex to express"
      const { url, type, suggestion } = selected;

      // if the type is a suggestion, we change the query on the input and trigger a new search
      // by setting the searchValue (only setting the field value does not trigger a search)
      if (type === '__suggestion__') {
        setSearchValue(suggestion);
        return;
      }

      const matchedResult =
        latestResultsRef.current.find(
          (result) => result.url === url || result.id === selected.key
        ) ??
        getRecentPages().find((result) => result.url === url || result.id === selected.key);

      if (matchedResult) {
        recordRecentPage(matchedResult);
      } else if (url && type && type !== '__suggestion__' && selectedLabel) {
        recordRecentPage({
          id: String(selected.key ?? url),
          type,
          title: selectedLabel,
          url,
          score: 100,
        });
      }

      // errors in tracking should not prevent selection behavior
      try {
        if (type === 'application') {
          const key = selected.key ?? 'unknown';
          const application = `${key.toLowerCase().replaceAll(' ', '_')}`;
          reportEvent.navigateToApplication({
            application,
            searchValue,
            selectedLabel,
            selectedRank,
          });
        } else {
          reportEvent.navigateToSavedObject({
            type,
            searchValue,
            selectedLabel,
            selectedRank,
          });
        }
      } catch (err) {
        apm.captureError(err, {
          labels: {
            SearchValue: searchValue,
          },
        });
        // eslint-disable-next-line no-console
        console.log('Error trying to track searchbar metrics', err);
      }

      if (event.shiftKey) {
        window.open(url);
      } else if (event.ctrlKey || event.metaKey) {
        window.open(url, '_blank');
      } else {
        navigateToUrl(url);
      }

      onResultSelectRef.current?.();
      setResultsView('main');
    },
    [reportEvent, navigateToUrl, searchValue]
  );

  const selectableListProps = useMemo(
    (): NonNullable<EuiSelectableProps['listProps']> => ({
      onMouseDown: (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('.euiSelectableListItem')) {
          isPointerSelectRef.current = true;
          pointerEventRef.current = event.nativeEvent;
        }
      },
    }),
    []
  );

  const onActiveOptionChange = useCallback<
    NonNullable<EuiSelectableProps['onActiveOptionChange']>
  >(
    (option) => {
      if (!isPointerSelectRef.current || !option || option.isGroupLabel) {
        return;
      }

      isPointerSelectRef.current = false;
      pointerSelectHandledRef.current = true;
      handleOptionSelect(option, pointerEventRef.current ?? new MouseEvent('click'));
      pointerEventRef.current = null;
    },
    [handleOptionSelect]
  );

  const onChange = useCallback(
    (
      selection: EuiSelectableTemplateSitewideOption[],
      event: EuiSelectableOnChangeEvent,
      changedOption?: EuiSelectableTemplateSitewideOption
    ) => {
      if (pointerSelectHandledRef.current) {
        pointerSelectHandledRef.current = false;
        return;
      }

      const selected =
        changedOption && !changedOption.isGroupLabel
          ? changedOption
          : selection.find(({ checked, isGroupLabel }) => checked === 'on' && !isGroupLabel);

      if (!selected) {
        return;
      }

      handleOptionSelect(selected, event, selection);
    },
    [handleOptionSelect]
  );

  return {
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
  };
};
