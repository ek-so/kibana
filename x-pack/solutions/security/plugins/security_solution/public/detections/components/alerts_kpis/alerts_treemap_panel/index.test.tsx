/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
// Necessary until components being tested are migrated of styled-components https://github.com/elastic/kibana/issues/219037
import 'jest-styled-components';
import { useLocation } from 'react-router-dom';

import { SecurityPageName } from '../../../../../common/constants';
import { DEFAULT_STACK_BY_FIELD, DEFAULT_STACK_BY_FIELD1 } from '../common/config';
import { useQueryAlerts } from '../../../containers/detection_engine/alerts/use_query';
import { ChartContextMenu } from '../chart_panels/chart_context_menu';
import { ChartSelect } from '../chart_panels/chart_select';
import { TREEMAP } from '../chart_panels/chart_select/translations';
import { TestProviders } from '../../../../common/mock/test_providers';
import type { Props } from '.';
import { AlertsTreemapPanel } from '.';
import { mockAlertSearchResponse } from './alerts_treemap/lib/mocks/mock_alert_search_response';

jest.mock('../../../../common/components/cell_actions', () => ({
  ...jest.requireActual('../../../../common/components/cell_actions'),
  SecurityCellActions: jest.fn(() => <div data-test-subj="cell-actions-component" />),
}));

const from = '2022-07-28T08:20:18.966Z';
const to = '2022-07-28T08:20:18.966Z';
jest.mock('../../../../common/containers/use_global_time', () => {
  const actual = jest.requireActual('../../../../common/containers/use_global_time');
  return {
    ...actual,
    useGlobalTime: jest
      .fn()
      .mockReturnValue({ from, to, setQuery: jest.fn(), deleteQuery: jest.fn() }),
  };
});

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useLocation: jest.fn().mockReturnValue({ pathname: '' }) };
});

jest.mock('../../../../common/lib/kibana', () => {
  const originalModule = jest.requireActual('../../../../common/lib/kibana');
  return {
    ...originalModule,
    useUiSetting$: () => ['0,0.[000]'],
  };
});

jest.mock('../../../containers/detection_engine/alerts/use_query', () => ({
  useQueryAlerts: jest.fn(),
}));

const defaultProps: Props = {
  addFilter: jest.fn(),
  alignHeader: 'flexStart',
  chartOptionsContextMenu: (queryId: string) => (
    <ChartContextMenu
      defaultStackByField={DEFAULT_STACK_BY_FIELD}
      defaultStackByField1={DEFAULT_STACK_BY_FIELD1}
      queryId={queryId}
      setStackBy={jest.fn()}
      setStackByField1={jest.fn()}
    />
  ),
  inspectTitle: TREEMAP,
  isPanelExpanded: true,
  filters: [
    {
      meta: {
        alias: null,
        negate: true,
        disabled: false,
        type: 'exists',
        key: 'kibana.alert.building_block_type',
        value: 'exists',
      },
      query: {
        exists: {
          field: 'kibana.alert.building_block_type',
        },
      },
    },
    {
      meta: {
        alias: null,
        negate: false,
        disabled: false,
        type: 'phrase',
        key: 'kibana.alert.workflow_status',
        params: {
          query: 'open',
        },
      },
      query: {
        term: {
          'kibana.alert.workflow_status': 'open',
        },
      },
    },
  ],
  query: {
    query: '',
    language: 'kuery',
  },
  riskSubAggregationField: 'signal.rule.risk_score',
  runtimeMappings: {
    test_via_alerts_table: {
      type: 'keyword',
      script: {
        source: 'emit("Hello World!");',
      },
    },
  },
  setIsPanelExpanded: jest.fn(),
  setStackByField0: jest.fn(),
  setStackByField1: jest.fn(),
  signalIndexName: '.alerts-security.alerts-default',
  stackByField0: 'kibana.alert.rule.name',
  stackByField1: 'host.name',
  title: <ChartSelect alertViewSelection="treemap" setAlertViewSelection={jest.fn()} />,
};

describe('AlertsTreemapPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocation as jest.Mock).mockReturnValue([
      { pageName: SecurityPageName.alerts, detailName: undefined },
    ]);

    (useQueryAlerts as jest.Mock).mockReturnValue({
      loading: false,
      data: mockAlertSearchResponse,
      setQuery: () => {},
      response: '',
      request: '',
      refetch: () => {},
    });
  });

  it('renders the panel', async () => {
    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.getByTestId('treemapPanel')).toBeInTheDocument());
  });

  it('renders the panel with a hidden overflow-x', async () => {
    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} />
      </TestProviders>
    );

    await waitFor(() =>
      expect(screen.getByTestId('treemapPanel')).toHaveStyleRule('overflow-x', 'hidden')
    );
  });

  it('renders the panel with the expected class to style the overflow-y scroll bar', async () => {
    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.getByTestId('treemapPanel')).toHaveClass('eui-yScroll'));
  });

  it('renders the panel with an auto overflow-y to allow vertical scrolling when necessary when the panel is expanded', async () => {
    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} />
      </TestProviders>
    );

    await waitFor(() =>
      expect(screen.getByTestId('treemapPanel')).toHaveStyleRule('overflow-y', 'auto')
    );
  });

  it('renders the panel with a hidden overflow-y when the panel is NOT expanded', async () => {
    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} isPanelExpanded={false} />
      </TestProviders>
    );

    await waitFor(() =>
      expect(screen.getByTestId('treemapPanel')).toHaveStyleRule('overflow-y', 'hidden')
    );
  });

  it('renders the chart selector as a custom header title', async () => {
    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.getByTestId('chart-select-tabs')).toBeInTheDocument());
  });

  it('renders field selection when `isPanelExpanded` is true', async () => {
    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.getByTestId('fieldSelection')).toBeInTheDocument());
  });

  it('does NOT render field selection when `isPanelExpanded` is false', async () => {
    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} isPanelExpanded={false} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.queryByTestId('fieldSelection')).not.toBeInTheDocument());
  });

  it('renders the progress bar when data is loading', async () => {
    (useQueryAlerts as jest.Mock).mockReturnValue({
      loading: true,
      data: mockAlertSearchResponse,
      setQuery: () => {},
      response: '',
      request: '',
      refetch: () => {},
    });

    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.getByTestId('progress')).toBeInTheDocument());
  });

  it('does NOT render the progress bar when loading is true, but the panel is collapsed', async () => {
    (useQueryAlerts as jest.Mock).mockReturnValue({
      loading: true, // <-- true when users click the page-level Refresh button
      data: mockAlertSearchResponse,
      setQuery: () => {},
      response: '',
      request: '',
      refetch: () => {},
    });

    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} isPanelExpanded={false} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.queryByTestId('progress')).not.toBeInTheDocument());
  });

  it('does NOT render the progress bar when data has loaded', async () => {
    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.queryByTestId('progress')).not.toBeInTheDocument());
  });

  it('renders the treemap when data is available and `isPanelExpanded` is true', async () => {
    jest.mock('../../../containers/detection_engine/alerts/use_query', () => {
      return {
        useQueryAlerts: () => ({
          loading: true,
          data: mockAlertSearchResponse,
          setQuery: () => {},
          response: '',
          request: '',
          refetch: () => {},
        }),
      };
    });

    render(
      <TestProviders>
        <AlertsTreemapPanel {...defaultProps} />
      </TestProviders>
    );

    await waitFor(() => expect(screen.getByTestId('alerts-treemap')).toBeInTheDocument());
  });
});
