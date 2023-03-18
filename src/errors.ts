/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 */

import { ApiResponse, Context } from '@/types/transport';

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

// export declare class OpenSearchClientError extends Error {
//   name: string;
//   message: string;
// }

// export declare class TimeoutError<
//   TResponse = Record<string, any>,
//   TContext = Context
// > extends OpenSearchClientError {
//   name: string;
//   message: string;
//   meta: ApiResponse<TResponse, TContext>;
//   constructor(message: string, meta: ApiResponse);
// }

// export declare class ConnectionError<
//   TResponse = Record<string, any>,
//   TContext = Context
// > extends OpenSearchClientError {
//   name: string;
//   message: string;
//   meta: ApiResponse<TResponse, TContext>;
//   constructor(message: string, meta: ApiResponse);
// }

// export declare class SerializationError extends OpenSearchClientError {
//   name: string;
//   message: string;
//   data: any;
//   constructor(message: string, data: any);
// }

// export declare class DeserializationError extends OpenSearchClientError {
//   name: string;
//   message: string;
//   data: string;
//   constructor(message: string, data: string);
// }

// export declare class ConfigurationError extends OpenSearchClientError {
//   name: string;
//   message: string;
//   constructor(message: string);
// }

// export declare class ResponseError<
//   TResponse = Record<string, any>,
//   TContext = Context
// > extends OpenSearchClientError {
//   name: string;
//   message: string;
//   meta: ApiResponse<TResponse, TContext>;
//   body: TResponse;
//   statusCode: number;
//   headers: Record<string, any>;
//   constructor(meta: ApiResponse);
// }

// export declare class RequestAbortedError<
//   TResponse = Record<string, any>,
//   TContext = Context
// > extends OpenSearchClientError {
//   name: string;
//   message: string;
//   meta: ApiResponse<TResponse, TContext>;
//   constructor(message: string, meta: ApiResponse);
// }

// export declare class NotCompatibleError<
//   TResponse = Record<string, any>,
//   TContext = Context
// > extends OpenSearchClientError {
//   name: string;
//   message: string;
//   meta: ApiResponse<TResponse, TContext>;
//   constructor(meta: ApiResponse);
// }

export class OpenSearchClientError extends Error {
  name: string;
  constructor(message: string) {
    super(message);
    this.name = 'OpenSearchClientError';
  }
}

export class TimeoutError<TResponse = Record<string, unknown>, TContext = Context> extends OpenSearchClientError {
  name: string;
  message: string;
  meta: ApiResponse<TResponse, TContext>;
  constructor(message: string, meta: ApiResponse<TResponse, TContext>) {
    super(message);
    Error.captureStackTrace(this, TimeoutError);
    this.name = 'TimeoutError';
    this.message = message ?? 'Timeout Error';
    this.meta = meta;
  }
}

export class ConnectionError<
  TResponse = Record<string, unknown>,
  TContext = Context
> extends OpenSearchClientError {
  name: string;
  message: string;
  meta: ApiResponse<TResponse, TContext>;
  constructor(message: string, meta: ApiResponse<TResponse, TContext>) {
    super(message);
    Error.captureStackTrace(this, ConnectionError);
    this.name = 'ConnectionError';
    this.message = message ?? 'Connection Error';
    this.meta = meta;
  }
}

export class NoLivingConnectionsError<
  TResponse = Record<string, unknown>,
  TContext = Context
> extends OpenSearchClientError {
  name: string;
  message: string;
  meta: ApiResponse<TResponse, TContext>;

  constructor(message: string, meta: ApiResponse<TResponse, TContext>) {
    super(message);
    Error.captureStackTrace(this, NoLivingConnectionsError);
    this.name = 'NoLivingConnectionsError';
    this.message =
      message ??
      'Given the configuration, the ConnectionPool was not able to find a usable Connection for this request.';
    this.meta = meta;
  }
}
export class SerializationError extends OpenSearchClientError {
  name: string;
  message: string;
  data: any;
  constructor(message: string, data: any) {
    super(message);
    Error.captureStackTrace(this, SerializationError);
    this.name = 'SerializationError';
    this.message = message ?? 'Serialization Error';
    this.data = data;
  }
}

export class DeserializationError extends OpenSearchClientError {
  name: string;
  message: string;
  data: any;
  constructor(message: string, data: any) {
    super(message);
    Error.captureStackTrace(this, DeserializationError);
    this.name = 'DeserializationError';
    this.message = message ?? 'Deserialization Error';
    this.data = data;
  }
}

export class ConfigurationError extends OpenSearchClientError {
  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, ConfigurationError);
    this.name = 'ConfigurationError';
    this.message = message ?? 'Configuration Error';
  }
}

export class ResponseError<
  TResponse = Record<string, unknown>,
  TContext = Context
> extends OpenSearchClientError {
  name: string;
  message: string;
  meta: ApiResponse<TResponse, TContext>;
  constructor(meta: ApiResponse) {
    super('Response Error');
    Error.captureStackTrace(this, ResponseError);
    this.name = 'ResponseError';
    if (meta.body?.error?.type) {
      if (Array.isArray(meta.body.error.root_cause)) {
        this.message =
          `${meta.body.error.type}: ${meta.body.error.root_cause
            .map((entry) => `[${entry.type}] Reason: ${entry.reason}`)
            .join('; ')}`;
        meta.body.error.root_cause;
      } else {
        this.message = meta.body.error.type;
      }
    } else {
      this.message = 'Response Error';
    }
    this.meta = meta;
  }

  get body() {
    return this.meta.body;
  }

  get statusCode() {
    if (this.meta.body && typeof this.meta.body.status === 'number') {
      return this.meta.body.status;
    }
    return this.meta.statusCode;
  }

  get headers() {
    return this.meta.headers;
  }

  toString() {
    return JSON.stringify(this.meta.body);
  }
}

// export declare class RequestAbortedError<
//   TResponse = Record<string, any>,
//   TContext = Context
// > extends OpenSearchClientError {
//   name: string;
//   message: string;
//   meta: ApiResponse<TResponse, TContext>;
//   constructor(message: string, meta: ApiResponse);
// }

// export declare class NotCompatibleError<
//   TResponse = Record<string, any>,
//   TContext = Context
// > extends OpenSearchClientError {
//   name: string;
//   message: string;
//   meta: ApiResponse<TResponse, TContext>;
//   constructor(meta: ApiResponse);
// }

export class RequestAbortedError<
  TResponse = Record<string, unknown>,
  TContext = Context
> extends OpenSearchClientError {
  name: string;
  message: string;
  meta: ApiResponse<TResponse, TContext>;
  constructor(message: string, meta: ApiResponse<TResponse, TContext>) {
    super(message);
    Error.captureStackTrace(this, RequestAbortedError);
    this.name = 'RequestAbortedError';
    this.message = message || 'Request aborted';
    this.meta = meta;
  }
}

export class NotCompatibleError<TResponse = Record<string, unknown>, TContext = Context> extends OpenSearchClientError {
  meta: ApiResponse<TResponse, TContext>;
  constructor(meta: ApiResponse<TResponse, TContext>) {
    super('Not Compatible Error');
    Error.captureStackTrace(this, NotCompatibleError);
    this.name = 'NotCompatibleError';
    this.message = 'The client noticed that the server is not a supported distribution';
    this.meta = meta;
  }
}
