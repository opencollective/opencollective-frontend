import React from 'react';
import { useQuery } from '@apollo/client';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage, type IntlShape, useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { gql } from '@/lib/graphql/helpers';
import type {
  Account,
  AccountKycStatusBadgeHostFeatureQuery,
  AccountKycStatusBadgeHostFeatureQueryVariables,
  AccountKycStatusBadgeIndividualQuery,
  AccountKycStatusBadgeIndividualQueryVariables,
  AccountReferenceInput,
  AccountType,
  KycVerificationStatus,
} from '@/lib/graphql/types/v2/graphql';
import { KycProvider, KycVerificationStatus as KycVerificationStatusEnum } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { cn } from '@/lib/utils';

import { useModal } from '@/components/ModalContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

import { kycVerificationFields } from '../graphql';
import { KYCRequestModal } from '../request/KYCRequestModal';
import { CreateManualKYCRequestModal } from '../request/manual/CreateManualKYCRequestModal';

import { KYCVerificationInfoModal } from './KYCVerificationInfoModal';

type AccountKYCStatusBadgeProps = {
  account: AccountReferenceInput;
  host: AccountReferenceInput & { slug: string; type: AccountType };
  showActions?: boolean;
  className?: string;
};

function getKycBadgeState(
  intl: IntlShape,
  account: Pick<Account, 'type'> | null | undefined,
  status: KycVerificationStatus | null | undefined,
) {
  if (account?.type !== 'INDIVIDUAL') {
    return null;
  }

  if (!status || status === KycVerificationStatusEnum.REVOKED) {
    return {
      label: intl.formatMessage({ defaultMessage: 'Initiate KYC', id: 'initiate-kyc' }),
      state: 'INITIATE',
      containerClassName: 'bg-blue-100 text-blue-700',
    };
  }

  switch (status) {
    case KycVerificationStatusEnum.PENDING:
      return {
        label: intl.formatMessage({ defaultMessage: 'KYC Pending', id: 'YC8RDd' }),
        state: 'REQUESTED',
        containerClassName: 'bg-yellow-100 text-yellow-800',
      };
    case KycVerificationStatusEnum.VERIFIED:
      return {
        label: intl.formatMessage({ defaultMessage: 'KYC Verified', id: 'eEXNr4' }),
        state: 'VERIFIED',
        containerClassName: 'bg-green-100 text-green-800',
      };
    case KycVerificationStatusEnum.FAILED:
    case KycVerificationStatusEnum.EXPIRED:
    default:
      return {
        label: intl.formatMessage({ defaultMessage: 'KYC Rejected', id: 'h2ilrh' }),
        state: 'REJECTED',
        containerClassName: 'bg-red-100 text-red-800',
      };
  }
}

const hostKycFeatureQuery = gql`
  query AccountKYCStatusBadgeHostFeature($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      features {
        KYC
      }
    }
  }
`;

const accountKycStatusQuery = gql`
  query AccountKYCStatusBadgeIndividual($accountSlug: String!, $hostSlug: String!) {
    account(slug: $accountSlug) {
      type
      ... on Individual {
        kycVerifications(requestedByAccounts: [{ slug: $hostSlug }], limit: 1) {
          nodes {
            ...KYCVerificationFields
          }
        }
      }
    }
  }

  ${kycVerificationFields}
`;

