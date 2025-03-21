import { gql } from '@apollo/client';
import debugLib from 'debug';

import { API_V2_CONTEXT } from './graphql/helpers';
import type { Account } from './graphql/types/v2/schema';
import type { ApolloClientType, Context } from './apollo-client';

const debug = debugLib('whitelabel');
const env = process.env.OC_ENV || process.env.NODE_ENV || 'development';

type Provider = Partial<Pick<Account, 'id' | 'slug' | 'name' | 'imageUrl' | 'website' | 'whitelabel' | 'socialLinks'>>;

export type WhitelabelProps = {
  isNonPlatformDomain: boolean;
  origin: string;
  isWhitelabelDomain: boolean;
  provider: Provider;
  providers: Provider[];
  path?: string;
};

const getOriginAndPath = (ctx?: Context) => {
  let origin, path;
  if (typeof window !== 'undefined') {
    origin = window.location.origin;
    path = window.location.pathname;
  }
  if (ctx?.req?.headers) {
    const proto = ctx.req.headers['x-forwarded-proto'] || 'https';
    const hostname = ctx.req.headers['original-hostname'] || ctx.req.headers['host'];
    if (hostname) {
      origin = `${proto}://${hostname}`;
    }
  }
  if (ctx?.req?.url) {
    if (!ctx.req.url?.startsWith('/_next')) {
      path = ctx.req.url;
    }
  }

  return { origin, path };
};

let whitelabelProviderCache: Provider[];
// Inject some E2E test values
if (['e2e', 'ci'].includes(env)) {
  whitelabelProviderCache = [
    {
      slug: 'opencollective',
      whitelabel: {
        domain: 'http://local.opencollective:3000',
      },
    },
  ];
}

const getWhitelabelProviders = async (apolloClient: ApolloClientType): Promise<Provider[]> => {
  if (whitelabelProviderCache) {
    debug('Returning cached whitelabel providers');
    return whitelabelProviderCache;
  }

  debug('Fetching whitelabel providers...');
  const { data } = await apolloClient.query({
    query: gql/* GraphQLV2 */ `
      query WhitelabelProviders {
        whitelabelProviders {
          id
          slug
          name
          imageUrl
          website
          socialLinks {
            type
            url
          }
          whitelabel {
            domain
            logo
          }
        }
      }
    `,
    context: API_V2_CONTEXT,
  });

  debug('Loaded whitelabel providers', data.whitelabelProviders);
  whitelabelProviderCache = data.whitelabelProviders;
  return whitelabelProviderCache;
};

export const getWhitelabelDomains = async (apolloClient: ApolloClientType) => {
  const providers = await getWhitelabelProviders(apolloClient);
  return providers.map(provider => provider.whitelabel.domain);
};

export const isWhitelabelDomain = (providers, origin: string) => {
  if (!origin) {
    return false;
  } else {
    return providers.some(provider => provider.whitelabel.domain === origin);
  }
};

export const shouldRedirect = (hostSlug?: string, slug?: string) => {
  const provider = hostSlug && whitelabelProviderCache.find(provider => provider.slug === hostSlug);
  if (provider) {
    return { domain: provider.whitelabel.domain, slug: slug || provider.slug };
  }
};

/**
 * @param apolloClient {ApolloClientType} It is optional when calling this function from getServerSideProps but required when calling from the browser
 */
export const getWhitelabelProps = async (ctx?: Context, apolloClient?: ApolloClientType): Promise<WhitelabelProps> => {
  const { origin, path } = getOriginAndPath(ctx);
  if (!origin) {
    return null;
  }

  const whitelabelProviders = await getWhitelabelProviders((apolloClient || ctx.req?.apolloClient) as ApolloClientType);
  const isNonPlatformDomain = !process.env.WEBSITE_URL.includes(origin);
  const provider = whitelabelProviders?.find(provider => provider.whitelabel.domain === origin);
  return {
    isNonPlatformDomain,
    origin,
    isWhitelabelDomain: isWhitelabelDomain(whitelabelProviders, origin),
    path,
    provider,
    providers: whitelabelProviders,
  };
};
