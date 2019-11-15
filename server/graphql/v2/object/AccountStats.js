import { get, has } from 'lodash';

import { GraphQLInt, GraphQLObjectType } from 'graphql';

import { Amount } from '../object/Amount';

import { idEncode } from '../identifiers';

import queries from '../../../lib/queries';

export const AccountStats = new GraphQLObjectType({
  name: 'AccountStats',
  description: 'Stats for the Account',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(collective) {
          return idEncode(collective.id);
        },
      },
      balance: {
        description: 'Amount of money in cents in the currency of the collective currently available to spend',
        type: Amount,
        resolve(collective, args, req) {
          return {
            value: req.loaders.Collective.balance.load(collective.id),
            currency: 'USD',
          };
        },
      },
      monthlySpending: {
        description: 'Average amount spent per month based on the last 90 days',
        type: Amount,
        resolve(collective) {
          // if we fetched the collective with the raw query to sort them by their monthly spending we don't need to recompute it
          if (has(collective, 'dataValues.monthlySpending')) {
            return get(collective, 'dataValues.monthlySpending');
          } else {
            return collective.getMonthlySpending();
          }
        },
      },
      totalAmountSpent: {
        description: 'Total amount spent',
        type: Amount,
        resolve(collective) {
          return {
            value: collective.getTotalAmountSpent(),
            currency: 'USD',
          };
        },
      },
      totalAmountReceived: {
        description: 'Net amount received',
        type: Amount,
        resolve(collective) {
          return {
            value: collective.getTotalAmountReceived(),
            currency: 'USD',
          };
        },
      },
      totalAmountRaised: {
        description: 'Total amount raised through referral',
        deprecationReason: '2019-08-22: Referals are not supported anymore',
        type: Amount,
        resolve() {
          return {
            value: 0,
            currency: 'USD',
          };
        },
      },
      yearlyBudget: {
        type: Amount,
        resolve(collective) {
          // If the current collective is a host, we aggregate the yearly budget across all the hosted collectives
          if (collective.id === collective.HostCollectiveId) {
            return queries.getTotalAnnualBudgetForHost(collective.id);
          }
          return {
            value: collective.getYearlyIncome(),
            currency: 'USD',
          };
        },
      },
    };
  },
});
