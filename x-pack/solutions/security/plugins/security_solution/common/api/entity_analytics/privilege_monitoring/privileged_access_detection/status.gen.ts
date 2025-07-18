/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Get the status of the privileged access detection package
 *   version: 2023-10-31
 */

import { z } from '@kbn/zod';

export type GetPrivilegedAccessDetectionPackageStatusResponse = z.infer<
  typeof GetPrivilegedAccessDetectionPackageStatusResponse
>;
export const GetPrivilegedAccessDetectionPackageStatusResponse = z.object({
  package_installation_status: z.enum(['complete', 'incomplete']),
  ml_module_setup_status: z.enum(['complete', 'incomplete']),
  jobs: z.array(
    z.object({
      job_id: z.string(),
      description: z.string().optional(),
      state: z.enum(['closing', 'closed', 'opened', 'failed', 'opening']),
    })
  ),
});
