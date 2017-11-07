import { GraphQLClient } from 'graphql-request';
import { uniqBy } from 'lodash';
const graphqlServerUrl = `${process.env.API_URL}/graphql?api_key=${process.env.API_KEY}`;
console.log(">>> connecting to ", graphqlServerUrl);
const client = new GraphQLClient(graphqlServerUrl, { headers: {} })

export async function fetchMembersStats(params) {
  const { backerType, tierSlug } = params;
  let query, processResult;

  if (backerType) {
    query = `
    query Collective($collectiveSlug: String!) {
      Collective(slug:$collectiveSlug) {
        stats {
          backers {
            all
            users
            organizations
          }
        }
      }
    }
    `;
    processResult = (res) => {
      const count = (backerType.match(/sponsor/)) ? res.Collective.stats.backers.organizations : res.Collective.stats.backers.users;
      return {
        name: backerType,
        count
      }
    }
  } else if (tierSlug) {
    query = `
    query Collective($collectiveSlug: String!, $tierSlug: String) {
      Collective(slug:$collectiveSlug) {
        tiers(slug: $tierSlug) {
          slug
          name
          stats {
            totalDistinctOrders
          }
        }
      }
    }
    `;
    processResult = (res) => {
      return {
        count: res.Collective.tiers[0].stats.totalDistinctOrders,
        slug: res.Collective.tiers[0].slug,
        name: res.Collective.tiers[0].name
      }
    }
  }
  try {
    const result = await client.request(query, params);
    const count = processResult(result);
    return count;
  } catch (e) {
    console.error(e);
  }
}

export async function fetchMembers({ collectiveSlug, tierSlug, backerType }, options) {
  let query, processResult, type;
  if (backerType) {
    type = backerType.match(/sponsor/i) ? 'ORGANIZATION' : 'USER';
    query = `
    query Collective($collectiveSlug: String!, $type: String!) {
      Collective(slug:$collectiveSlug) {
        members(type: $type) {
          id
          createdAt
          member {
            id
            type
            slug
            image
            website
            twitterHandle
          }
        }
      }
    }
    `;
    processResult = (res) => res.Collective.members.map(m => m.member);
  } else if (tierSlug) {
    query = `
    query Collective($collectiveSlug: String!, $tierSlug: String!) {
      Collective(slug:$collectiveSlug) {
        tiers(slug: $tierSlug) {
          orders {
            id
            createdAt
            fromCollective {
              id
              type
              slug
              image
              website
              twitterHandle
            }
          }
        }
      }
    }
    `;
    processResult = (res) => uniqBy(res.Collective.tiers[0].orders.map(o => o.fromCollective), m => m.id);
  }
  let result;
  try {
    result = await (options.client || client).request(query, { collectiveSlug, tierSlug, type });
    const members = processResult(result);
    return members;
  } catch (e) {
    console.error(e);
  }
}