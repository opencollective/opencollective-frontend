import { fetchMembers } from '../lib/graphql';
import { GraphQLClient } from 'graphql-request';
const graphqlServerUrl = `${process.env.API_URL}/graphql?api_key=${process.env.API_KEY}`;

export async function members(req, res) {
  console.log(">>> req.headers", req.headers);

  const {
    collectiveSlug,
    tierSlug
  } = req.params;

  const backerType = req.params.backerType !== 'all' && req.params.backerType === 'users' ? 'USER' : 'ORGANIZATION';

  const headers = {};
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }
  const client = new GraphQLClient(graphqlServerUrl, { headers });


  const query = `
  query Collective($collectiveSlug: String!, $backerType: String!, $tierSlug: String!) {
    Collective(slug:$collectiveSlug) {
      members(type: $backerType, tierSlug: $tierSlug) {
        createdAt
        role
        orders {
          createdAt
          transactions {
            createdAt
            amount
          }
          stats {
            totalTransactions
          }
        }
        member {
          type
          slug
          image
          website
          twitterHandle
          ... on User {
            email
          }
        }
        tier {
          name
        }
      }
    }
  }
  `; 
  const members = await client.request(query, { collectiveSlug, tierSlug, backerType });
  res.send(members);
}