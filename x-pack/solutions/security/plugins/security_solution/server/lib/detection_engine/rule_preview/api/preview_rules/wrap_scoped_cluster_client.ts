/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  TransportRequestOptions,
  TransportResult,
  TransportRequestOptionsWithMeta,
  TransportRequestOptionsWithOutMeta,
} from '@elastic/elasticsearch';
import type {
  SearchRequest,
  SearchResponse,
  AggregateName,
  AggregationsAggregate,
} from '@elastic/elasticsearch/lib/api/types';
import type { IScopedClusterClient, ElasticsearchClient } from '@kbn/core/server';

interface WrapScopedClusterClientOpts {
  scopedClusterClient: IScopedClusterClient;
  abortController: AbortController;
}

type WrapEsClientOpts = Omit<WrapScopedClusterClientOpts, 'scopedClusterClient'> & {
  esClient: ElasticsearchClient;
};

class WrappedScopedClusterClient implements IScopedClusterClient {
  #asInternalUser?: ElasticsearchClient;
  #asCurrentUser?: ElasticsearchClient;
  #asSecondaryAuthUser?: ElasticsearchClient;

  constructor(private readonly opts: WrapScopedClusterClientOpts) {}

  public get asInternalUser() {
    if (this.#asInternalUser === undefined) {
      const { scopedClusterClient, ...rest } = this.opts;
      this.#asInternalUser = wrapEsClient({
        ...rest,
        esClient: scopedClusterClient.asInternalUser,
      });
    }
    return this.#asInternalUser;
  }
  public get asCurrentUser() {
    if (this.#asCurrentUser === undefined) {
      const { scopedClusterClient, ...rest } = this.opts;
      this.#asCurrentUser = wrapEsClient({
        ...rest,
        esClient: scopedClusterClient.asCurrentUser,
      });
    }
    return this.#asCurrentUser;
  }
  public get asSecondaryAuthUser() {
    if (this.#asSecondaryAuthUser === undefined) {
      const { scopedClusterClient, ...rest } = this.opts;
      this.#asSecondaryAuthUser = wrapEsClient({
        ...rest,
        esClient: scopedClusterClient.asSecondaryAuthUser,
      });
    }
    return this.#asSecondaryAuthUser;
  }
}

export function wrapScopedClusterClient(opts: WrapScopedClusterClientOpts): IScopedClusterClient {
  return new WrappedScopedClusterClient(opts);
}

function wrapEsClient(opts: WrapEsClientOpts): ElasticsearchClient {
  const { esClient, ...rest } = opts;

  const wrappedClient = esClient.child({});

  // Mutating the functions we want to wrap
  wrappedClient.search = getWrappedSearchFn({ esClient: wrappedClient, ...rest });

  return wrappedClient;
}

function getWrappedSearchFn(opts: WrapEsClientOpts) {
  const originalSearch = opts.esClient.search;

  // A bunch of overloads to make TypeScript happy
  async function search<
    TDocument = unknown,
    TAggregations = Record<AggregateName, AggregationsAggregate>
  >(
    params?: SearchRequest,
    options?: TransportRequestOptionsWithOutMeta
  ): Promise<SearchResponse<TDocument, TAggregations>>;
  async function search<
    TDocument = unknown,
    TAggregations = Record<AggregateName, AggregationsAggregate>
  >(
    params?: SearchRequest,
    options?: TransportRequestOptionsWithMeta
  ): Promise<TransportResult<SearchResponse<TDocument, TAggregations>, unknown>>;
  async function search<
    TDocument = unknown,
    TAggregations = Record<AggregateName, AggregationsAggregate>
  >(
    params?: SearchRequest,
    options?: TransportRequestOptions
  ): Promise<SearchResponse<TDocument, TAggregations>>;
  async function search<
    TDocument = unknown,
    TAggregations = Record<AggregateName, AggregationsAggregate>
  >(
    params?: SearchRequest,
    options?: TransportRequestOptions
  ): Promise<
    | TransportResult<SearchResponse<TDocument, TAggregations>, unknown>
    | SearchResponse<TDocument, TAggregations>
  > {
    try {
      const searchOptions = options ?? {};
      return (await originalSearch.call(opts.esClient, params, {
        ...searchOptions,
        signal: opts.abortController.signal,
      })) as
        | TransportResult<SearchResponse<TDocument, TAggregations>, unknown>
        | SearchResponse<TDocument, TAggregations>;
    } catch (e) {
      if (opts.abortController.signal.aborted) {
        throw new Error('Search has been aborted due to cancelled execution');
      }
      throw e;
    }
  }

  return search;
}