export function AccountKYCStatusBadge(props: AccountKYCStatusBadgeProps) {
  const hostSlug = props.host?.slug;
  const accountSlug = props.account?.slug;
  const intl = useIntl();
  const { showModal } = useModal();
  const { LoggedInUser } = useLoggedInUser();
  const shouldSkipHostFeatureQuery =
    !hostSlug || !accountSlug || !LoggedInUser || !LoggedInUser.isAdminOfCollective(props.host);
  const [isDetailsOpen, setDetailsOpen] = React.useState(false);

  const hostFeatureQuery = useQuery<
    AccountKycStatusBadgeHostFeatureQuery,
    AccountKycStatusBadgeHostFeatureQueryVariables
  >(hostKycFeatureQuery, {
    variables: { hostSlug },
    skip: shouldSkipHostFeatureQuery,
  });

  const kycStatusQuery = useQuery<AccountKycStatusBadgeIndividualQuery, AccountKycStatusBadgeIndividualQueryVariables>(
    accountKycStatusQuery,
    {
      variables: { accountSlug, hostSlug },
      skip:
        !hostFeatureQuery ||
        !hostFeatureQuery.data?.host ||
        !isFeatureEnabled(hostFeatureQuery.data.host, FEATURES.KYC),
    },
  );

  const account = kycStatusQuery.data?.account as
    | (AccountKycStatusBadgeIndividualQuery['account'] & { __typename: 'Individual' })
    | null;

  const kycVerification = account?.kycVerifications?.nodes?.[0];

  const badgeState = React.useMemo(() => {
    return getKycBadgeState(intl, account, kycVerification?.status);
  }, [account, intl, kycVerification]);

  const openSubmitManualKYCModal = React.useCallback(() => {
    showModal(KYCRequestModal, {
      requestedByAccount: props.host,
      verifyAccount: props.account,
      refetchQueries: [
        'AccountKYCStatusBadgeIndividual',
        'ExpensePage',
        'HostDashboardExpenses',
        'ExpensePipelineOverview',
        'HostDashboardMetadata',
      ],
      provider: KycProvider.MANUAL,
    });
  }, [showModal, props.host, props.account]);

  const openRequestManualKYCModal = React.useCallback(() => {
    showModal(CreateManualKYCRequestModal, {
      requestedByAccount: props.host,
      verifyAccount: props.account,
      refetchQueries: [
        'AccountKYCStatusBadgeIndividual',
        'ExpensePage',
        'HostDashboardExpenses',
        'ExpensePipelineOverview',
        'HostDashboardMetadata',
      ],
    });
  }, [showModal, props.host, props.account]);

  if (!badgeState) {
    return null;
  }

  const containerClassName = cn(
    'inline-flex items-center rounded-sm px-2 py-0.75 text-[11px] font-bold tracking-wide uppercase',
    badgeState.containerClassName,
    props.className,
  );

  if ((!kycVerification || kycVerification?.status === KycVerificationStatusEnum.REVOKED) && !props.showActions) {
    return null;
  }

  if (!props.showActions) {
    return <div className={containerClassName}>{badgeState.label}</div>;
  }

  const canRequest = !kycVerification || kycVerification?.status === KycVerificationStatusEnum.REVOKED;
  const canSubmit = canRequest || kycVerification?.status === KycVerificationStatusEnum.PENDING;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={containerClassName}>
          {badgeState.label}
          <ChevronDown className={cn('h-3 w-3 stroke-[1.5]')} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-1">
        {kycVerification && (
          <React.Fragment>
            <DropdownMenuItem onClick={() => setDetailsOpen(true)} className="gap-2 px-3 py-2">
              <FormattedMessage defaultMessage="View details" id="MnpUD7" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </React.Fragment>
        )}
        {canRequest && (
          <DropdownMenuItem onClick={openRequestManualKYCModal} className="gap-2 px-3 py-2">
            <FormattedMessage defaultMessage="Request KYC Verification" id="Kio9p/" />
          </DropdownMenuItem>
        )}
        {canSubmit && (
          <DropdownMenuItem onClick={openSubmitManualKYCModal} className="gap-2 px-3 py-2">
            <FormattedMessage defaultMessage="Submit KYC Verification" id="fS9N/M" />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>

      {kycVerification && (
        <KYCVerificationInfoModal
          verification={kycVerification}
          open={isDetailsOpen}
          setOpen={setDetailsOpen}
          onSubmitVerificationClick={() => {
            setDetailsOpen(false);
            openSubmitManualKYCModal();
          }}
        />
      )}
    </DropdownMenu>
  );
}
