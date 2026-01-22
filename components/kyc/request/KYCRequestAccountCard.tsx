import React from 'react';
import { useQuery } from '@apollo/client';
import { User } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { gql } from '@/lib/graphql/helpers';
import type {
  AccountHoverCardFieldsFragment,
  KycRequestAccountCardQuery,
  KycRequestAccountCardQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';

import { AccountHoverCard, accountHoverCardFieldsFragment } from '@/components/AccountHoverCard';
import Avatar from '@/components/Avatar';

type KYCRequestAccountCardProps = {
  account: AccountReferenceInput;
};

export function KYCRequestAccountCard(props: KYCRequestAccountCardProps) {
  const { account: accountRef } = props;

  const { data } = useQuery<KycRequestAccountCardQuery, KycRequestAccountCardQueryVariables>(
    gql`
      query KYCRequestAccountCard($id: String, $slug: String) {
        account(id: $id, slug: $slug) {
          ...AccountHoverCardFields
        }
      }

      ${accountHoverCardFieldsFragment}
    `,
    {
      variables: {
        id: accountRef.id as string | undefined,
        slug: accountRef.slug as string | undefined,
      },
      skip: !accountRef.id && !accountRef.slug,
    },
  );

  const account = data?.account as AccountHoverCardFieldsFragment | null;

  if (!account) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
        <User className="h-3 w-3 text-slate-500" />
        <FormattedMessage defaultMessage="Account under verification" id="Pkorog" />
      </div>
      <div className="mt-3">
        <AccountHoverCard
          account={account}
          trigger={
            <div className="flex items-center gap-3">
              <Avatar collective={account} radius={24} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">{account.name}</div>
                {account.slug && <div className="truncate text-xs text-slate-500">@{account.slug}</div>}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
