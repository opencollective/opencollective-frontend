import { gqlV2 } from '../../lib/graphql/helpers';

export const authorizedAppsQuery = gqlV2/* GraphQL */ `
  query AuthorizedApps {
    loggedInAccount {
      id
      oAuthAuthorizations {
        totalCount
        nodes {
          id
          createdAt
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
