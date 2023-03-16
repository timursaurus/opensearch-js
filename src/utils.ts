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

const result = { body: null, statusCode: null, headers: null, warnings: null };
export const kConfigurationError = Symbol('Configuration error');

export function handleError(err: symbol, callback: Function) {
  if (callback) {
    process.nextTick(callback, err, result);
    return { then: NOOP, catch: NOOP, abort: NOOP };
  }
  return Promise.reject(err);
}

export function normalizeArguments(params, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof params === 'function' || params == null) {
    callback = params;
    params = {};
    options = {};
  }
  return [params, options, callback];
}

export function NOOP (): void {};

