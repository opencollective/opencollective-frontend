import { gql } from '@apollo/client';

// DEMO for opencollective/opencollective#9084, to be reverted: nested limits multiply
export const graphQLCostDemoQuery = gql`
  query GraphQLCostDemo($limit: Int = 100) {
    accounts(limit: $limit) {
      nodes {
        id
        transactions(limit: 1000) {
          nodes {
            id
            fromAccount {
              members(limit: 1000) {
                nodes {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
`;
