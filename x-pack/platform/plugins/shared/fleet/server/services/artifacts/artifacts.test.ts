/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { elasticsearchServiceMock } from '@kbn/core/server/mocks';

import { errors } from '@elastic/elasticsearch';

import type { TransportResult } from '@elastic/elasticsearch';

import { set } from '@kbn/safer-lodash-set';

import { FLEET_SERVER_ARTIFACTS_INDEX } from '../../../common';

import { ArtifactsElasticsearchError } from '../../errors';

import { appContextService } from '../app_context';
import { createAppContextStartContractMock } from '../../mocks';

import { newArtifactToElasticsearchProperties, uniqueIdFromArtifact } from './mappings';

import {
  generateArtifactEsGetSingleHitMock,
  generateArtifactEsSearchResultHitsMock,
  generateArtifactMock,
  generateEsRequestErrorApiResponseMock,
  setEsClientMethodResponseToError,
} from './mocks';
import {
  bulkCreateArtifacts,
  bulkDeleteArtifacts,
  createArtifact,
  deleteArtifact,
  encodeArtifactContent,
  fetchAllArtifacts,
  generateArtifactContentHash,
  getArtifact,
  listArtifacts,
} from './artifacts';

import type { NewArtifact } from './types';
import type { FetchAllArtifactsOptions } from './types';

