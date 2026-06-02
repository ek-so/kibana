/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableProps, EuiSelectableTemplateSitewideOption } from '@elastic/eui';
import type { EuiSelectableOnChangeEvent } from '@elastic/eui/src/components/selectable/selectable';
import type { MouseEvent, RefObject } from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Subscription } from 'rxjs';
import type {
  GlobalSearchBucketId,
  GlobalSearchFindParams,
  GlobalSearchResult,
} from '@kbn/global-search-plugin/public';
import {
  GLOBAL_SEARCH_BUCKET_ACTIONS,
  GLOBAL_SEARCH_BUCKET_FAVORITES,
  GLOBAL_SEARCH_BUCKET_NAVIGATE,
  GLOBAL_SEARCH_BUCKET_RECENT,
  GLOBAL_SEARCH_BUCKET_RESULTS,
  organizeGlobalSearchResults,
} from '@kbn/global-search-plugin/public';
import { loadFavoriteDashboardResults } from '../favorites/load_favorite_dashboards';
import { getGlobalSearchActionById, getGlobalSearchActions } from '../actions/registry';
import { GLOBAL_SEARCH_ACTION_OPTION_TYPE } from '../actions/types';
import useDebounce from 'react-use/lib/useDebounce';
import useObservable from 'react-use/lib/useObservable';
import { apm } from '@elastic/apm-rum';
import useMountedState from 'react-use/lib/useMountedState';
import { getNavigationParentForUrl } from '@kbn/core-chrome-browser';
import { map, of } from 'rxjs';
import type { SearchSuggestion } from '../suggestions';
import { getSuggestions } from '../suggestions';
import type { SearchProps } from '../components/types';
import { parseSearchParams } from '../search_syntax';
import { buildSelectableOptionsFromBuckets } from '../buckets/build_selectable_options';
import type { GlobalSearchResultsView } from '../buckets/build_selectable_options';
import {
  buildModalBucketSections,
  type SearchModalBucketSection,
} from '../buckets/build_modal_bucket_sections';
import { suggestionToOption } from '../lib';
import { getRecentPages, recordRecentPage } from '../recent/recent_store';
import {
  GLOBAL_SEARCH_LIST_ROW_HEIGHT_PX,
  SEARCH_MODAL_ROW_HEIGHT_PX,
} from '../components/types';
import { i18nStrings } from '../strings';

const UNKNOWN_TAG_ID = '__unknown__';

const bucketTitles: Record<GlobalSearchBucketId, string> = {
  [GLOBAL_SEARCH_BUCKET_RECENT]: i18nStrings.bucketRecent,
  [GLOBAL_SEARCH_BUCKET_ACTIONS]: i18nStrings.bucketActions,
  [GLOBAL_SEARCH_BUCKET_FAVORITES]: i18nStrings.bucketFavorite,
  [GLOBAL_SEARCH_BUCKET_NAVIGATE]: i18nStrings.bucketNavigate,
  [GLOBAL_SEARCH_BUCKET_RESULTS]: i18nStrings.bucketResults,
};

interface UseSearchStateOptions extends Omit<SearchProps, 'basePathUrl'> {
  /** Called after a result is selected and navigation is triggered. */
  onResultSelect?: () => void;
  /** When set (e.g. search modal), overrides default in-popover "show all recent" behavior. */
  onShowAllRecent?: () => void;
  /** When set (e.g. search modal), overrides default in-popover "show all actions" behavior. */
  onShowAllActions?: () => void;
  /** When set (e.g. search modal), overrides default "show all favorites" behavior. */
  onShowAllFavorites?: () => void;
  /** Modal nested Recent screen: show all recent items only while the query is empty. */
  nestedRecentContext?: boolean;
  /** Modal nested Actions screen: show all actions only while the query is empty. */
  nestedActionsContext?: boolean;
  /** Modal nested Favorites screen: show all favorite items with local filtering. */
  nestedFavoritesContext?: boolean;
  /** Renders each bucket as its own section in the search modal. */
  useModalBucketLayout?: boolean;
}

