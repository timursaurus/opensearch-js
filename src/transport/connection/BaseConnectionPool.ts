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

import { URL } from 'node:url'
import type { SecureContextOptions } from 'node:tls';

import { NOOP } from "@/utils";
import { BaseConnectionPoolOptions, BasicAuth } from '@/types/pool';
import { AgentOptions } from '@/types/connection';

export class BaseConnectionPool {
  connections: Connection[];
  size: number;
  emit: (event: string | symbol, ...args: any[]) => boolean;
  _ssl: SecureContextOptions | null;
  _agent: AgentOptions | null;
  _proxy: string | URL;
  auth: BasicAuth;
//   Connection: typeof Connection;
  constructor(opts: BaseConnectionPoolOptions = {}) {
    this.connections = [];
    // how many nodes we have in our scheduler
    this.size = this.connections.length;
    this.Connection = opts.Connection;
    this.emit = opts.emit || NOOP;
    this.auth = opts.auth || null;
    this._ssl = opts.ssl;
    this._agent = opts.agent;
    this._proxy = opts.proxy;
  }
}

export default BaseConnectionPool