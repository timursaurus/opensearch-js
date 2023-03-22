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

import assert from 'node:assert';
import http from 'node:http';
import https from 'node:https';
import { pipeline } from 'node:stream';
import { inspect } from 'node:util';
import type { ConnectionOptions as TlsConnectionOptions } from 'node:tls';

import hpagent from 'hpagent';
import Debug from 'debug';

import { ConnectionError, RequestAbortedError, TimeoutError, ConfigurationError } from '@/errors';
import {
  ConnectionOptions,
  ConnectionRequestParams,
  ConnectionRoles,
  RequestOptions,
} from '@/types/connection';
import { NOOP } from '@/utils';
import { BasicAuth } from '@/types/pool';

const debug = Debug('opensearch');
const INVALID_PATH_REGEX = /[^\u0021-\u00ff]/;

export class Connection {
  url: URL;
  ssl: TlsConnectionOptions | null;
  id: string;
  headers: Record<string, any>;
  roles: ConnectionRoles;
  deadCount: number;
  resurrectTimeout: number;
  makeRequest: typeof http.request | typeof https.request;
  _openRequests: number;
  _status: string;
  _agent?: http.Agent | https.Agent | hpagent.HttpProxyAgent | hpagent.HttpsProxyAgent;

  static statuses: Record<string, string> = {
    ALIVE: 'alive',
    DEAD: 'dead',
  };

  static roles: Record<string, string> = {
    CLUSTER_MANAGER: 'cluster_manager',
    /**
     * @deprecated use CLUSTER_MANAGER instead
     */
    MASTER: 'master',
    DATA: 'data',
    INGEST: 'ingest',
  };
  constructor(opts: ConnectionOptions) {
    this.url = opts.url;
    this.ssl = opts.ssl || null;
    this.id = opts.id || stripAuth(opts.url.href);
    this.headers = prepareHeaders(opts.headers, opts.auth);
    this.deadCount = 0;
    this.resurrectTimeout = 0;

    this._openRequests = 0;
    this._status = opts.status || Connection.statuses.ALIVE;
    this.roles = Object.assign({}, defaultRoles, opts.roles);

    if (!['http:', 'https:'].includes(this.url.protocol)) {
      throw new ConfigurationError(`Invalid protocol: '${this.url.protocol}'`);
    }

    if (typeof opts.agent === 'function') {
      this._agent = opts.agent(opts);
    } else if (typeof opts.agent === 'boolean') {
      this._agent = undefined;
    } else {
      const agentOptions = Object.assign(
        {},
        {
          keepAlive: true,
          keepAliveMsecs: 1000,
          maxSockets: 256,
          maxFreeSockets: 256,
          scheduling: 'lifo',
        },
        opts.agent
      );
      if (opts.proxy) {
        agentOptions.proxy = opts.proxy;
        this._agent =
          this.url.protocol === 'http:'
            ? new hpagent.HttpProxyAgent(agentOptions)
            : new hpagent.HttpsProxyAgent(Object.assign({}, agentOptions, this.ssl));
      } else {
        this._agent =
          this.url.protocol === 'http:'
            ? new http.Agent(agentOptions)
            : new https.Agent(Object.assign({}, agentOptions, this.ssl));
      }
    }

    this.makeRequest = this.url.protocol === 'http:' ? http.request : https.request;
  }

  request(
    params: RequestOptions,
    callback: (err: Error | null, response: http.IncomingMessage | null) => void
  ) {
    this._openRequests++;
    let cleanedListeners = false;

    const requestParams = this.buildRequestObject(params);
    // https://github.com/nodejs/node/commit/b961d9fd83
    if (INVALID_PATH_REGEX.test(requestParams.path) === true) {
      callback(new TypeError(`ERR_UNESCAPED_CHARACTERS: ${requestParams.path}`), null);
      /* istanbul ignore next */
      return { abort: NOOP };
    }

    debug('Starting a new request', params);
    const request = this.makeRequest(requestParams);

    function onResponse(response: http.IncomingMessage) {
      cleanListeners();
      this._openRequests--;
      callback(null, response);
    }

    function onTimeout() {
      cleanListeners();
      this._openRequests--;
      request.once('error', () => {}); // we need to catch the request aborted error
      request.abort();
      callback(new TimeoutError('Request timed out', params), null);
    }

    function onError(err: Error) {
      cleanListeners();
      this._openRequests--;
      callback(new ConnectionError(err.message), null);
    }

    function onAbort() {
      cleanListeners();
      request.once('error', () => {}); // we need to catch the request aborted error
      debug('Request aborted', params);
      this._openRequests--;
      callback(new RequestAbortedError('Request aborted'), null);
    }

    request.on('response', onResponse);
    request.on('timeout', onTimeout);
    request.on('error', onError);
    request.on('abort', onAbort);

    // Disables the Nagle algorithm
    request.setNoDelay(true);

    // starts the request
    if (isStream(params.body) === true) {
      pipeline(params.body, request, (err) => {
        /* istanbul ignore if  */
        if (err != null && cleanedListeners === false) {
          cleanListeners();
          this._openRequests--;
          callback(err, null);
        }
      });
    } else {
      request.end(params.body);
    }

    return request;

    function cleanListeners() {
      request.removeListener('response', onResponse);
      request.removeListener('timeout', onTimeout);
      request.removeListener('error', onError);
      request.removeListener('abort', onAbort);
      cleanedListeners = true;
    }
  }

