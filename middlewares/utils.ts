import type { NextRequest } from 'next/server';

export function getTokenFromRequest(req: NextRequest): string {
  return req.cookies.has('accessTokenPayload') && req.cookies.has('accessTokenSignature')
    ? [req.cookies.get('accessTokenPayload').value, req.cookies.get('accessTokenSignature').value].join('.')
    : null;
}

type GraphQLRequest = {
  query: string;
  operationName?: string;
  variables?: Record<string, unknown>;
};

type GraphQLResponse<Data = unknown> = {
  data?: Data;
  errors?: Record<string, unknown>[];
};

type GraphQLRequestOptions = {
  accessToken?: string;
};

export async function fetchGraphQLV1<Data = unknown>(
  request: GraphQLRequest,
  options?: GraphQLRequestOptions,
): Promise<Promise<GraphQLResponse<Data>>> {

  const response = await fetch(getGraphQLUrl('v1'), {
    method: 'POST',
    body: JSON.stringify(request),
    headers: {
      ...defaultGraphQLRequestHeaders(),
      'Content-Type': 'application/json',
      ...(options?.accessToken
        ? {
            Authorization: `Bearer ${options.accessToken}`,
          }
        : {}),
    },
  });

  return await response.json();
}

function defaultGraphQLRequestHeaders() {
  const headers = { 'oc-application': process.env.OC_APPLICATION };
  headers['oc-env'] = process.env.OC_ENV;
  headers['oc-secret'] = process.env.OC_SECRET;
  headers['oc-application'] = process.env.OC_APPLICATION;
  headers['user-agent'] = 'opencollective-frontend/1.0 edge-fetch/1.0';
  return headers;
}

function getGraphQLUrl(apiVersion: 'v1' | 'v2'): string {
  return `${process.env.API_URL}/graphql/${apiVersion}?api_key=${process.env.API_KEY}`;
}
