import { get } from 'lodash';

import { GraphQLInt, GraphQLObjectType } from 'graphql';

import { Amount } from '../object/Amount';

import queries from '../../../lib/queries';

export const AccountStats = new GraphQLObjectType({
  name: 'AccountStats',
  description: 'Stats for the Account',
  fields: () => {
    return {
      // We always have to return an id for apollo's caching
      id: {
        type: GraphQLInt,
        resolve(collective) {
          return collective.id;
        },
      },
      balance: {
        description:
          'Amount of money in cents in the currency of the collective currently available to spend',
        type: Amount,
        resolve(collective, args, req) {
          return req.loaders.collective.balance.load(collective.id);
        },
      },
      monthlySpending: {
        description: 'Average amount spent per month based on the last 90 days',
        type: Amount,
        resolve(collective) {
          // if we fetched the collective with the raw query to sort them by their monthly spending we don't need to recompute it
          if (get(collective, 'dataValues.monthlySpending')) {
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
          return collective.getTotalAmountSpent();
        },
      },
      totalAmountReceived: {
        description: 'Net amount received',
        type: Amount,
        resolve(collective) {
          return collective.getTotalAmountReceived();
        },
      },
      totalAmountRaised: {
        description: 'Total amount raised through referral',
        type: Amount,
        resolve(collective) {
          return collective.getTotalAmountRaised();
        },
      },
      yearlyBudget: {
        type: Amount,
        resolve(collective) {
          // If the current collective is a host, we aggregate the yearly budget across all the hosted collectives
          if (collective.id === collective.HostCollectiveId) {
            return queries.getTotalAnnualBudgetForHost(collective.id);
          }
          return collective.getYearlyIncome();
        },
      },
    };
  },
});
