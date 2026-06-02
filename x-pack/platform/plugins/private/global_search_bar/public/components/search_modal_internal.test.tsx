/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { applicationServiceMock, coreMock } from '@kbn/core/public/mocks';
import { globalSearchPluginMock } from '@kbn/global-search-plugin/public/mocks';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { of } from 'rxjs';
import { usageCollectionPluginMock } from '@kbn/usage-collection-plugin/public/mocks';
import { EventReporter } from '../telemetry';
import { SearchModalInternal } from './search_modal_internal';

jest.mock('../hooks/use_search_state', () => ({
  useSearchState: () => ({
    searchValue: '',
    setSearchValue: jest.fn(),
    isLoading: false,
    searchCharLimitExceeded: false,
    onChange: jest.fn(),
    onActiveOptionChange: jest.fn(),
    selectableListProps: {},
    setSearchRef: jest.fn(),
    triggerInitialLoad: jest.fn(),
    modalBucketSections: [],
    suggestionOptions: [],
  }),
}));

const mockUseSearchModalStack = jest.fn(() => ({
  currentScreen: { id: 'root', title: '' },
  isNested: false,
  pushScreen: jest.fn(),
  popScreen: jest.fn(),
  resetStack: jest.fn(),
}));

jest.mock('../hooks/use_search_modal_stack', () => ({
  useSearchModalStack: () => mockUseSearchModalStack(),
}));

jest.mock(
  'react-virtualized-auto-sizer',
  () =>
    ({ children }: any) =>
      children({ height: 600, width: 600 })
);

