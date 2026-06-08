import React from 'react';
import { useQuery } from '@apollo/client';
import { Shield } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { gql } from '@/lib/graphql/helpers';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/graphql';

import { AccountHoverCard, accountHoverCardFields } from '@/components/AccountHoverCard';
import Avatar from '@/components/Avatar';
import type { BaseModalProps } from '@/components/ModalContext';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

import { KYCVerificationStatusBadge } from '../KYCVerificationStatusBadge';

const accountAdminKycQuery = gql`
  query AccountAdminKYCModal($accountId: String, $accountSlug: String, $hostSlug: String!) {
    account(id: $accountId, slug: $accountSlug) {
      ...AccountHoverCardFields
      members(role: [ADMIN], limit: 100) {
        nodes {
          id
          account {
            ...AccountHoverCardFields
            ... on Individual {
              kycVerifications(requestedByAccounts: [{ slug: $hostSlug }], limit: 1) {
                nodes {
                  id
                  status
                }
              }
            }
          }
        }
      }
    }
  }

  ${accountHoverCardFields}
`;

type AccountAdminKYCModalProps = {
  account: AccountReferenceInput;
  host: AccountReferenceInput & { slug: string };
} & BaseModalProps;

export function AccountAdminKYCModal({ account: accountRef, host, open, setOpen }: AccountAdminKYCModalProps) {
  const { data } = useQuery(accountAdminKycQuery, {
    variables: {
      accountId: accountRef.id as string | undefined,
      accountSlug: accountRef.slug as string | undefined,
      hostSlug: host.slug,
    },
    skip: !open || (!accountRef.id && !accountRef.slug),
  });

  const account = data?.account;
  const adminMembers = account?.members?.nodes ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <FormattedMessage defaultMessage="Account KYC Status" id="0wfBmP" />
          </DialogTitle>
        </DialogHeader>

        {account && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
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
        )}

        {adminMembers.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-600 uppercase">
              <FormattedMessage defaultMessage="Administrators" id="administrators" />
            </h4>
            <ul className="flex flex-col gap-3">
              {adminMembers.map(member => {
                const adminAccount = member.account;
                const kycStatus = adminAccount?.kycVerifications?.nodes?.[0]?.status;
                return (
                  <li key={member.id} className="flex items-center justify-between gap-3">
                    <AccountHoverCard
                      account={adminAccount}
                      trigger={
                        <div className="flex items-center gap-2 truncate">
                          <Avatar collective={adminAccount} radius={20} />
                          <span className="max-w-[200px] truncate text-sm font-medium">{adminAccount?.name}</span>
                        </div>
                      }
                    />
                    {kycStatus ? (
                      <KYCVerificationStatusBadge status={kycStatus} />
                    ) : (
                      <span className="text-xs text-slate-400">
                        <FormattedMessage defaultMessage="Not requested" id="HGIy99" />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <FormattedMessage defaultMessage="Close" id="Close" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
