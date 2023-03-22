/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Readable as ReadableStream } from 'node:stream';
// import Connection from './Connection';
import * as errors from '@/errors'

// import { CloudConnectionPool, ConnectionPool } from './pool';
// import Serializer from './Serializer';

export type ApiError =
  | errors.ConfigurationError
  | errors.ConnectionError
  | errors.DeserializationError
  | errors.SerializationError
  | errors.NoLivingConnectionsError
  | errors.ResponseError
  | errors.TimeoutError
  | errors.RequestAbortedError
  | errors.NotCompatibleError;

export type Context = unknown;

export interface nodeSelectorFn {
  (connections: Connection[]): Connection;
}

export interface nodeFilterFn {
  (connection: Connection): boolean;
}

export interface generateRequestIdFn {
  (params: TransportRequestParams, options: TransportRequestOptions): any;
}

export interface MemoryCircuitBreakerOptions {
  enabled: boolean;
  maxPercentage: number;
}

export interface TransportOptions {
  emit: (event: string | symbol, ...args: any[]) => boolean;
  connectionPool: ConnectionPool | CloudConnectionPool;
  serializer: Serializer;
  maxRetries: number;
  requestTimeout: number | string;
  suggestCompression?: boolean;
  compression?: 'gzip';
  sniffInterval?: number;
  sniffOnConnectionFault?: boolean;
  sniffEndpoint: string;
  sniffOnStart?: boolean;
  nodeFilter?: nodeFilterFn;
  nodeSelector?: string | nodeSelectorFn;
  headers?: Record<string, any>;
  generateRequestId?: generateRequestIdFn;
  name?: string;
  opaqueIdPrefix?: string;
  memoryCircuitBreaker?: MemoryCircuitBreakerOptions;
}

export interface RequestEvent<TResponse = Record<string, any>, TContext = Context> {
  body: TResponse;
  statusCode: number | null;
  headers: Record<string, any> | null;
  warnings: string[] | null;
  meta: {
    context: TContext;
    name: string | symbol;
    request: {
      params: TransportRequestParams;
      options: TransportRequestOptions;
      id: any;
    };
    connection: Connection;
    attempts: number;
    aborted: boolean;
    sniff?: {
      hosts: any[];
      reason: string;
    };
  };
}

// ApiResponse and RequestEvent are the same thing
// we are doing this for have more clear names
export interface ApiResponse<TResponse = Record<string, any>, TContext = Context>
  extends RequestEvent<TResponse, TContext> {}

export type RequestBody<T = Record<string, any>> = T | string | Buffer | ReadableStream;
export type RequestNDBody<T = Record<string, any>[]> =
  | T
  | string
  | string[]
  | Buffer
  | ReadableStream;

export interface TransportRequestParams {
  method: string;
  path: string;
  body?: RequestBody;
  bulkBody?: RequestNDBody;
  querystring?: Record<string, any> | string;
}

export interface TransportRequestOptions {
  ignore?: number[];
  requestTimeout?: number | string;
  maxRetries?: number;
  asStream?: boolean;
  headers?: Record<string, any>;
  querystring?: Record<string, any>;
  compression?: 'gzip';
  id?: any;
  context?: Context;
  warnings?: string[];
  opaqueId?: string;
}

export interface TransportRequestCallback {
  abort: () => void;
}

export interface TransportRequestPromise<T> extends Promise<T> {
  abort: () => void;
  finally(onFinally?: (() => void) | undefined | null): Promise<T>;
}

export interface TransportGetConnectionOptions {
  requestId: string;
}

export interface TransportSniffOptions {
  reason: string;
  requestId?: string;
}