describe('SearchModalInternal', () => {
  const usageCollection = usageCollectionPluginMock.createSetupContract();
  const core = coreMock.createStart();
  const basePathUrl = '/plugins/globalSearchBar/assets/';
  let searchService: ReturnType<typeof globalSearchPluginMock.createStartContract>;
  let applications: ReturnType<typeof applicationServiceMock.createStartContract>;
  let eventReporter: EventReporter;

  beforeEach(() => {
    mockUseSearchModalStack.mockReset();
    mockUseSearchModalStack.mockReturnValue({
      currentScreen: { id: 'root', title: '' },
      isNested: false,
      pushScreen: jest.fn(),
      popScreen: jest.fn(),
      resetStack: jest.fn(),
    });

    applications = applicationServiceMock.createStartContract();
    searchService = globalSearchPluginMock.createStartContract();

    (searchService.getSearchableTypes as jest.Mock).mockResolvedValue(['application']);
    (searchService.find as jest.Mock).mockReturnValue(of({ results: [] }));

    eventReporter = new EventReporter({ analytics: core.analytics, usageCollection });
    jest.clearAllMocks();
  });

  it('renders the search input and footer', () => {
    render(
      <IntlProvider locale="en">
        <SearchModalInternal
          globalSearch={{ ...searchService, searchCharLimit: 1000 }}
          navigateToUrl={applications.navigateToUrl}
          navigateToApp={applications.navigateToApp}
          http={core.http}
          userProfile={core.userProfile}
          basePathUrl={basePathUrl}
          reportEvent={eventReporter}
          onClose={jest.fn()}
        />
      </IntlProvider>
    );

    expect(screen.getByTestId('chromeProjectNextSearchModalInput')).toBeInTheDocument();
    expect(screen.getByTestId('chromeProjectNextSearchModalFooter')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-search-conceal')).not.toBeInTheDocument();
  });

  it('shows the configure append on the main modal search input', () => {
    render(
      <IntlProvider locale="en">
        <SearchModalInternal
          globalSearch={{ ...searchService, searchCharLimit: 1000 }}
          navigateToUrl={applications.navigateToUrl}
          navigateToApp={applications.navigateToApp}
          http={core.http}
          userProfile={core.userProfile}
          basePathUrl={basePathUrl}
          reportEvent={eventReporter}
          onClose={jest.fn()}
        />
      </IntlProvider>
    );

    expect(screen.getByTestId('global-search-modal-configure')).toBeInTheDocument();
  });

  it('opens the configuration nested screen when configure is clicked', async () => {
    const pushScreen = jest.fn();
    mockUseSearchModalStack.mockReturnValue({
      currentScreen: { id: 'root', title: '' },
      isNested: false,
      pushScreen,
      popScreen: jest.fn(),
      resetStack: jest.fn(),
    });

    render(
      <IntlProvider locale="en">
        <SearchModalInternal
          globalSearch={{ ...searchService, searchCharLimit: 1000 }}
          navigateToUrl={applications.navigateToUrl}
          navigateToApp={applications.navigateToApp}
          http={core.http}
          userProfile={core.userProfile}
          basePathUrl={basePathUrl}
          reportEvent={eventReporter}
          onClose={jest.fn()}
        />
      </IntlProvider>
    );

    await userEvent.click(screen.getByTestId('global-search-modal-configure'));

    expect(pushScreen).toHaveBeenCalledWith(
      { id: 'configuration', title: 'Search configuration' },
      ''
    );
  });

  it('renders the configuration nested screen without a search input', () => {
    mockUseSearchModalStack.mockReturnValueOnce({
      currentScreen: { id: 'configuration', title: 'Search configuration' },
      isNested: true,
      pushScreen: jest.fn(),
      popScreen: jest.fn(),
      resetStack: jest.fn(),
    });

    render(
      <IntlProvider locale="en">
        <SearchModalInternal
          globalSearch={{ ...searchService, searchCharLimit: 1000 }}
          navigateToUrl={applications.navigateToUrl}
          navigateToApp={applications.navigateToApp}
          http={core.http}
          userProfile={core.userProfile}
          basePathUrl={basePathUrl}
          reportEvent={eventReporter}
          onClose={jest.fn()}
        />
      </IntlProvider>
    );

    expect(screen.getByTestId('chromeProjectNextSearchModalHeaderConfiguration')).toBeInTheDocument();
    expect(screen.getByText('Search configuration')).toBeInTheDocument();
    expect(screen.getByTestId('global-search-nested-back')).toBeInTheDocument();
    expect(screen.queryByTestId('chromeProjectNextSearchModalInput')).not.toBeInTheDocument();
    expect(screen.getByTestId('chromeProjectNextSearchModalBodyConfiguration')).toBeInTheDocument();
    expect(screen.queryByTestId('chromeProjectNextSearchModalFooter')).not.toBeInTheDocument();
  });

  it('does not show the configure append in nested modal views', () => {
    mockUseSearchModalStack.mockReturnValueOnce({
      currentScreen: { id: 'recent', title: 'Recent' },
      isNested: true,
      pushScreen: jest.fn(),
      popScreen: jest.fn(),
      resetStack: jest.fn(),
    });

    render(
      <IntlProvider locale="en">
        <SearchModalInternal
          globalSearch={{ ...searchService, searchCharLimit: 1000 }}
          navigateToUrl={applications.navigateToUrl}
          navigateToApp={applications.navigateToApp}
          http={core.http}
          userProfile={core.userProfile}
          basePathUrl={basePathUrl}
          reportEvent={eventReporter}
          onClose={jest.fn()}
        />
      </IntlProvider>
    );

    expect(screen.queryByTestId('global-search-modal-configure')).not.toBeInTheDocument();
    expect(screen.getByTestId('global-search-nested-back')).toBeInTheDocument();
  });

  it('reports searchFocus on mount and searchBlur on unmount', () => {
    const focusSpy = jest.spyOn(eventReporter, 'searchFocus');
    const blurSpy = jest.spyOn(eventReporter, 'searchBlur');

    const { unmount } = render(
      <IntlProvider locale="en">
        <SearchModalInternal
          globalSearch={{ ...searchService, searchCharLimit: 1000 }}
          navigateToUrl={applications.navigateToUrl}
          navigateToApp={applications.navigateToApp}
          http={core.http}
          userProfile={core.userProfile}
          basePathUrl={basePathUrl}
          reportEvent={eventReporter}
          onClose={jest.fn()}
        />
      </IntlProvider>
    );

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(blurSpy).not.toHaveBeenCalled();

    unmount();

    expect(blurSpy).toHaveBeenCalledTimes(1);
  });
});
