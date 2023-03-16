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
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import Debug from 'debug';
import { stringify } from 'querystring';
import sjson from 'secure-json-parse';
import { DeserializationError, SerializationError } from '@/errors';
const debug = Debug('opensearch');

export interface SerializerOptions {
  disablePrototypePoisoningProtection?: boolean | 'proto' | 'constructor';
}
const kJsonOptions = Symbol('Secure json parse options');

export class Serializer {
  [kJsonOptions]: {
    protoAction: 'ignore' | 'error';
    constructorAction: 'ignore' | 'error';
  };
  constructor(opts: SerializerOptions = {}) {
    const disable = opts.disablePrototypePoisoningProtection ?? false;
    this[kJsonOptions] = {
      protoAction: disable === true || disable === 'proto' ? 'ignore' : 'error',
      constructorAction: disable === true || disable === 'constructor' ? 'ignore' : 'error',
    };
  }

  static serialize(object: Record<string, unknown>): string {
    debug('Serializing', object);
    let json: string;
    try {
      json = JSON.stringify(object);
    } catch (e: unknown) {
      const error = e as Error;
      throw new SerializationError(error.message, object);
    }
    return json;
  }

  static deserialize<T = unknown>(json: string): T {
    debug('Deserializing', json);
    let object;
    try {
      // @ts-expect-error
      object = sjson.parse(json, this[kJsonOptions]);
    } catch (e: unknown) {
      const error = e as Error;
      throw new DeserializationError(error.message as string, json);
    }
    return object;
  }

  static ndserialize(array: (string | Record<string, unknown>)[]): string {
    debug('ndserialize', array);
    if (!Array.isArray(array)) {
      throw new SerializationError('The argument provided is not an array', array);
    }
    let ndjson: string = '';
    for (let i = 0, len = array.length; i < len; i++) {
      if (typeof array[i] === 'string') {
        ndjson += array[i] + '\n';
      } else {
        // @ts-expect-error
        ndjson += this.serialize(array[i]) + '\n';
      }
    }
    return ndjson;
  }

  static qserialize(object?: Record<string, unknown>): string {
    debug('qserialize', object);
    if (object == null) return '';
    if (typeof object === 'string') return object;
    // arrays should be serialized as comma separated list
    const keys = Object.keys(object);
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      // OpenSearch will complain about keys without a value
      if (object[key] === undefined) {
        delete object[key];
      } else if (Array.isArray(object[key])) {
        object[key] = (object[key] as string[]).join(',');
      }
    }
    return stringify(object as Record<string, string>);
  }
}

export default Serializer;
