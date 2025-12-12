import { loggedInUserQuery } from '../../../lib/graphql/v1/queries';

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  try {
    // Get the access token from cookies or headers
    const token =
      req.cookies['access_token'] ||
      req.headers.cookie?.match(/access_token=([^;]+)/)?.[1] ||
      req.headers.authorization?.replace('Bearer ', '');

    const diagnostic = {
      timestamp: new Date().toISOString(),
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      cookies: Object.keys(req.cookies),
    };

    // Query the API for logged in user
    if (token) {
      try {
        const graphqlUrl = `${process.env.API_URL}/graphql/v1?api_key=${process.env.API_KEY}`;
        const query = loggedInUserQuery.loc.source.body;

        const result = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: query,
          }),
        });

        const json = await result.json();

        if (json.data?.LoggedInUser) {
          const user = json.data.LoggedInUser;
          diagnostic.LoggedInUser = {
            id: user.id,
            email: user.email,
            hasCollective: !!user.collective,
            collectiveSlug: user.collective?.slug,
            collectiveId: user.collective?.id,
            collectiveName: user.collective?.name,
            requiresProfileCompletion: user.requiresProfileCompletion,
            memberOf: user.memberOf?.map(m => ({
              slug: m.collective?.slug,
              role: m.role,
            })),
          };

          // Try to query the account if we have a slug
          if (user.collective?.slug) {
            try {
              const accountQuery = `
                query Dashboard($slug: String!) {
                  account(slug: $slug) {
                    id
                    slug
                    name
                    type
                    isArchived
                    isActive
                  }
                }
              `;

              const accountResult = await fetch(`${process.env.API_URL}/graphql/v2?api_key=${process.env.API_KEY}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  query: accountQuery,
                  variables: { slug: user.collective.slug },
                }),
              });

              const accountJson = await accountResult.json();
              diagnostic.accountQuery = {
                success: !!accountJson.data?.account,
                account: accountJson.data?.account || null,
                errors: accountJson.errors || null,
              };
            } catch (error) {
              diagnostic.accountQueryError = error.message;
            }
          }
        } else {
          diagnostic.LoggedInUser = null;
          diagnostic.apiError = json.errors || json;
        }
      } catch (error) {
        diagnostic.queryError = error.message;
      }
    }

    res.status(200).json(diagnostic);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
