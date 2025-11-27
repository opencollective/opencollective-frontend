import { gql } from '@apollo/client';

export const dashboardContributionsTierOptionsQuery = gql`
  query DashboardContributionsTierOptions($slug: String!) {
    account(slug: $slug) {
      id
      slug
      childrenAccounts {
        totalCount
        nodes {
          id
          slug
          name
          ... on AccountWithContributions {
            tiers {
              nodes {
                id
                name
              }
            }
          }
        }
      }
      ... on AccountWithContributions {
        canStartResumeContributionsProcess
        hasResumeContributionsProcessStarted
        tiers {
          nodes {
            id
            name
          }
        }
      }
    }
  }
`;
