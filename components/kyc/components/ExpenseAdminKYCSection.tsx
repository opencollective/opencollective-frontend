import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { AccountReferenceInput, AccountType, ExpensePayeeKyc } from '@/lib/graphql/types/v2/graphql';
import { ExpensePayeeKycStatus } from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

import { AccountAdminKYCModal } from './AccountAdminKYCModal';

type ExpenseAdminKYCSectionProps = {
  kycPayee: ExpensePayeeKyc | null | undefined;
  payeeAccountType: AccountType;
  account: AccountReferenceInput;
  host: AccountReferenceInput & { slug: string };
  className?: string;
};

const statusStyles: Record<string, string> = {
  [ExpensePayeeKycStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ExpensePayeeKycStatus.VERIFIED]: 'bg-green-100 text-green-800',
};

export function ExpenseAdminKYCSection({
  kycPayee,
  payeeAccountType,
  account,
  host,
  className,
}: ExpenseAdminKYCSectionProps) {
  const [isDetailsOpen, setDetailsOpen] = React.useState(false);

  if (!kycPayee || payeeAccountType === 'INDIVIDUAL' || kycPayee.status === ExpensePayeeKycStatus.NOT_REQUESTED) {
    return null;
  }

  const containerClassName = cn(
    'inline-flex cursor-pointer items-center gap-0.5 rounded-sm px-2 py-0.75 text-[11px] font-bold tracking-wide uppercase',
    statusStyles[kycPayee.status] ?? 'bg-gray-100 text-gray-800',
    className,
  );

  const statusLabel =
    kycPayee.status === ExpensePayeeKycStatus.VERIFIED ? (
      <FormattedMessage defaultMessage="KYC Verified" id="eEXNr4" />
    ) : (
      <FormattedMessage defaultMessage="KYC Pending" id="YC8RDd" />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={containerClassName}>
          {statusLabel}
          <ChevronDown className="h-3 w-3 stroke-[1.5]" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-1">
        <DropdownMenuItem onClick={() => setDetailsOpen(true)} className="gap-2 px-3 py-2">
          <FormattedMessage defaultMessage="View details" id="MnpUD7" />
        </DropdownMenuItem>
      </DropdownMenuContent>

      <AccountAdminKYCModal account={account} host={host} open={isDetailsOpen} setOpen={setDetailsOpen} />
    </DropdownMenu>
  );
}
