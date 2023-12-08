import { gql } from '@apollo/client';

export const workspaceHomeQuery = gql`
  query WorkspaceHome($slug: String!, $limit: Int, $dateTo: DateTime, $classes: [ActivityClassType!]) {
    account(slug: $slug) {
      id
      feed(limit: $limit, dateTo: $dateTo, classes: $classes) {
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
          ... on Individual {
            isGuest
          }
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
          ... on Individual {
            isGuest
          }
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
