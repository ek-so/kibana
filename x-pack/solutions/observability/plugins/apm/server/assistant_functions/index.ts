/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreSetup } from '@kbn/core-lifecycle-server';
import type { Logger } from '@kbn/logging';
import type {
  RegistrationCallback,
  RegisterFunction,
} from '@kbn/observability-ai-assistant-plugin/server/service/types';
import type { IRuleDataClient } from '@kbn/rule-registry-plugin/server';
import type { APMConfig } from '..';
import type { ApmFeatureFlags } from '../../common/apm_feature_flags';
import type { APMEventClient } from '../lib/helpers/create_es_client/create_apm_event_client';
import { getApmEventClient } from '../lib/helpers/get_apm_event_client';
import { getRandomSampler } from '../lib/helpers/get_random_sampler';
import type {
  APMRouteHandlerResources,
  MinimalAPMRouteHandlerResources,
} from '../routes/apm_routes/register_apm_server_routes';
import { hasHistoricalAgentData } from '../routes/historical_data/has_historical_agent_data';
import { registerGetApmDatasetInfoFunction } from './get_apm_dataset_info';
import { registerGetApmDownstreamDependenciesFunction } from './get_apm_downstream_dependencies';
import { registerGetApmTimeseriesFunction } from './get_apm_timeseries';

export interface FunctionRegistrationParameters {
  apmEventClient: APMEventClient;
  registerFunction: RegisterFunction;
  resources: MinimalAPMRouteHandlerResources;
}

export function registerAssistantFunctions({
  coreSetup,
  config,
  featureFlags,
  logger,
  kibanaVersion,
  ruleDataClient,
  plugins,
}: {
  coreSetup: CoreSetup;
  config: APMConfig;
  featureFlags: ApmFeatureFlags;
  logger: Logger;
  kibanaVersion: string;
  ruleDataClient: IRuleDataClient;
  plugins: APMRouteHandlerResources['plugins'];
}): RegistrationCallback {
  return async ({ resources, functions: { registerFunction }, scopes }) => {
    if (!scopes.includes('observability')) {
      return;
    }
    const apmRouteHandlerResources: MinimalAPMRouteHandlerResources = {
      context: resources.context,
      request: resources.request,
      core: {
        setup: coreSetup,
        start: () => coreSetup.getStartServices().then(([coreStart]) => coreStart),
      },
      params: {
        query: {
          _inspect: false,
        },
      },
      config,
      featureFlags,
      logger,
      kibanaVersion,
      ruleDataClient,
      plugins,
      getApmIndices: async () => {
        const coreContext = await resources.context.core;
        const apmIndices = await plugins.apmDataAccess.setup.getApmIndices(
          coreContext.savedObjects.client
        );
        return apmIndices;
      },
    };

    const { request, core } = apmRouteHandlerResources;

    const coreStart = await core.start();
    const [apmEventClient, randomSampler] = await Promise.all([
      getApmEventClient(apmRouteHandlerResources),
      getRandomSampler({ coreStart, request, probability: 1 }),
    ]);

    const hasData = await hasHistoricalAgentData(apmEventClient);

    if (!hasData) {
      return;
    }

    const parameters: FunctionRegistrationParameters = {
      resources: apmRouteHandlerResources,
      apmEventClient,
      registerFunction,
    };

    registerGetApmDownstreamDependenciesFunction({ ...parameters, randomSampler });
    registerGetApmTimeseriesFunction(parameters);
    registerGetApmDatasetInfoFunction(parameters);
  };
}