describe('When using the artifacts services', () => {
  let esClientMock: ReturnType<typeof elasticsearchServiceMock.createInternalClient>;

  beforeEach(() => {
    appContextService.start(createAppContextStartContractMock());
    esClientMock = elasticsearchServiceMock.createInternalClient();
  });

  describe('and calling `getArtifact()`', () => {
    it('should get artifact using id', async () => {
      // @ts-expect-error not full interface
      esClientMock.get.mockResponse(generateArtifactEsGetSingleHitMock());

      expect(await getArtifact(esClientMock, '123')).toEqual(generateArtifactMock());
      expect(esClientMock.get).toHaveBeenCalledWith({
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        id: '123',
      });
    });

    it('should return undefined if artifact is not found', async () => {
      setEsClientMethodResponseToError(esClientMock, 'get', { statusCode: 404 });
      expect(await getArtifact(esClientMock, '123')).toBeUndefined();
    });

    it('should throw an ArtifactElasticsearchError if one is encountered', async () => {
      esClientMock.get.mockImplementation(() => {
        return elasticsearchServiceMock.createErrorTransportRequestPromise(
          new errors.ResponseError(generateEsRequestErrorApiResponseMock())
        );
      });

      await expect(getArtifact(esClientMock, '123')).rejects.toBeInstanceOf(
        ArtifactsElasticsearchError
      );
    });
  });

  describe('and calling `createArtifact()`', () => {
    let newArtifact: NewArtifact;

    beforeEach(() => {
      const { id, created, ...artifact } = generateArtifactMock();
      newArtifact = artifact;
    });

    it('should create and return artifact', async () => {
      const artifact = await createArtifact(esClientMock, newArtifact);

      expect(esClientMock.create).toHaveBeenCalledWith({
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        id: `${artifact.packageName}:${artifact.identifier}-${artifact.decodedSha256}`,
        body: {
          ...newArtifactToElasticsearchProperties(newArtifact),
          created: expect.any(String),
        },
        refresh: 'wait_for',
      });

      expect(artifact).toEqual({
        ...newArtifact,
        id: expect.any(String),
        created: expect.any(String),
      });
    });

    it('should ignore 409 errors from elasticsearch', async () => {
      const error = new errors.ResponseError({ statusCode: 409 } as TransportResult);
      // Unclear why `mockRejectedValue()` has the params value type set to `never`
      esClientMock.create.mockRejectedValue(error);
      await expect(() => createArtifact(esClientMock, newArtifact)).not.toThrow();
    });

    it('should throw an ArtifactElasticsearchError if one is encountered', async () => {
      setEsClientMethodResponseToError(esClientMock, 'create');
      await expect(createArtifact(esClientMock, newArtifact)).rejects.toBeInstanceOf(
        ArtifactsElasticsearchError
      );
    });
  });

  describe('and calling `bulkCreateArtifacts()`', () => {
    let newArtifact: NewArtifact;

    beforeEach(() => {
      const { id, created, ...artifact } = generateArtifactMock();
      newArtifact = artifact;
    });

    it('should create and return artifacts', async () => {
      const { artifacts } = await bulkCreateArtifacts(esClientMock, [newArtifact]);
      const artifact = artifacts![0];

      expect(esClientMock.bulk).toHaveBeenCalledWith({
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        refresh: false,
        body: [
          {
            create: {
              _id: `${artifact.packageName}:${artifact.identifier}-${artifact.decodedSha256}`,
            },
          },
          {
            ...newArtifactToElasticsearchProperties(newArtifact),
            created: expect.any(String),
          },
        ],
      });

      expect(artifact).toEqual({
        ...newArtifact,
        id: expect.any(String),
        created: expect.any(String),
      });
    });

    it('should create and return a single big artifact', async () => {
      const { ...generatedArtifact } = generateArtifactMock({ encodedSize: 1_500 });
      const newBigArtifact = generatedArtifact;

      const { artifacts } = await bulkCreateArtifacts(esClientMock, [newBigArtifact]);
      const artifact = artifacts![0];

      expect(esClientMock.bulk).toHaveBeenCalledWith({
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        refresh: false,
        body: [
          {
            create: {
              _id: `${artifact.packageName}:${artifact.identifier}-${artifact.decodedSha256}`,
            },
          },
          {
            ...newArtifactToElasticsearchProperties(newBigArtifact),
            created: expect.any(String),
          },
        ],
      });

      expect(artifact).toEqual({
        ...newBigArtifact,
        id: expect.any(String),
        created: expect.any(String),
      });
    });

    it('should create and return a multiple big artifacts', async () => {
      const newBigArtifact1 = generateArtifactMock({
        encodedSize: 5_000_500,
        decodedSha256: '1234',
      });
      const newBigArtifact2 = generateArtifactMock({
        encodedSize: 500,
        decodedSha256: '2345',
      });
      const newBigArtifact3 = generateArtifactMock({
        encodedSize: 233,
        decodedSha256: '3456',
      });
      const newBigArtifact4 = generateArtifactMock({
        encodedSize: 7_000_000,
        decodedSha256: '4567',
      });

      const { artifacts } = await bulkCreateArtifacts(esClientMock, [
        newBigArtifact1,
        newBigArtifact2,
        newBigArtifact3,
        newBigArtifact4,
      ]);
      const artifact1 = artifacts![0];
      const artifact2 = artifacts![1];
      const artifact3 = artifacts![2];
      const artifact4 = artifacts![3];

      expect(esClientMock.bulk).toHaveBeenCalledTimes(3);

      expect(esClientMock.bulk).toHaveBeenNthCalledWith(1, {
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        refresh: false,
        body: [
          {
            create: {
              _id: `${artifact3.packageName}:${artifact3.identifier}-${artifact3.decodedSha256}`,
            },
          },
          {
            ...newArtifactToElasticsearchProperties(newBigArtifact3),
            created: expect.any(String),
          },
          {
            create: {
              _id: `${artifact2.packageName}:${artifact2.identifier}-${artifact2.decodedSha256}`,
            },
          },
          {
            ...newArtifactToElasticsearchProperties(newBigArtifact2),
            created: expect.any(String),
          },
        ],
      });

      expect(esClientMock.bulk).toHaveBeenNthCalledWith(2, {
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        refresh: false,
        body: [
          {
            create: {
              _id: `${artifact1.packageName}:${artifact1.identifier}-${artifact1.decodedSha256}`,
            },
          },
          {
            ...newArtifactToElasticsearchProperties(newBigArtifact1),
            created: expect.any(String),
          },
        ],
      });

      expect(esClientMock.bulk).toHaveBeenNthCalledWith(3, {
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        refresh: false,
        body: [
          {
            create: {
              _id: `${artifact4.packageName}:${artifact4.identifier}-${artifact4.decodedSha256}`,
            },
          },
          {
            ...newArtifactToElasticsearchProperties(newBigArtifact4),
            created: expect.any(String),
          },
        ],
      });

      expect(artifact1).toEqual({
        ...newBigArtifact1,
        id: uniqueIdFromArtifact(newBigArtifact1),
        created: expect.any(String),
      });
      expect(artifact2).toEqual({
        ...newBigArtifact2,
        id: uniqueIdFromArtifact(newBigArtifact2),
        created: expect.any(String),
      });
      expect(artifact3).toEqual({
        ...newBigArtifact3,
        id: uniqueIdFromArtifact(newBigArtifact3),
        created: expect.any(String),
      });
      expect(artifact4).toEqual({
        ...newBigArtifact4,
        id: uniqueIdFromArtifact(newBigArtifact4),
        created: expect.any(String),
      });
    });

    it('should create and return none artifact when none provided', async () => {
      await bulkCreateArtifacts(esClientMock, []);

      expect(esClientMock.bulk).toHaveBeenCalledTimes(0);
    });

    it('should ignore 409 errors from elasticsearch', async () => {
      esClientMock.bulk.mockResolvedValue({
        errors: true,
        items: [{ create: { status: 409 } as any }],
      } as any);
      const { artifacts, errors: responseErrors } = await bulkCreateArtifacts(esClientMock, [
        newArtifact,
      ]);

      expect(responseErrors).toBeUndefined();
      expect(artifacts?.length).toEqual(1);
    });

    it('should return error if one is encountered', async () => {
      esClientMock.bulk.mockResolvedValue({
        errors: true,
        items: [{ create: { status: 400, error: { reason: 'error' } } as any }],
      } as any);
      const { artifacts, errors: responseErrors } = await bulkCreateArtifacts(esClientMock, [
        newArtifact,
      ]);

      expect(responseErrors).toEqual([
        new Error(
          'Create of artifact id [undefined] returned: result [undefined], status [400], reason [{"reason":"error"}]'
        ),
      ]);
      expect(artifacts).toEqual([
        {
          body: 'eJyrVkrNKynKTC1WsoqOrQUAJxkFKQ==',
          compressionAlgorithm: 'zlib',
          created: expect.any(String),
          decodedSha256: 'd801aa1fb',
          decodedSize: 14,
          encodedSha256: 'd29238d40',
          encodedSize: 22,
          encryptionAlgorithm: 'none',
          id: 'endpoint:trustlist-v1-d801aa1fb',
          identifier: 'trustlist-v1',
          packageName: 'endpoint',
          relative_url: '/api/fleet/artifacts/trustlist-v1/d801aa1fb',
          type: 'trustlist',
        },
      ]);
    });
  });

  describe('and calling `deleteArtifact()`', () => {
    it('should delete the artifact', async () => {
      await deleteArtifact(esClientMock, '123');

      expect(esClientMock.delete).toHaveBeenCalledWith({
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        id: '123',
        refresh: 'wait_for',
      });
    });

    it('should throw an ArtifactElasticsearchError if one is encountered', async () => {
      setEsClientMethodResponseToError(esClientMock, 'delete');

      await expect(deleteArtifact(esClientMock, '123')).rejects.toBeInstanceOf(
        ArtifactsElasticsearchError
      );
    });
  });

  describe('and calling `bulkDeleteArtifacts()`', () => {
    it('should delete single artifact', async () => {
      await bulkDeleteArtifacts(esClientMock, ['123']);

      expect(esClientMock.bulk).toHaveBeenCalledWith({
        refresh: 'wait_for',
        body: [
          {
            delete: {
              _id: '123',
              _index: FLEET_SERVER_ARTIFACTS_INDEX,
            },
          },
        ],
      });
    });

    it('should delete all the artifacts', async () => {
      await bulkDeleteArtifacts(esClientMock, ['123', '231']);

      expect(esClientMock.bulk).toHaveBeenCalledWith({
        refresh: 'wait_for',
        body: [
          {
            delete: {
              _id: '123',
              _index: FLEET_SERVER_ARTIFACTS_INDEX,
            },
          },
          {
            delete: {
              _id: '231',
              _index: FLEET_SERVER_ARTIFACTS_INDEX,
            },
          },
        ],
      });
    });

    it('should throw an ArtifactElasticsearchError if one is encountered', async () => {
      setEsClientMethodResponseToError(esClientMock, 'bulk');

      await expect(bulkDeleteArtifacts(esClientMock, ['123'])).rejects.toBeInstanceOf(
        ArtifactsElasticsearchError
      );
    });
  });

  describe('and calling `listArtifacts()`', () => {
    beforeEach(() => {
      esClientMock.search.mockResponse(generateArtifactEsSearchResultHitsMock());
    });

    it('should use defaults when options is not provided', async () => {
      const results = await listArtifacts(esClientMock);

      expect(esClientMock.search).toHaveBeenCalledWith({
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        ignore_unavailable: true,
        q: '',
        from: 0,
        size: 20,
        track_total_hits: true,
        rest_total_hits_as_int: true,
        sort: [{ created: { order: 'asc' } }],
      });

      expect(results).toEqual({
        items: [
          {
            ...generateArtifactMock(),
            id: expect.any(String),
            created: expect.any(String),
          },
        ],
        page: 1,
        perPage: 20,
        total: 1,
      });
    });

    it('should allow for options to be defined', async () => {
      const { items, ...listMeta } = await listArtifacts(esClientMock, {
        perPage: 50,
        page: 10,
        kuery: 'packageName:endpoint',
        sortField: 'identifier',
        sortOrder: 'desc',
      });

      expect(esClientMock.search).toHaveBeenCalledWith({
        index: FLEET_SERVER_ARTIFACTS_INDEX,
        q: 'packageName:endpoint',
        ignore_unavailable: true,
        from: 450,
        size: 50,
        track_total_hits: true,
        rest_total_hits_as_int: true,
        sort: [{ identifier: { order: 'desc' } }],
      });

      expect(listMeta).toEqual({
        perPage: 50,
        page: 10,
        total: 1,
      });
    });

    it('should throw an ArtifactElasticsearchError if one is encountered', async () => {
      setEsClientMethodResponseToError(esClientMock, 'search');

      await expect(listArtifacts(esClientMock)).rejects.toBeInstanceOf(ArtifactsElasticsearchError);
    });
  });

  describe('and calling `generateArtifactContentHash()`', () => {
    it('should return a sha256 string', () => {
      expect(generateArtifactContentHash('eJyrVkrNKynKTC1WsoqOrQUAJxkFKQ==')).toBe(
        'e40a028b3dab7e567135b80ed69934a52be5b4c2d901faa8e0997b256c222473'
      );
    });
  });

  describe('and calling `encodeArtifactContent()`', () => {
    it('should encode content', async () => {
      expect(await encodeArtifactContent('{"key": "value"}')).toEqual({
        body: 'eJyrVspOrVSyUlAqS8wpTVWqBQArrwVB',
        compressionAlgorithm: 'zlib',
        decodedSha256: '9724c1e20e6e3e4d7f57ed25f9d4efb006e508590d528c90da597f6a775c13e5',
        decodedSize: 16,
        encodedSha256: 'b411ccf0a7bf4e015d849ee82e3512683d72c5a3c9bd233db9c885b229b8adf4',
        encodedSize: 24,
      });
    });
  });

  describe('and calling `fetchAll()`', () => {
    beforeEach(() => {
      esClientMock.search
        .mockResolvedValueOnce(generateArtifactEsSearchResultHitsMock())
        .mockResolvedValueOnce(generateArtifactEsSearchResultHitsMock())
        .mockResolvedValueOnce(set(generateArtifactEsSearchResultHitsMock(), 'hits.hits', []));
    });

    it('should return an iterator', async () => {
      expect(fetchAllArtifacts(esClientMock)).toEqual({
        [Symbol.asyncIterator]: expect.any(Function),
      });
    });

    it('should provide artifacts on each iteration', async () => {
      for await (const artifacts of fetchAllArtifacts(esClientMock)) {
        expect(artifacts[0]).toEqual({
          body: expect.anything(),
          compressionAlgorithm: expect.anything(),
          created: expect.anything(),
          decodedSha256: expect.anything(),
          decodedSize: expect.anything(),
          encodedSha256: expect.anything(),
          encodedSize: expect.anything(),
          encryptionAlgorithm: expect.anything(),
          id: expect.anything(),
          identifier: expect.anything(),
          packageName: expect.anything(),
          relative_url: expect.anything(),
          type: expect.anything(),
        });
      }

      expect(esClientMock.search).toHaveBeenCalledTimes(3);
    });

    it('should use defaults if no `options` were provided', async () => {
      for await (const artifacts of fetchAllArtifacts(esClientMock)) {
        expect(artifacts.length).toBeGreaterThan(0);
      }

      expect(esClientMock.search).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: '',
          size: 1000,
          sort: [{ created: { order: 'asc' } }],
          _source_excludes: undefined,
        })
      );
    });

    it('should use custom options when provided', async () => {
      const options: FetchAllArtifactsOptions = {
        kuery: 'foo: something',
        sortOrder: 'desc',
        perPage: 500,
        sortField: 'someField',
        includeArtifactBody: false,
      };

      for await (const artifacts of fetchAllArtifacts(esClientMock, options)) {
        expect(artifacts.length).toBeGreaterThan(0);
      }

      expect(esClientMock.search).toHaveBeenCalledWith(
        expect.objectContaining({
          q: options.kuery,
          size: options.perPage,
          sort: [{ [options.sortField!]: { order: options.sortOrder } }],
          _source_excludes: 'body',
        })
      );
    });

    it('should set `done` to true if loop `break`s out', async () => {
      const iterator = fetchAllArtifacts(esClientMock);

      for await (const _ of iterator) {
        break;
      }

      await expect(iterator[Symbol.asyncIterator]().next()).resolves.toEqual({
        done: true,
        value: expect.any(Array),
      });

      expect(esClientMock.search).toHaveBeenCalledTimes(1);
    });

    it('should handle throwing in loop by setting `done` to `true`', async () => {
      const iterator = fetchAllArtifacts(esClientMock);

      try {
        for await (const _ of iterator) {
          throw new Error('test');
        }
      } catch (e) {
        expect(e); // just to silence eslint
      }

      await expect(iterator[Symbol.asyncIterator]().next()).resolves.toEqual({
        done: true,
        value: expect.any(Array),
      });

      expect(esClientMock.search).toHaveBeenCalledTimes(1);
    });
  });
});
