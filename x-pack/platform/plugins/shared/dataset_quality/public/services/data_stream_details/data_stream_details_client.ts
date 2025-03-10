/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { HttpStart } from '@kbn/core/public';
import { decodeOrThrow } from '@kbn/io-ts-utils';
import {
  CheckAndLoadIntegrationResponse,
  checkAndLoadIntegrationResponseRt,
  DataStreamRolloverResponse,
  dataStreamRolloverResponseRt,
  DegradedFieldAnalysis,
  degradedFieldAnalysisRt,
  DegradedFieldValues,
  degradedFieldValuesRt,
  FailedDocsDetails,
  FailedDocsErrorsResponse,
  failedDocsErrorsRt,
  getDataStreamDegradedFieldsResponseRt,
  getDataStreamsDetailsResponseRt,
  getDataStreamsSettingsResponseRt,
  IntegrationDashboardsResponse,
  integrationDashboardsRT,
  qualityIssueBaseRT,
  UpdateFieldLimitResponse,
  updateFieldLimitResponseRt,
} from '../../../common/api_types';
import {
  DataStreamDetails,
  DataStreamSettings,
  DegradedFieldResponse,
  GetDataStreamDegradedFieldsParams,
  GetDataStreamDegradedFieldValuesPathParams,
  GetDataStreamDetailsParams,
  GetDataStreamDetailsResponse,
  GetDataStreamFailedDocsDetailsParams,
  GetDataStreamFailedDocsErrorsParams,
  GetDataStreamSettingsParams,
  GetDataStreamSettingsResponse,
  GetIntegrationDashboardsParams,
} from '../../../common/data_streams_stats';
import { IDataStreamDetailsClient } from './types';
import { Integration } from '../../../common/data_streams_stats/integration';
import {
  AnalyzeDegradedFieldsParams,
  CheckAndLoadIntegrationParams,
  UpdateFieldLimitParams,
} from '../../../common/data_stream_details/types';
import { DatasetQualityError } from '../../../common/errors';

export class DataStreamDetailsClient implements IDataStreamDetailsClient {
  constructor(private readonly http: HttpStart) {}

  public async getDataStreamSettings({ dataStream }: GetDataStreamSettingsParams) {
    const response = await this.http
      .get<GetDataStreamSettingsResponse>(
        `/internal/dataset_quality/data_streams/${dataStream}/settings`
      )
      .catch((error) => {
        throw new DatasetQualityError(`Failed to fetch data stream settings": ${error}`, error);
      });

    const dataStreamSettings = decodeOrThrow(
      getDataStreamsSettingsResponseRt,
      (message: string) =>
        new DatasetQualityError(`Failed to decode data stream settings response: ${message}"`)
    )(response);

    return dataStreamSettings as DataStreamSettings;
  }

  public async getDataStreamDetails({ dataStream, start, end }: GetDataStreamDetailsParams) {
    const response = await this.http
      .get<GetDataStreamDetailsResponse>(
        `/internal/dataset_quality/data_streams/${dataStream}/details`,
        {
          query: { start, end },
        }
      )
      .catch((error) => {
        throw new DatasetQualityError(`Failed to fetch data stream details": ${error}`, error);
      });

    const dataStreamDetails = decodeOrThrow(
      getDataStreamsDetailsResponseRt,
      (message: string) =>
        new DatasetQualityError(`Failed to decode data stream details response: ${message}"`)
    )(response);

    return dataStreamDetails as DataStreamDetails;
  }

  public async getFailedDocsDetails({
    dataStream,
    start,
    end,
  }: GetDataStreamFailedDocsDetailsParams) {
    const response = await this.http
      .get<FailedDocsDetails>(`/internal/dataset_quality/data_streams/${dataStream}/failed_docs`, {
        query: { start, end },
      })
      .catch((error) => {
        throw new DatasetQualityError(
          `Failed to fetch data stream failed docs details": ${error}`,
          error
        );
      });

    return decodeOrThrow(
      qualityIssueBaseRT,
      (message: string) =>
        new DatasetQualityError(
          `Failed to decode data stream failed docs details response: ${message}"`
        )
    )(response);
  }

  public async getFailedDocsErrors({
    dataStream,
    start,
    end,
  }: GetDataStreamFailedDocsErrorsParams): Promise<FailedDocsErrorsResponse> {
    const response = await this.http
      .get<FailedDocsDetails>(
        `/internal/dataset_quality/data_streams/${dataStream}/failed_docs/errors`,
        {
          query: { start, end },
        }
      )
      .catch((error) => {
        throw new DatasetQualityError(
          `Failed to fetch data stream failed docs details": ${error}`,
          error
        );
      });

    return decodeOrThrow(
      failedDocsErrorsRt,
      (message: string) =>
        new DatasetQualityError(
          `Failed to decode data stream failed docs details response: ${message}"`
        )
    )(response);
  }

