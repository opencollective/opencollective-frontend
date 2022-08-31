import { gqlV2 } from '../../lib/graphql/helpers';

export const authorizedAppsQuery = gqlV2/* GraphQL */ `
  query AuthorizedApps($limit: Int, $offset: Int) {
    loggedInAccount {
      id
      oAuthAuthorizations(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          createdAt
          lastUsedAt
          account {
            id
            name
            slug
            type
            imageUrl(height: 48)
          }
          application {
            id
            name
            account {
              id
              name
              slug
              type
              imageUrl(height: 128)
            }
          }
        }
      }
    }
  }
`;
