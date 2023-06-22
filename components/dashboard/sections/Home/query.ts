import { gql } from '@apollo/client';

export const workspaceHomeQuery = gql`
  query WorkspaceHome($slug: String!, $limit: Int, $offset: Int) {
    activities(account: { slug: $slug }, limit: $limit, offset: $offset, timeline: true) {
      limit
      offset
      nodes {
        id
        createdAt
        type
        data
        isSystem
        fromAccount {
          id
          name
          slug
          type
          isIncognito
          imageUrl(height: 48)
        }
        host {
          id
          name
          slug
          type
        }
        account {
          id
          name
          slug
          type
          isIncognito
          imageUrl(height: 48)
          ... on AccountWithParent {
            parent {
              id
              slug
              name
              type
            }
          }
        }
        expense {
          id
          legacyId
          description
          account {
            id
            name
            type
            slug
            ... on AccountWithParent {
              parent {
                id
                slug
              }
            }
          }
        }
        order {
          id
          legacyId
          description
          toAccount {
            id
            name
            slug
            ... on AccountWithParent {
              parent {
                id
                slug
              }
            }
          }
        }
        update {
          id
          legacyId
          title
          summary
          slug
        }
        individual {
          id
          slug
          name
          type
          imageUrl(height: 48)
          isIncognito
        }
      }
    }
  }
`;
