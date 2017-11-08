import { fetchMembers } from '../lib/graphql';
import { GraphQLClient } from 'graphql-request';
const graphqlServerUrl = `${process.env.API_URL}/graphql?api_key=${process.env.API_KEY}`;
import { json2csv } from '../../lib/export_file';
import moment from 'moment';
import { get } from 'lodash';
import { days } from '../../lib/utils';

export async function list(req, res, next) {

  const {
    collectiveSlug,
    tierSlug
  } = req.params;

  const backerType = req.params.backerType !== 'all' && (req.params.backerType === 'users' ? 'USER' : 'ORGANIZATION');

  const headers = {};
  if (req.headers.authorization) {
    res.setHeader('cache-control','no-cache'); // don't cache at CDN level as the result contains private information
    headers.authorization = req.headers.authorization;
  } else {
    if (req.params.format === 'csv') {
      return next(new Error("Need to be logged in to export members in CSV"));
    }
    res.setHeader('cache-control','max-age=6000');
  }
  const client = new GraphQLClient(graphqlServerUrl, { headers });


  const query = `
  query Collective($collectiveSlug: String!, $backerType: String, $tierSlug: String, $TierId: Int, $limit: Int, $offset: Int) {
    Collective(slug:$collectiveSlug) {
      currency
      members(type: $backerType, tierSlug: $tierSlug, TierId: $TierId, limit: $limit, offset: $offset) {
        id
        createdAt
        role
        stats {
          totalDonations
        }
        transactions(limit: 1) {
          createdAt
          amount
          currency
        }
        member {
          type
          slug
          type
          name
          description
          image
          website
          twitterHandle
          ... on User {
            email
          }
        }
        tier {
          interval
          name
        }
      }
    }
  }
  `; 
  const vars = { collectiveSlug };
  if (tierSlug) vars.tierSlug = tierSlug;
  if (backerType) vars.backerType = backerType;
  if (req.query.TierId) vars.TierId = req.query.TierId;
  if (req.query.limit) vars.limit = req.query.limit;
  if (req.query.offset) vars.offset = req.query.offset;
  
  console.log(">>> vars", vars);

  // Only return max 50 at a time
  if (req.params.format === 'json') {
    vars.limit = Math.min(req.query.limit, 50);
  }

  const result = await client.request(query, vars);
  const members = result.Collective.members;

  const isActive = (r) => {
    if (!r.tier || !r.tier.interval) return true;
    if (!r.transactions[0] || !r.transactions[0].createdAt) return false;
    if (r.tier.interval === 'month' && days(new Date(r.transactions[0].createdAt)) <= 31) return true;
    if (r.tier.interval === 'year' && days(new Date(r.transactions[0].createdAt)) <= 365) return true;
    return false;
  }

  const mapping = {
    'MemberId': 'id',
    'createdAt': r => moment(r.createdAt).format("YYYY-MM-DD HH:mm"),
    'type': 'member.type',
    'role': 'role',
    'tier': 'tier.name',
    'isActive': isActive,
    'totalAmountDonated': (r) => (get(r, 'stats.totalDonations') || 0) / 100,
    'currency': 'transactions[0].currency',
    'lastTransactionAt': r => moment(r.transactions[0] && r.transactions[0].createdAt).format("YYYY-MM-DD HH:mm"),
    'lastTransactionAmount': (r) => (get(r, 'transactions[0].amount') || 0) / 100,
    'profile': (r) => `${process.env.WEBSITE_URL}/${r.member.slug}`,
    'name': 'member.name',
    'description': 'member.description',
    'image': 'member.image',
    'email': 'member.email',
    'twitterHandle': 'member.twitterHandle',
    'website': 'member.website'
  }

  const fields = Object.keys(mapping);

  const applyMapping = (row) => {
    const res = {};
    fields.map(key => {
      const val = mapping[key];
      if (typeof val === 'function') {
        return res[key] = val(row);
      } else {
        return res[key] = get(row, val);
      }
    });
    return res;
  }
  
  const data = members.map(applyMapping);

  switch (req.params.format) {
    case 'csv':
      const csv = json2csv(data);
      res.setHeader('content-type', 'text/csv');
      res.send(csv);
      break;
    
    default:
      res.send(data);
      break;
  }
}