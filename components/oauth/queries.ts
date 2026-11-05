import { gql } from '../../lib/graphql/helpers';

export const authorizedAppsQuery = gql`
  query AuthorizedApps($limit: Int, $offset: Int) {
    loggedInAccount {
      id
      oAuthAuthorizations(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          createdAt
          lastUsedAt
          scope
          preAuthorize2FA
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
