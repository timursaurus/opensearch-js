/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 */

import type * as http from 'node:http'
import type { Credentials } from '@aws-sdk/types';

export interface AwsSigv4SignerOptions {
  getCredentials?: () => Promise<Credentials>;
  region: string;
  service?: 'es' | 'aoss';
}

export interface AwsSigv4SignerResponse {
  Connection: typeof Connection;
  Transport: typeof Transport;
  buildSignedRequestObject(request: any): http.ClientRequestArgs;
}
