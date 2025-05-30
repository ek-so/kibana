/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IKibanaResponse } from '@kbn/core/server';
import { IRouter, Logger } from '@kbn/core/server';
import { buildRouteValidationWithZod } from '@kbn/elastic-assistant-common/impl/schemas/common';
import {
  API_VERSIONS,
  DEFEND_INSIGHTS_BY_ID,
  DefendInsightGetRequestParams,
  DefendInsightGetResponse,
} from '@kbn/elastic-assistant-common';
import { transformError } from '@kbn/securitysolution-es-utils';

import { buildResponse } from '../../lib/build_response';
import { CallbackIds, ElasticAssistantRequestHandlerContext } from '../../types';
import {
  isDefendInsightsEnabled,
  runExternalCallbacks,
  updateDefendInsightLastViewedAt,
} from './helpers';

export const getDefendInsightRoute = (router: IRouter<ElasticAssistantRequestHandlerContext>) => {
  router.versioned
    .get({
      access: 'internal',
      path: DEFEND_INSIGHTS_BY_ID,
      security: {
        authz: {
          requiredPrivileges: ['securitySolution-readWorkflowInsights'],
        },
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.internal.v1,
        validate: {
          request: {
            params: buildRouteValidationWithZod(DefendInsightGetRequestParams),
          },
          response: {
            200: {
              body: { custom: buildRouteValidationWithZod(DefendInsightGetResponse) },
            },
          },
        },
      },
      async (context, request, response): Promise<IKibanaResponse<DefendInsightGetResponse>> => {
        const resp = buildResponse(response);
        const ctx = await context.resolve(['licensing', 'elasticAssistant']);

        const assistantContext = ctx.elasticAssistant;
        const logger: Logger = assistantContext.logger;
        try {
          const isEnabled = isDefendInsightsEnabled({
            request,
            logger,
            assistantContext,
          });
          if (!isEnabled) {
            return response.notFound();
          }

          if (!ctx.licensing.license.hasAtLeast('enterprise')) {
            return response.forbidden({
              body: {
                message:
                  'Your license does not support Defend Workflows. Please upgrade your license.',
              },
            });
          }

          const dataClient = await assistantContext.getDefendInsightsDataClient();
          const authenticatedUser = await assistantContext.getCurrentUser();
          if (authenticatedUser == null) {
            return resp.error({
              body: `Authenticated user not found`,
              statusCode: 401,
            });
          }
          if (!dataClient) {
            return resp.error({
              body: `Defend insights data client not initialized`,
              statusCode: 500,
            });
          }

          const defendInsights = await dataClient.findDefendInsightsByParams({
            params: { ids: [request.params.id] },
            authenticatedUser,
          });

          if (defendInsights.length) {
            await runExternalCallbacks(
              CallbackIds.DefendInsightsPostFetch,
              request,
              defendInsights[0].endpointIds
            );
          }

          const updatedDefendInsight = await updateDefendInsightLastViewedAt({
            dataClient,
            defendInsights,
            authenticatedUser,
          });

          return response.ok({
            body: { data: updatedDefendInsight },
          });
        } catch (err) {
          logger.error(err);
          const error = transformError(err);

          return resp.error({
            body: { success: false, error: error.message },
            statusCode: error.statusCode,
          });
        }
      }
    );
};