const isSelectableResultOption = (option: EuiSelectableTemplateSitewideOption): boolean =>
  !option.isGroupLabel;

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
  resultsView: GlobalSearchResultsView;
  showAllRecent: () => void;
  showAllActions: () => void;
  showAllFavorites: () => void;
  modalBucketSections: SearchModalBucketSection[];
  suggestionOptions: EuiSelectableTemplateSitewideOption[];
}

const getSelectableRank = (
  selection: EuiSelectableTemplateSitewideOption[],
  selected: EuiSelectableTemplateSitewideOption
): number | null => {
  let rank = 0;
  for (const option of selection) {
    if (!isSelectableResultOption(option)) {
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
  http,
  userProfile,
  navigateToUrl,
  navigateToApp,
  reportEvent,
  onResultSelect,
  onShowAllRecent: onShowAllRecentOverride,
  onShowAllActions: onShowAllActionsOverride,
  onShowAllFavorites: onShowAllFavoritesOverride,
  nestedRecentContext = false,
  nestedActionsContext = false,
  nestedFavoritesContext = false,
  useModalBucketLayout = false,
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

  const getNavigationParent = useCallback(
    (url: string) => {
      if (!navigationTree) {
        return { matchedInNavigation: false };
      }

      return getNavigationParentForUrl({
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
  const [modalBucketSections, setModalBucketSections] = useState<SearchModalBucketSection[]>([]);
  const [suggestionOptions, setSuggestionOptions] = useState<EuiSelectableTemplateSitewideOption[]>(
    []
  );
  const [searchableTypes, setSearchableTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchCharLimitExceeded, setSearchCharLimitExceeded] = useState(false);
  const [resultsView, setResultsView] = useState<GlobalSearchResultsView>('main');

  const activeResultsView = useMemo((): GlobalSearchResultsView => {
    if (nestedRecentContext) {
      return 'recent';
    }

    if (nestedActionsContext) {
      return 'actions';
    }

    if (nestedFavoritesContext) {
      return 'favorites';
    }

    return resultsView;
  }, [nestedActionsContext, nestedFavoritesContext, nestedRecentContext, resultsView]);

  const activeResultsViewRef = useRef(activeResultsView);
  activeResultsViewRef.current = activeResultsView;

  const showAllRecentRef = useRef<() => void>(() => {});
  const stableShowAllRecent = useCallback(() => {
    showAllRecentRef.current();
  }, []);

  const showAllActionsRef = useRef<() => void>(() => {});
  const stableShowAllActions = useCallback(() => {
    showAllActionsRef.current();
  }, []);

  const showAllFavoritesRef = useRef<() => void>(() => {});
  const stableShowAllFavorites = useCallback(() => {
    showAllFavoritesRef.current();
  }, []);

  const searchSubscription = useRef<Subscription | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const latestResultsRef = useRef<GlobalSearchResult[]>([]);
  const favoriteResultsRef = useRef<GlobalSearchResult[]>([]);
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
      term = '',
      view: GlobalSearchResultsView = activeResultsViewRef.current
    ) => {
      lastUpdateParamsRef.current = { results, suggestions, searchTagIds, term };
      const recent = getRecentPages();
      const buckets = organizeGlobalSearchResults({
        results,
        recent,
        favorites: favoriteResultsRef.current,
        term: view === 'recent' || view === 'actions' || view === 'favorites' ? '' : term,
      });

      if (useModalBucketLayout) {
        setSuggestionOptions(view === 'main' ? suggestions.map(suggestionToOption) : []);
        setModalBucketSections(
          buildModalBucketSections({
            buckets,
            bucketTitles,
            searchTagIds,
            getTagList: taggingApi?.ui.getTagList,
            getNavigationParent,
            view,
            onShowAllRecent: stableShowAllRecent,
            onShowAllActions: stableShowAllActions,
            onShowAllFavorites: stableShowAllFavorites,
            actions: getGlobalSearchActions(),
            favorites: favoriteResultsRef.current,
            term,
          })
        );
        setOptions([]);
        return;
      }

      setSuggestionOptions([]);
      setModalBucketSections([]);
      setOptions(
        buildSelectableOptionsFromBuckets({
          buckets,
          bucketTitles,
          suggestions,
          searchTagIds,
          getTagList: taggingApi?.ui.getTagList,
          getNavigationParent,
          view,
          onShowAllRecent: stableShowAllRecent,
          onShowAllActions: stableShowAllActions,
          actions: getGlobalSearchActions(),
          term,
        })
      );
    },
    [
      taggingApi,
      stableShowAllRecent,
      stableShowAllActions,
      stableShowAllFavorites,
      getNavigationParent,
      useModalBucketLayout,
    ]
  );

  const updateOptionsRef = useRef(updateOptions);
  updateOptionsRef.current = updateOptions;

  useEffect(() => {
    if (!initialLoad) {
      return;
    }

    let cancelled = false;

    const loadFavorites = async () => {
      try {
        const favorites = await loadFavoriteDashboardResults({ http, userProfile });

        if (cancelled) {
          return;
        }

        favoriteResultsRef.current = favorites;

        const params = lastUpdateParamsRef.current;
        updateOptionsRef.current(
          params?.results ?? latestResultsRef.current,
          params?.suggestions ?? [],
          params?.searchTagIds ?? [],
          params?.term ?? '',
          activeResultsViewRef.current
        );
      } catch {
        // Favorites are optional; keep search usable if the request fails.
      }
    };

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [http, initialLoad, userProfile]);

  useLayoutEffect(() => {
    showAllRecentRef.current = () => {
      if (onShowAllRecentOverride) {
        searchSubscription.current?.unsubscribe();
        searchSubscription.current = null;

        onShowAllRecentOverride();

        const params = lastUpdateParamsRef.current;
        if (params) {
          updateOptions(params.results, params.suggestions, params.searchTagIds, '', 'recent');
        } else {
          updateOptions(latestResultsRef.current, [], [], '', 'recent');
        }
        setIsLoading(false);
        return;
      }

      setResultsView('recent');
      setIsLoading(false);

      const params = lastUpdateParamsRef.current;
      if (params) {
        updateOptions(params.results, params.suggestions, params.searchTagIds, '', 'recent');
        return;
      }

      updateOptions(latestResultsRef.current, [], [], '', 'recent');
    };
  }, [onShowAllRecentOverride, updateOptions]);

  useLayoutEffect(() => {
    showAllActionsRef.current = () => {
      if (onShowAllActionsOverride) {
        searchSubscription.current?.unsubscribe();
        searchSubscription.current = null;

        onShowAllActionsOverride();

        const params = lastUpdateParamsRef.current;
        if (params) {
          updateOptions(params.results, params.suggestions, params.searchTagIds, '', 'actions');
        } else {
          updateOptions(latestResultsRef.current, [], [], '', 'actions');
        }
        setIsLoading(false);
        return;
      }

      setResultsView('actions');
      setIsLoading(false);

      const params = lastUpdateParamsRef.current;
      if (params) {
        updateOptions(params.results, params.suggestions, params.searchTagIds, '', 'actions');
        return;
      }

      updateOptions(latestResultsRef.current, [], [], '', 'actions');
    };
  }, [onShowAllActionsOverride, updateOptions]);

  useLayoutEffect(() => {
    showAllFavoritesRef.current = () => {
      if (onShowAllFavoritesOverride) {
        searchSubscription.current?.unsubscribe();
        searchSubscription.current = null;

        onShowAllFavoritesOverride();

        const params = lastUpdateParamsRef.current;
        if (params) {
          updateOptions(params.results, params.suggestions, params.searchTagIds, '', 'favorites');
        } else {
          updateOptions(latestResultsRef.current, [], [], '', 'favorites');
        }
        setIsLoading(false);
        return;
      }

      setResultsView('favorites');
      setIsLoading(false);

      const params = lastUpdateParamsRef.current;
      if (params) {
        updateOptions(params.results, params.suggestions, params.searchTagIds, '', 'favorites');
        return;
      }

      updateOptions(latestResultsRef.current, [], [], '', 'favorites');
    };
  }, [onShowAllFavoritesOverride, updateOptions]);

  useEffect(() => {
    const params = lastUpdateParamsRef.current;
    if (!params || !initialLoad) {
      return;
    }

    updateOptionsRef.current(
      params.results,
      params.suggestions,
      params.searchTagIds,
      params.term,
      activeResultsView
    );
  }, [activeResultsView, initialLoad]);

  useEffect(() => {
    const params = lastUpdateParamsRef.current;
    if (!params || !initialLoad) {
      return;
    }

    updateOptionsRef.current(
      params.results,
      params.suggestions,
      params.searchTagIds,
      params.term,
      activeResultsView
    );
  }, [navigationTree, initialLoad, activeResultsView]);

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
        const subsetView =
          activeResultsViewRef.current === 'recent' ||
          activeResultsViewRef.current === 'actions' ||
          activeResultsViewRef.current === 'favorites';

        if (subsetView) {
          searchSubscription.current?.unsubscribe();
          searchSubscription.current = null;

          if (searchValue.length > globalSearch.searchCharLimit) {
            setSearchCharLimitExceeded(true);
            setIsLoading(false);
            return;
          }

          setSearchCharLimitExceeded(false);

          const normalizedTerm = searchValue.toLowerCase();
          const params = lastUpdateParamsRef.current;

          updateOptions(
            params?.results ?? latestResultsRef.current,
            [],
            params?.searchTagIds ?? [],
            normalizedTerm,
            activeResultsViewRef.current
          );
          setIsLoading(false);
          return;
        }

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
              updateOptions(
                aggregatedResults,
                suggestions,
                searchParams.tags,
                normalizedTerm,
                activeResultsViewRef.current
              );
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
            updateOptions(
              aggregatedResults,
              suggestions,
              searchParams.tags,
              '',
              activeResultsViewRef.current
            );
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
      if (!isSelectableResultOption(selected)) {
        return;
      }

      const selectedRank = getSelectableRank(selection, selected);
      const selectedLabel = selected.label ?? null;

      // @ts-ignore - ts error is "union type is too complex to express"
      const { url, type, suggestion } = selected;

      if (type === GLOBAL_SEARCH_ACTION_OPTION_TYPE) {
        const action = getGlobalSearchActionById(String(selected.key));
        action?.execute({ navigateToUrl, navigateToApp });
        onResultSelectRef.current?.();
        setResultsView('main');
        return;
      }

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
    [reportEvent, navigateToUrl, navigateToApp, searchValue]
  );

  const selectableListProps = useMemo((): NonNullable<EuiSelectableProps['listProps']> => {
    const listProps: NonNullable<EuiSelectableProps['listProps']> = {
      rowHeight: useModalBucketLayout
        ? SEARCH_MODAL_ROW_HEIGHT_PX
        : GLOBAL_SEARCH_LIST_ROW_HEIGHT_PX,
      isVirtualized: !useModalBucketLayout,
    };

    const pointerListHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.euiSelectableListItem')) {
        isPointerSelectRef.current = true;
        pointerEventRef.current = event;
      }
    };

    if (useModalBucketLayout) {
      return {
        ...listProps,
        onMouseDown: pointerListHandler,
      };
    }

    return {
      ...listProps,
      onMouseDown: (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('[data-test-subj="global-search-recent-more"]')) {
          event.preventDefault();
          event.stopPropagation();
          showAllRecentRef.current();
          return;
        }
        if (target?.closest('[data-test-subj="global-search-actions-more"]')) {
          event.preventDefault();
          event.stopPropagation();
          showAllActionsRef.current();
          return;
        }
        pointerListHandler(event);
      },
    };
  }, [useModalBucketLayout]);

  const onActiveOptionChange = useCallback<
    NonNullable<EuiSelectableProps['onActiveOptionChange']>
  >(
    (option) => {
      if (!isPointerSelectRef.current || !option || !isSelectableResultOption(option)) {
        return;
      }

      isPointerSelectRef.current = false;
      pointerSelectHandledRef.current = true;
      handleOptionSelect(
        option,
        pointerEventRef.current ??
          ({ shiftKey: false, ctrlKey: false, metaKey: false } as EuiSelectableOnChangeEvent)
      );
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

      if (changedOption && !isSelectableResultOption(changedOption)) {
        return;
      }

      const selected =
        changedOption && isSelectableResultOption(changedOption)
          ? changedOption
          : selection.find(
              (option) => option.checked === 'on' && isSelectableResultOption(option)
            );

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
    resultsView,
    showAllRecent: stableShowAllRecent,
    showAllActions: stableShowAllActions,
    showAllFavorites: stableShowAllFavorites,
    modalBucketSections,
    suggestionOptions,
  };
};
