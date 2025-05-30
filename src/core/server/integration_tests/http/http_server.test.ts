/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Server } from 'http';
import supertest from 'supertest';
import moment from 'moment';
import { of } from 'rxjs';
import { ByteSizeValue } from '@kbn/config-schema';
import { Router } from '@kbn/core-http-router-server-internal';
import { HttpServer, HttpConfig } from '@kbn/core-http-server-internal';
import { mockCoreContext } from '@kbn/core-base-server-mocks';
import type { Logger } from '@kbn/logging';
import { createTestEnv, getEnvOptions } from '@kbn/config-mocks';

const options = getEnvOptions();
options.cliArgs.dev = false;
const env = createTestEnv({ envOptions: options });

describe('Http server', () => {
  let server: HttpServer;
  let config: HttpConfig;
  let logger: Logger;
  let coreContext: ReturnType<typeof mockCoreContext.create>;
  const enhanceWithContext = (fn: (...args: any[]) => any) => fn.bind(null, {});

  beforeEach(() => {
    coreContext = mockCoreContext.create();
    logger = coreContext.logger.get();

    config = {
      name: 'kibana',
      host: '127.0.0.1',
      maxPayload: new ByteSizeValue(1024),
      port: 10002,
      ssl: { enabled: false },
      compression: { enabled: true, brotli: { enabled: false } },
      requestId: {
        allowFromAnyIp: true,
        ipAllowlist: [],
      },
      cdn: {},
      cors: {
        enabled: false,
      },
      shutdownTimeout: moment.duration(5, 's'),
      restrictInternalApis: false,
    } as any;

    server = new HttpServer(coreContext, 'tests', of(config.shutdownTimeout));
  });

  describe('Graceful shutdown', () => {
    let shutdownTimeout: number;
    let innerServerListener: Server;

    beforeEach(async () => {
      shutdownTimeout = config.shutdownTimeout.asMilliseconds();
      const { registerRouter, server: innerServer } = await server.setup({ config$: of(config) });
      innerServerListener = innerServer.listener;

      const router = new Router('', logger, enhanceWithContext, {
        env,
        versionedRouterOptions: {
          defaultHandlerResolutionStrategy: 'oldest',
        },
      });
      router.post(
        {
          path: '/',
          security: { authz: { enabled: false, reason: '' } },
          validate: false,
          options: { body: { accepts: 'application/json' } },
        },
        async (context, req, res) => {
          // It takes to resolve the same period of the shutdownTimeout.
          // Since we'll trigger the stop a few ms after, it should have time to finish
          await new Promise((resolve) => setTimeout(resolve, shutdownTimeout));
          return res.ok({ body: { ok: 1 } });
        }
      );
      registerRouter(router);

      await server.start();
    });

    test('any ongoing requests should be resolved with `connection: close`', async () => {
      const [response] = await Promise.all([
        // Trigger a request that should hold the server from stopping until fulfilled
        supertest(innerServerListener).post('/'),
        // Stop the server while the request is in progress
        (async () => {
          await new Promise((resolve) => setTimeout(resolve, shutdownTimeout / 3));
          await server.stop();
        })(),
      ]);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({ ok: 1 });
      // The server is about to be closed, we need to ask connections to close on their end (stop their keep-alive policies)
      expect(response.header.connection).toBe('close');
    });

    test('any requests triggered while stopping should be rejected with 503', async () => {
      const [, , response] = await Promise.all([
        // Trigger a request that should hold the server from stopping until fulfilled (otherwise the server will stop straight away)
        supertest(innerServerListener).post('/'),
        // Stop the server while the request is in progress
        (async () => {
          await new Promise((resolve) => setTimeout(resolve, shutdownTimeout / 3));
          await server.stop();
        })(),
        // Trigger a new request while shutting down (should be rejected)
        (async () => {
          await new Promise((resolve) => setTimeout(resolve, (2 * shutdownTimeout) / 3));
          return supertest(innerServerListener).post('/');
        })(),
      ]);
      expect(response.status).toBe(503);
      expect(response.body).toStrictEqual({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Kibana is shutting down and not accepting new incoming requests',
      });
      expect(response.header.connection).toBe('close');
    });

    test('when no ongoing connections, the server should stop without waiting any longer', async () => {
      const preStop = Date.now();
      await server.stop();
      expect(Date.now() - preStop).toBeLessThan(shutdownTimeout);
    });
  });
});
