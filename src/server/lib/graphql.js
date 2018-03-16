import dotenv from 'dotenv';
dotenv.config();
import { GraphQLClient } from 'graphql-request';
import { uniqBy } from 'lodash';
const graphqlServerUrl = `${process.env.API_URL}/graphql?api_key=${process.env.API_KEY}`;
console.log(">>> connecting to ", graphqlServerUrl);
const client = new GraphQLClient(graphqlServerUrl, { headers: {} })

export async function fetchCollective(collectiveSlug) {
  const query = `
  query Collective($collectiveSlug: String!) {
    Collective(slug:$collectiveSlug) {
      id
      slug
      image
      currency
      data
      stats {
        balance
        backers {
          all
        }
        yearlyBudget
      }
    }
  }
  `;

  const result = await client.request(query, { collectiveSlug });
  return result.Collective;
}

export async function fetchCollectiveImage(collectiveSlug) {
  const query = `
  query Collective($collectiveSlug: String!) {
    Collective(slug:$collectiveSlug) {
      id
      image
    }
  }
  `;  

  const result = await client.request(query, { collectiveSlug });    
  return result.Collective;
}

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

export async function fetchMembers({ collectiveSlug, tierSlug, backerType }, options = {}) {
  let query, processResult, type, role;
  if (backerType === 'contributors') {
    query = `
    query Collective($collectiveSlug: String!) {
      Collective(slug:$collectiveSlug) {
        id
        data
      }
    }
    `;
    processResult = (res) => {
      const users = res.Collective.data.githubContributors;
      return Object.keys(users).map(username => {
        const commits = users[username]
        return {
          slug: username,
          type: 'USER',
          image: `https://avatars.githubusercontent.com/${username}?s=96`,
          website: `https://github.com/${username}`,
          stats: { c: commits }
        }
      });
    }
  } else if (backerType) {
    type = backerType.match(/sponsor/i) ? 'ORGANIZATION' : 'USER';
    if (backerType.match(/(backer|sponsor)/)) {
      role = 'BACKER';
    }
    query = `
    query allMembers($collectiveSlug: String!, $type: String!, $role: String!) {
      allMembers(collectiveSlug: $collectiveSlug, type: $type, role: $role, orderBy: "totalDonations") {
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
    `;
    processResult = (res) => uniqBy(res.allMembers.map(m => m.member), m => m.id);
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

  const result = await (options.client || client).request(query, { collectiveSlug, tierSlug, type, role });
  const members = processResult(result);
  return members;
}

export async function fetchEvents(parentCollectiveSlug, options = { limit: 10 }) {
  const query = `
  query allEvents($slug: String!, $limit: Int) {
    allEvents(slug:$slug, limit: $limit) {
      id
      name
      description
      slug
      image
      startsAt
      endsAt
      location {
        name
        address
        lat
        long
      }
    }
  }
  `;

  const result = await client.request(query, { slug: parentCollectiveSlug, limit: options.limit || 10 });
  return result.allEvents;
}

export async function fetchEvent(eventSlug) {
  const query = `
  query Collective($slug: String!) {
    Collective(slug:$slug) {
      id
      name
      description
      longDescription
      slug
      image
      startsAt
      endsAt
      location {
        name
        address
        lat
        long
      }
      currency
      tiers {
        id
        name
        description
        amount
      }
    }
  }
  `;

  const result = await client.request(query, { slug: eventSlug });
  return result.Collective;
}

export async function fetchInvoice(invoiceSlug, accessToken) {
  const query = `
  query Invoice($invoiceSlug: String!) {
    Invoice(invoiceSlug:$invoiceSlug) {
      slug
      totalAmount
      currency
      year
      month
      host {
        id
        slug
        name
        image
        website
        settings
        type
        location {
          name
          address
        }
      }
      fromCollective {
        id
        slug
        name
        currency
        location {
          name
          address
        }
      }
      transactions {
        id
        createdAt
        description
        amount
        currency
        collective {
          id
          slug
          name
        }
      }
    }
  }
  `;
  const client = new GraphQLClient(graphqlServerUrl, { headers: { authorization: `Bearer ${accessToken}`} })
  const result = await client.request(query, { invoiceSlug });
  return result.Invoice;
}
