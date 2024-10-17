import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { DashboardSectionProps } from '../types';
import DashboardHeader from '../DashboardHeader';
import { GoalsForm } from '../../goals/GoalForm';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

const goalSettingsQuery = gql`
  query GoalSettings($slug: String!) {
    account(slug: $slug) {
      id
      slug
      type
      currency
      isActive
      isHost
      settings

      goal {
        type
        amount {
          valueInCents
          currency
        }
        progress
        contributors(limit: 5) {
          totalCount
          nodes {
            id
            name
            slug
            type
            imageUrl
          }
        }
      }

      # ... on AccountWithContributions {
      #   financialContributors: contributors(roles: [BACKER], limit: 5) {
      #     totalCount
      #     nodes {
      #       id
      #       name
      #       image
      #       account
      #     }
      #   }
      # }
    }
  }
`;

export default function Goals({ accountSlug }: DashboardSectionProps) {
  const { data, error, loading } = useQuery(goalSettingsQuery, {
    variables: { slug: accountSlug },
    context: API_V2_CONTEXT,
  });
  console.log({ data, error, loading });
  return (
    <div className="space-y-6">
      <DashboardHeader title="Goals" description="Set a goal to share with your community" />
      {data?.account && <GoalsForm account={data?.account} />}
    </div>
  );
}
