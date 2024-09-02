import React from 'react';
import ProfileLayout from '../../../components/crowdfunding-redesign/ProfileLayout';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';
import { z } from 'zod';

export default function ContributionFlow() {
  const queryFilter = useQueryFilter({
    schema: z.object({
      account: z.string().optional(),
      tier: z.string().optional(),
    }),
    filters: {},
  });
  console.log({ queryFilter });

  return (
    <ProfileLayout collapsed getBreadcrumbs={() => [{ label: 'Contribute' }]}>
      <div className="mx-auto max-w-lg">
        <h1>Contribute</h1>
        <div>
          <h2>Account</h2>
        </div>
      </div>
    </ProfileLayout>
  );
}
