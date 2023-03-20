/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 */

import crypto from 'node:crypto';
import aws4 from 'aws4';

// import {  } from '#transport'
import { OpenSearchClientError } from '@/errors';
import { ApiResponse, Context } from '@/types/transport';

async function getAwsSDKCredentialsProvider() {
  try {
    const awsV3 = await import('@aws-sdk/credential-provider-node');
    if (typeof awsV3.defaultProvider === 'function') {
      return awsV3.defaultProvider();
    }
  } catch (error) {
    // ignore
  }
  try {
    const awsV2 = await import('aws-sdk');
    if (awsV2.default && typeof awsV2.default.config.getCredentials === 'function') {
      return () =>
        new Promise((resolve, reject) => {
          awsV2.default.config.getCredentials((err, credentials) => {
            if (err) {
              reject(err);
            } else {
              resolve(credentials);
            }
          });
        });
    }
  } catch (error) {
    // ignore
  }
  throw new AwsSigv4SignerError(
    'Unable to find a valid AWS SDK, please provide a valid getCredentials function to AwsSigv4Signer options.'
  );
}

export class AwsSigv4SignerError<
  TResponse = Record<string, unknown>,
  TContext = Context
> extends OpenSearchClientError {
  message: string;
  data: ApiResponse;
  constructor(message: string, data: ApiResponse) {
    super(message);
    Error.captureStackTrace(this, AwsSigv4SignerError);
    this.name = 'AwsSigv4SignerError';
    this.message = message ?? 'AwsSigv4Signer Error';
    this.data = data
  }
}

// const getAwsSDKCredentialsProvider = async () => {
//   // First try V3
//   try {
//     const awsV3 = await import('@aws-sdk/credential-provider-node');
//     if (typeof awsV3.defaultProvider === 'function') {
//       return awsV3.defaultProvider();
//     }
//   } catch (err) {
//     // Ignore
//   }
//   try {
//     const awsV2 = await import('aws-sdk');
//     if (awsV2.default && typeof awsV2.default.config.getCredentials === 'function') {
//       return () =>
//         new Promise((resolve, reject) => {
//           awsV2.default.config.getCredentials((err, credentials) => {
//             if (err) {
//               reject(err);
//             } else {
//               resolve(credentials);
//             }
//           });
//         });
//     }
//   } catch (err) {
//     // Ignore
//   }

//   throw new AwsSigv4SignerError(
//     'Unable to find a valid AWS SDK, please provide a valid getCredentials function to AwsSigv4Signer options.'
//   );
// };
