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

import { kConfigurationError } from "@/utils";

const kCat = Symbol('Cat');
const kCluster = Symbol('Cluster');
const kDanglingIndices = Symbol('DanglingIndices');
const kFeatures = Symbol('Features');
const kIndices = Symbol('Indices');
const kIngest = Symbol('Ingest');
const kNodes = Symbol('Nodes');
const kShutdown = Symbol('Shutdown');
const kSnapshot = Symbol('Snapshot');
const kTasks = Symbol('Tasks');

export class OpenSearchAPI {
  [kCat]: symbol | null
  [kCluster]: symbol | null
  [kDanglingIndices]: symbol | null
  [kFeatures]: symbol | null
  [kIndices]: symbol | null
  [kIngest]: symbol | null
  [kNodes]: symbol | null
  [kShutdown]: symbol | null
  [kSnapshot]: symbol | null
  [kTasks]: symbol | null
  // TODO: FIX. No configuration error on ClientOptions
  [kConfigurationError]: symbol | null

  constructor(opts: ClientOptions) {
    this[kCat] = null;
    this[kCluster] = null;
    this[kDanglingIndices] = null;
    this[kFeatures] = null;
    this[kIndices] = null;
    this[kIngest] = null;
    this[kNodes] = null;
    this[kShutdown] = null;
    this[kSnapshot] = null;
    this[kTasks] = null;
    // TODO: FIX. No configuration error on ClientOptions. It's in root index.ts
    this[kConfigurationError] = null;
  }
  // get<TResponse = Record<string, any>, TContext = Context>(
  //   params?: RequestParams.SnapshotGet,
  //   options?: TransportRequestOptions
  // ): TransportRequestPromise<ApiResponse<TResponse, TContext>>;

  // get<TResponse = Record<string, any>, TContext = Context>(
  //   callback: callbackFn<TResponse, TContext>
  // ): TransportRequestCallback;

  // get<TResponse = Record<string, any>, TContext = Context>(
  //   params: RequestParams.SnapshotGet,
  //   callback: callbackFn<TResponse, TContext>
  // ): TransportRequestCallback;

  // get<TResponse = Record<string, any>, TContext = Context>(
  //   params: RequestParams.SnapshotGet,
  //   options: TransportRequestOptions,
  //   callback: callbackFn<TResponse, TContext>
  // ): TransportRequestCallback;

  // cat<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.SnapshotGet, callback: callbackFn<TResponse, TContext>)
  // cat<TResponse = Record<string, any>, TContext = Context>(params: RequestParams.SnapshotGet, options: TransportRequestOptions): TransportRequestPromise<ApiResponse<TResponse, TContext>> {

  // }
}

export default OpenSearchAPI;