  // TODO: write a better closing logic
  close(callback = NOOP) {
    debug('Closing connection', this.id);
    if (this._openRequests > 0) {
      setTimeout(() => this.close(callback), 1000);
    } else {
      if (this._agent !== undefined) {
        this._agent?.destroy();
      }
      callback();
    }
  }

  setRole(role: string, enabled: boolean): this {
    if (validRoles.indexOf(role) === -1) {
      throw new ConfigurationError(`Unsupported role: '${role}'`);
    }
    if (typeof enabled !== 'boolean') {
      throw new ConfigurationError('enabled should be a boolean');
    }

    this.roles[role] = enabled;
    return this;
  }

  get status() {
    return this._status;
  }

  set status(status) {
    assert(~validStatuses.indexOf(status), `Unsupported status: '${status}'`);
    this._status = status;
  }

  buildRequestObject(params: ConnectionRequestParams) {
    const url = this.url;
    const request = {
      protocol: url.protocol,
      hostname: url.hostname[0] === '[' ? url.hostname.slice(1, -1) : url.hostname,
      hash: url.hash,
      search: url.search,
      pathname: url.pathname,
      path: '',
      href: url.href,
      origin: url.origin,
      // https://github.com/elastic/elasticsearch-js/issues/843
      port: url.port !== '' ? url.port : undefined,
      headers: Object.assign({}, this.headers),
      agent: this._agent,
    };

    const paramsKeys = Object.keys(params);
    for (let i = 0, len = paramsKeys.length; i < len; i++) {
      const key = paramsKeys[i];
      if (key === 'path') {
        request.pathname = resolve(request.pathname, params[key]);
      } else if (key === 'querystring' && !!params[key] === true) {
        if (request.search === '') {
          request.search = `?${params[key]}`;
        } else {
          request.search += `&${params[key]}`;
        }
      } else if (key === 'headers') {
        request.headers = Object.assign({}, request.headers, params.headers);
      } else {
        // @ts-expect-error
        request[key] = params[key];
      }
    }

    request.path = request.pathname + request.search;

    return request;
  }

  // Handles console.log and utils.inspect invocations.
  // We want to hide `auth`, `agent` and `ssl` since they made
  // the logs very hard to read. The user can still
  // access them with `instance.agent` and `instance.ssl`.
  [inspect.custom]() {
    // eslint-disable-next-line no-unused-vars
    const { authorization, ...headers } = this.headers;

    return {
      url: stripAuth(this.url.toString()),
      id: this.id,
      headers,
      deadCount: this.deadCount,
      resurrectTimeout: this.resurrectTimeout,
      _openRequests: this._openRequests,
      status: this.status,
      roles: this.roles,
    };
  }

  toJSON() {
    const { authorization, ...headers } = this.headers;

    return {
      url: stripAuth(this.url.toString()),
      id: this.id,
      headers,
      deadCount: this.deadCount,
      resurrectTimeout: this.resurrectTimeout,
      _openRequests: this._openRequests,
      status: this.status,
      roles: this.roles,
    };
  }
}

const defaultRoles = {
  [Connection.roles.DATA]: true,
  [Connection.roles.INGEST]: true,
};

const validStatuses = Object.keys(Connection.statuses).map((k) => Connection.statuses[k]);
const validRoles = Object.keys(Connection.roles).map((k) => Connection.roles[k]);

export function stripAuth(url: string) {
  if (url.indexOf('@') === -1) return url;
  return url.slice(0, url.indexOf('//') + 2) + url.slice(url.indexOf('@') + 1);
}

export  function isStream(obj: any): obj is ReadableStream {
  return obj != null && typeof obj.pipe === 'function';
}

export function resolve(host: string, path: string) {
  const hostEndWithSlash = host[host.length - 1] === '/';
  const pathStartsWithSlash = path[0] === '/';

  if (hostEndWithSlash === true && pathStartsWithSlash === true) {
    return host + path.slice(1);
  } else if (hostEndWithSlash !== pathStartsWithSlash) {
    return host + path;
  } else {
    return `${host}/${path}`;
  }
}

export function prepareHeaders(headers: Record<string, string> = {}, auth?: BasicAuth) {
  if (auth != null && headers.authorization == null) {
    /* istanbul ignore else */
    if (auth.username && auth.password) {
      headers.authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString(
        'base64'
      )}`;
    }
  }
  return headers;
}

export default Connection;
