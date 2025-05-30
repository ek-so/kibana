/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React from 'react';
import { Redirect } from 'react-router-dom';
import { i18n } from '@kbn/i18n';
import { dynamic } from '@kbn/shared-ux-utility';
import { ML_PAGES } from '../../../../locator';
import type { NavigateToPath } from '../../../contexts/kibana';
import { useMlKibana } from '../../../contexts/kibana';
import type { MlRoute, PageProps } from '../../router';
import { createPath, PageLoader } from '../../router';
import { useRouteResolver } from '../../use_resolver';
import { basicResolvers } from '../../resolvers';
import { preConfiguredJobRedirect } from '../../../jobs/new_job/pages/index_or_search';
import { getBreadcrumbWithUrlForApp } from '../../breadcrumbs';

enum MODE {
  NEW_JOB,
  DATAVISUALIZER,
}

const Page = dynamic(async () => ({
  default: (await import('../../../jobs/new_job/pages/index_or_search')).Page,
}));

interface IndexOrSearchPageProps extends PageProps {
  nextStepPath: string;
  mode: MODE;
  extraButtons?: React.ReactNode;
  entryPoint?: string;
}

const getLogRateAnalysisBreadcrumbs = (navigateToPath: NavigateToPath, basePath: string) => [
  getBreadcrumbWithUrlForApp('ML_BREADCRUMB', navigateToPath, basePath),
  getBreadcrumbWithUrlForApp('AIOPS_BREADCRUMB_LOG_RATE_ANALYSIS', navigateToPath, basePath),
  getBreadcrumbWithUrlForApp('LOG_RATE_ANALYSIS', navigateToPath, basePath),
  {
    text: i18n.translate('xpack.ml.aiopsBreadcrumbs.selectDataViewLabel', {
      defaultMessage: 'Select Data View',
    }),
  },
];

const getLogCategorizationBreadcrumbs = (navigateToPath: NavigateToPath, basePath: string) => [
  getBreadcrumbWithUrlForApp('ML_BREADCRUMB', navigateToPath, basePath),
  getBreadcrumbWithUrlForApp('AIOPS_BREADCRUMB_LOG_PATTERN_ANALYSIS', navigateToPath, basePath),
  getBreadcrumbWithUrlForApp('LOG_PATTERN_ANALYSIS', navigateToPath, basePath),
  {
    text: i18n.translate('xpack.ml.aiopsBreadcrumbs.selectDataViewLabel', {
      defaultMessage: 'Select Data View',
    }),
  },
];

const getChangePointDetectionBreadcrumbs = (navigateToPath: NavigateToPath, basePath: string) => [
  getBreadcrumbWithUrlForApp('ML_BREADCRUMB', navigateToPath, basePath),
  getBreadcrumbWithUrlForApp('AIOPS_BREADCRUMB_CHANGE_POINT_DETECTION', navigateToPath, basePath),
  getBreadcrumbWithUrlForApp('CHANGE_POINT_DETECTION', navigateToPath, basePath),
  {
    text: i18n.translate('xpack.ml.aiopsBreadcrumbs.selectDataViewLabel', {
      defaultMessage: 'Select Data View',
    }),
  },
];

export const logRateAnalysisIndexOrSearchRouteFactory = (
  navigateToPath: NavigateToPath,
  basePath: string
): MlRoute => ({
  id: 'data_view_log_rate_analysis',
  path: createPath(ML_PAGES.AIOPS_LOG_RATE_ANALYSIS_INDEX_SELECT),
  title: i18n.translate('xpack.ml.selectDataViewLabel', {
    defaultMessage: 'Select Data View',
  }),
  render: (props, deps) => (
    <PageWrapper
      {...props}
      nextStepPath={createPath(ML_PAGES.AIOPS_LOG_RATE_ANALYSIS)}
      deps={deps}
      mode={MODE.DATAVISUALIZER}
    />
  ),
  breadcrumbs: getLogRateAnalysisBreadcrumbs(navigateToPath, basePath),
});

/**
 * @deprecated since 8.10, kept here to redirect old bookmarks.
 */
export const explainLogRateSpikesIndexOrSearchRouteFactory = (): MlRoute => ({
  path: createPath(ML_PAGES.AIOPS_EXPLAIN_LOG_RATE_SPIKES_INDEX_SELECT),
  render: () => <Redirect to={createPath(ML_PAGES.AIOPS_LOG_RATE_ANALYSIS_INDEX_SELECT)} />,
  // no breadcrumbs since it's just a redirect
  breadcrumbs: [],
});

export const logCategorizationIndexOrSearchRouteFactory = (
  navigateToPath: NavigateToPath,
  basePath: string
): MlRoute => ({
  id: 'data_view_log_categorization',
  path: createPath(ML_PAGES.AIOPS_LOG_CATEGORIZATION_INDEX_SELECT),
  title: i18n.translate('xpack.ml.selectDataViewLabel', {
    defaultMessage: 'Select Data View',
  }),
  render: (props, deps) => (
    <PageWrapper
      {...props}
      nextStepPath={createPath(ML_PAGES.AIOPS_LOG_CATEGORIZATION)}
      deps={deps}
      mode={MODE.DATAVISUALIZER}
    />
  ),
  breadcrumbs: getLogCategorizationBreadcrumbs(navigateToPath, basePath),
});

export const changePointDetectionIndexOrSearchRouteFactory = (
  navigateToPath: NavigateToPath,
  basePath: string
): MlRoute => ({
  id: 'data_view_change_point_detection',
  path: createPath(ML_PAGES.AIOPS_CHANGE_POINT_DETECTION_INDEX_SELECT),
  title: i18n.translate('xpack.ml.selectDataViewLabel', {
    defaultMessage: 'Select Data View',
  }),
  render: (props, deps) => (
    <PageWrapper
      {...props}
      nextStepPath={createPath(ML_PAGES.AIOPS_CHANGE_POINT_DETECTION)}
      deps={deps}
      mode={MODE.DATAVISUALIZER}
    />
  ),
  breadcrumbs: getChangePointDetectionBreadcrumbs(navigateToPath, basePath),
});

// TODO: update PageWrapper - no longer need job creation items
const PageWrapper: FC<IndexOrSearchPageProps> = ({ nextStepPath, mode, extraButtons }) => {
  const {
    services: {
      http: { basePath },
      application: { navigateToUrl },
      data: { dataViews: dataViewsService },
    },
  } = useMlKibana();

  const newJobResolvers = {
    ...basicResolvers(),
    preConfiguredJobRedirect: () =>
      preConfiguredJobRedirect(dataViewsService, basePath.get(), navigateToUrl),
  };

  const { context } = useRouteResolver(
    mode === MODE.NEW_JOB ? 'full' : 'basic',
    mode === MODE.NEW_JOB ? ['canCreateJob'] : [],
    mode === MODE.NEW_JOB ? newJobResolvers : {}
  );
  return (
    <PageLoader context={context}>
      <Page {...{ nextStepPath, extraButtons }} />
    </PageLoader>
  );
};
