
import type * as http from 'node:http';
import { ConnectionOptions as TlsConnectionOptions } from 'node:tls';

import { BasicAuth } from './pool';


export interface ConnectionOptions {
  url: URL;
  ssl?: TlsConnectionOptions;
  id?: string;
  headers?: Record<string, any>;
  agent?: AgentOptions | agentFn;
  status?: string;
  roles?: ConnectionRoles;
  auth?: BasicAuth;
  proxy?: string | URL;
}

export type agentFn = (opts: ConnectionOptions) => any;

export interface ConnectionRoles {
  cluster_manager?: boolean
  /**
  * @deprecated use cluster_manager instead
  */
  master?: boolean
  data?: boolean
  ingest?: boolean
  [key: string]: boolean | undefined
}

export interface RequestOptions extends http.ClientRequestArgs {
  asStream?: boolean;
  body?: string | Buffer | ReadableStream | null;
  querystring?: string;
}

export interface AgentOptions {
  keepAlive?: boolean;
  keepAliveMsecs?: number;
  maxSockets?: number;
  maxFreeSockets?: number;
}