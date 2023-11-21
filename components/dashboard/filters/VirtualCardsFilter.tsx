import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { CreditCard } from 'lucide-react';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

const virtualCardQuery = gql`
  query VirtualCardQuery($id: String!) {
    virtualCard(virtualCard: { id: $id }) {
      id
      name
      last4
    }
  }
`;

export const VirtualCardRenderer = ({ id }: { id: string }) => {
  const { data } = useQuery(virtualCardQuery, {
    variables: { id },
    fetchPolicy: 'cache-first',
    context: API_V2_CONTEXT,
  });
  const label = data?.virtualCard ? (
    <span className="flex items-center gap-1 truncate">
      <div className="inline-block max-w-[60px] truncate">{data.virtualCard.name}</div> (**** {data.virtualCard.last4})
    </span>
  ) : (
    <span>{id}</span>
  );
  return (
    <div className="flex items-center gap-1">
      <CreditCard size={16} /> <span>{label}</span>
    </div>
  );
};