  public async getDataStreamDegradedFields({
    dataStream,
    start,
    end,
  }: GetDataStreamDegradedFieldsParams) {
    const response = await this.http
      .get<DegradedFieldResponse>(
        `/internal/dataset_quality/data_streams/${dataStream}/degraded_fields`,
        {
          query: { start, end },
        }
      )
      .catch((error) => {
        throw new DatasetQualityError(
          `Failed to fetch data stream degraded fields": ${error}`,
          error
        );
      });

    return decodeOrThrow(
      getDataStreamDegradedFieldsResponseRt,
      (message: string) =>
        new DatasetQualityError(
          `Failed to decode data stream degraded fields response: ${message}"`
        )
    )(response);
  }

  public async getDataStreamDegradedFieldValues({
    dataStream,
    degradedField,
  }: GetDataStreamDegradedFieldValuesPathParams): Promise<DegradedFieldValues> {
    const response = await this.http
      .get<DegradedFieldValues>(
        `/internal/dataset_quality/data_streams/${dataStream}/degraded_field/${degradedField}/values`
      )
      .catch((error) => {
        throw new DatasetQualityError(
          `Failed to fetch data stream degraded field Value": ${error}`,
          error
        );
      });

    return decodeOrThrow(
      degradedFieldValuesRt,
      (message: string) =>
        new DatasetQualityError(
          `Failed to decode data stream degraded field values response: ${message}"`
        )
    )(response);
  }

  public async checkAndLoadIntegration({ dataStream }: CheckAndLoadIntegrationParams) {
    const response = await this.http
      .get<CheckAndLoadIntegrationResponse>(
        `/internal/dataset_quality/data_streams/${dataStream}/integration/check`
      )
      .catch((error) => {
        throw new DatasetQualityError(
          `Failed to check if data stream belongs to an integration": ${error}`,
          error
        );
      });

    const decodedResponse = decodeOrThrow(
      checkAndLoadIntegrationResponseRt,
      (message: string) =>
        new DatasetQualityError(`Failed to decode integration check response: ${message}"`)
    )(response);

    return {
      ...decodedResponse,
      integration: decodedResponse.isIntegration
        ? Integration.create(decodedResponse.integration)
        : undefined,
    };
  }

  public async getIntegrationDashboards({ integration }: GetIntegrationDashboardsParams) {
    const response = await this.http
      .get<IntegrationDashboardsResponse>(
        `/internal/dataset_quality/integrations/${integration}/dashboards`
      )
      .catch((error) => {
        throw new DatasetQualityError(`Failed to fetch integration dashboards": ${error}`, error);
      });

    const { dashboards } = decodeOrThrow(
      integrationDashboardsRT,
      (message: string) =>
        new DatasetQualityError(`Failed to decode integration dashboards response: ${message}"`)
    )(response);

    return dashboards;
  }

  public async analyzeDegradedField({
    dataStream,
    degradedField,
    lastBackingIndex,
  }: AnalyzeDegradedFieldsParams): Promise<DegradedFieldAnalysis> {
    const response = await this.http
      .get<DegradedFieldAnalysis>(
        `/internal/dataset_quality/data_streams/${dataStream}/degraded_field/${degradedField}/analyze`,
        { query: { lastBackingIndex } }
      )
      .catch((error) => {
        throw new DatasetQualityError(
          `Failed to analyze degraded field: ${degradedField} for datastream: ${dataStream}`,
          error
        );
      });

    return decodeOrThrow(
      degradedFieldAnalysisRt,
      (message: string) =>
        new DatasetQualityError(`Failed to decode the analysis response: ${message}`)
    )(response);
  }

  public async setNewFieldLimit({
    dataStream,
    newFieldLimit,
  }: UpdateFieldLimitParams): Promise<UpdateFieldLimitResponse> {
    const response = await this.http
      .put<UpdateFieldLimitResponse>(
        `/internal/dataset_quality/data_streams/${dataStream}/update_field_limit`,
        { body: JSON.stringify({ newFieldLimit }) }
      )
      .catch((error) => {
        throw new DatasetQualityError(`Failed to set new Limit: ${error.message}`, error);
      });

    const decodedResponse = decodeOrThrow(
      updateFieldLimitResponseRt,
      (message: string) =>
        new DatasetQualityError(`Failed to decode setting of new limit response: ${message}"`)
    )(response);

    return decodedResponse;
  }

  public async rolloverDataStream({
    dataStream,
  }: {
    dataStream: string;
  }): Promise<DataStreamRolloverResponse> {
    const response = await this.http
      .post<DataStreamRolloverResponse>(
        `/internal/dataset_quality/data_streams/${dataStream}/rollover`
      )
      .catch((error) => {
        throw new DatasetQualityError(`Failed to rollover datastream": ${error}`, error);
      });

    return decodeOrThrow(
      dataStreamRolloverResponseRt,
      (message: string) =>
        new DatasetQualityError(`Failed to decode rollover response: ${message}"`)
    )(response);
  }
}
