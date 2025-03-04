/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { PromiseType } from 'utility-types';
import { CertResult, GetCertsParams, Ping } from '../../common/runtime_types';
import {
  getCertsRequestBody,
  processCertsResult,
} from '../../common/requests/get_certs_request_body';
import type { SyntheticsEsClient } from '../lib';

export const getSyntheticsCerts = async (
  requestParams: GetCertsParams & { syntheticsEsClient: SyntheticsEsClient }
): Promise<CertResult> => {
  const result = await getCertsResults(requestParams);

  return processCertsResult(result);
};

export type CertificatesResults = PromiseType<ReturnType<typeof getCertsResults>>;

const getCertsResults = async (
  requestParams: GetCertsParams & { syntheticsEsClient: SyntheticsEsClient }
) => {
  const { syntheticsEsClient } = requestParams;

  const searchBody = getCertsRequestBody(requestParams);

  const { body: result } = await syntheticsEsClient.search<Ping, typeof searchBody>(searchBody);

  return result;
};
