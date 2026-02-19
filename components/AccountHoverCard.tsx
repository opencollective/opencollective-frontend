import React from 'react';
import { useQuery } from '@apollo/client';
import type { Content } from '@radix-ui/react-hover-card';
import { clsx } from 'clsx';
import { get } from 'lodash';
import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, Banknote, Building, Calendar, FileText, Mail, PencilRuler, Receipt, Users } from 'lucide-react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { isIndividualAccount } from '../lib/collective';
import { gql } from '../lib/graphql/helpers';
import type {
  AccountHoverCardFieldsFragment,
  Amount,
  UserContextualMembershipsQuery,
} from '../lib/graphql/types/v2/graphql';
import { getCollectivePageRoute } from '../lib/url-helpers';
import { KycVerificationStatus } from '@/lib/graphql/types/v2/graphql';

import { DashboardContext } from './dashboard/DashboardContext';
import PrivateInfoIcon from './icons/PrivateInfoIcon';
import { kycStatusFields } from './kyc/graphql';
import { Collapsible, CollapsibleContent } from './ui/Collapsible';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/HoverCard';
import { AccountTrustBadge } from './AccountTrustBadge';
import Avatar from './Avatar';
import FollowButton from './FollowButton';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import Link from './Link';
import Spinner from './Spinner';

export const accountHoverCardFields = gql`
  fragment AccountHoverCardFields on Account {
    id
    name
    legalName
    slug
    type
    description
    imageUrl
    isHost
    isArchived
    isVerified
    ... on Individual {
      id
      isGuest
    }
    ... on AccountWithHost {
      host {
        id
        slug
        type
        isTrustedHost
        isFirstPartyHost
        isVerified
      }
      approvedAt
    }

    ... on Organization {
      host {
        id
        slug
        type
        isTrustedHost
        isFirstPartyHost
        isVerified
      }
    }

    ... on AccountWithParent {
      parent {
        id
        slug
      }
    }
  }
`;

type AccountHoverCardProps = {
  trigger: React.ReactNode;
  account: AccountHoverCardFieldsFragment & {
    stats?: {
      balanceWithBlockedFunds?: Amount;
      totalPaidExpenses?: Amount;
    };
  };
  includeAdminMembership?: {
    accountSlug?: string;
    hostSlug?: string;
  };
  infoItems?: InfoItemProps[];
  hoverCardContentProps?: React.ComponentProps<typeof Content>;
  displayFollowButton?: boolean;
};

const userContextualMembershipsQuery = gql`
  query UserContextualMemberships(
    $userSlug: String!
    $accountSlug: String
    $hostSlug: String
    $getHostAdmin: Boolean!
    $getAccountAdmin: Boolean!
    $dashboardAccountSlug: String
    $hasDashboardAccountSlug: Boolean!
  ) {
    account(slug: $userSlug) {
      id
      accountAdminMemberships: memberOf(role: [ADMIN], account: { slug: $accountSlug }, isApproved: true)
        @include(if: $getAccountAdmin) {
        nodes {
          id
          role
          since
          account {
            id
            slug
          }
        }
      }
      hostAdminMemberships: memberOf(role: [ADMIN], account: { slug: $hostSlug }, isApproved: true)
        @include(if: $getHostAdmin) {
        nodes {
          id
          role
          since
          account {
            id
            slug
          }
        }
      }
      ... on Individual {
        kycStatus(requestedByAccount: { slug: $dashboardAccountSlug }) @include(if: $hasDashboardAccountSlug) {
          ...KYCStatusFields
        }
      }
    }
  }
  ${kycStatusFields}
`;

const getInfoItems = (account): InfoItemProps[] => {
  return [
    ...(account?.emails?.map(email => ({
      Icon: Mail,
      info: (
        <div>
          {email} <PrivateInfoIcon />
        </div>
      ),
    })) || []),
    account.parent && {
      Icon: account.type === 'EVENT' ? Calendar : PencilRuler,
      info: (
        <FormattedMessage
          defaultMessage="{childAccountType, select, EVENT {Event} PROJECT {Project} other {Account}} by {parentAccount}"
          id="bZC/zt"
          values={{
            childAccountType: account.type,
            parentAccount: <Link href={getCollectivePageRoute(account.parent)}>@{account.parent.slug}</Link>,
          }}
        />
      ),
    },
    account?.host &&
      !account.isHost &&
      account?.approvedAt && {
        Icon: Building,
        info: (
          <FormattedMessage
            defaultMessage="Hosted by {host} since {approvedAt}"
            id="PAGBSx"
            values={{
              childAccountType: account.type,
              host: <Link href={getCollectivePageRoute(account.host)}>@{account.host.slug}</Link>,
              approvedAt: <FormattedDate dateStyle="medium" value={account.approvedAt} />,
            }}
          />
        ),
      },
    account.hostAgreements?.totalCount > 0 && {
      Icon: FileText,
      info: (
        <FormattedMessage
          defaultMessage="Has <AgreementsLink>{hostAgreementsCount} host agreements</AgreementsLink>"
          id="Zh9ojg"
          values={{
            hostAgreementsCount: account.hostAgreements?.totalCount,
            AgreementsLink: chunks => (
              <Link href={`/dashboard/${account.host.slug}/host-agreements?account=${account.slug}`}>{chunks}</Link>
            ),
          }}
        />
      ),
    },
    account.stats?.balanceWithBlockedFunds && {
      Icon: Banknote,
      info: (
        <FormattedMessage
          id="BalanceAmount"
          defaultMessage="Balance {balance}"
          values={{
            balance: (
              <span className="text-foreground">
                <FormattedMoneyAmount
                  amount={get(account, 'stats.balanceWithBlockedFunds.valueInCents', 0)}
                  currency={account.stats.balanceWithBlockedFunds.currency}
                />
              </span>
            ),
          }}
        />
      ),
    },
    account?.stats?.totalPaidExpenses && {
      Icon: Receipt,
      info: (
        <FormattedMessage
          defaultMessage="Total expense payouts {currentYear}: {totalPaidExpenses}"
          id="wNU66x"
          values={{
            totalPaidExpenses: (
              <span className="text-foreground">
                <FormattedMoneyAmount
                  amount={account?.stats.totalPaidExpenses.valueInCents}
                  currency={account?.stats.totalPaidExpenses.currency}
                  precision={2}
                />
              </span>
            ),
            currentYear: new Date().getFullYear().toString(),
          }}
        />
      ),
    },
  ].filter(Boolean);
};

const getInfoItemsFromMembershipData = (data: UserContextualMembershipsQuery): InfoItemProps[] => {
  return [
    ...(data?.account?.hostAdminMemberships?.nodes?.map(membership => ({
      Icon: Building,
      info: (
        <FormattedMessage
          defaultMessage="Admin of {account} since {date}"
          id="M0vlyv"
          values={{
            account: <Link href={`/${membership.account.slug}`}>@{membership.account.slug}</Link>,
            date: <FormattedDate dateStyle="medium" value={membership.since} />,
          }}
        />
      ),
    })) || []),
    ...(data?.account?.accountAdminMemberships?.nodes.map(membership => ({
      Icon: Users,
      info: (
        <FormattedMessage
          defaultMessage="Admin of {account} since {date}"
          id="M0vlyv"
          values={{
            account: <Link href={`/${membership.account.slug}`}>@{membership.account.slug}</Link>,
            date: <FormattedDate dateStyle="medium" value={membership.since} />,
          }}
        />
      ),
    })) || []),
    data?.account?.['kycStatus']?.manual?.status === KycVerificationStatus.VERIFIED && {
      Icon: BadgeCheck,
      info: 'KYC Verified',
    },
  ].filter(Boolean);
};

type InfoItemProps = {
  Icon: LucideIcon;
  info: React.ReactNode;
};

const InfoItem = ({ Icon, info }: InfoItemProps) => (
  <div className="flex items-start gap-2 overflow-hidden text-xs text-muted-foreground">
    <Icon size={14} className="shrink-0" />
    <span className="[&>a]:text-foreground [&>a]:underline [&>a:hover]:text-primary">{info}</span>
  </div>
);

export const AccountHoverCard = ({
  trigger,
  account,
  includeAdminMembership: { accountSlug, hostSlug } = {},
  hoverCardContentProps,
  displayFollowButton,
}: AccountHoverCardProps) => {
  const [open, setOpen] = React.useState(false);
  const context = React.useContext(DashboardContext);
  const dashboardAccount = context?.account;

  const isIndividual = account ? isIndividualAccount(account) : false;
  const isVendor = account?.type === 'VENDOR';
  const hoverTimeoutRef = React.useRef(null);
  const [hasBeenHovered, setHasBeenHovered] = React.useState(false);

  /*
      Query to fetch an individual accounts's contextual admin memberships
      It is triggered after the hover card trigger has been hovered for 100ms (or the hovercard has been opened, after a default delay of 700ms)
      This aims to prevent unnecessary queries when the hover card is not intended to be opened, while still trying to fetch the data before the hover card is actually opened
  */
  const { data, loading } = useQuery(userContextualMembershipsQuery, {
    variables: {
      userSlug: account?.slug,
      accountSlug,
      hostSlug,
      getHostAdmin: !!hostSlug,
      getAccountAdmin: !!accountSlug && accountSlug !== hostSlug, // Don't fetch account admin membership if the account is also the host
      dashboardAccountSlug: dashboardAccount?.slug,
      hasDashboardAccountSlug: !!dashboardAccount?.slug,
    },
    // Skip query if account is not an individual, if there no accountSlug or hostSlug in `includeAdminMembership`, or if the hover card is not open or hovered
    skip: !isIndividual || !account?.slug || !(accountSlug || hostSlug) || !(open || hasBeenHovered),
    fetchPolicy: 'cache-first',
  });

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHasBeenHovered(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    // Clear the timeout if the mouse leaves before the delay completes
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  if (!account) {
    return trigger;
  }

  const infoItems = getInfoItems(account);
  const asyncInfoItems = getInfoItemsFromMembershipData(data);
  const accountUrl = context?.getProfileUrl?.(account) || getCollectivePageRoute(account);
  return (
    // HoverCard currently disabled for Vendors (need to fix styling, appropriate links, etc)
    <HoverCard open={open && !isVendor} onOpenChange={setOpen}>
      <HoverCardTrigger onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80 cursor-default text-left text-sm font-normal"
        onClick={e => e.stopPropagation()} // Prevent click propagation when used inside other elements such as `HostedAccountFilter`
        {...hoverCardContentProps}
      >
        <div className="relative flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-3 overflow-hidden break-words">
            <div className="flex justify-between">
              <Link href={accountUrl}>
                <Avatar collective={account} radius={64} />
              </Link>

              {displayFollowButton && <FollowButton account={account} isHoverCard />}
            </div>

            <div className="overflow-hidden">
              <div className="flex items-center gap-1">
                <Link href={accountUrl}>
                  <span className="block truncate font-medium hover:underline">{account.name}</span>
                </Link>
                <AccountTrustBadge account={account} />
              </div>
              <span className="truncate text-muted-foreground">@{account.slug}</span>
            </div>
          </div>

          {account.description && (
            <div className="line-clamp-1 text-sm whitespace-pre-wrap text-foreground">{account.description}</div>
          )}

          {(infoItems.length > 0 || asyncInfoItems.length > 0 || loading) && (
            <div>
              {infoItems.length > 0 && (
                <div className="flex flex-col gap-2">
                  {infoItems.map(({ Icon, info }, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <InfoItem key={i} Icon={Icon} info={info} />
                  ))}
                </div>
              )}
              <Collapsible open={asyncInfoItems.length > 0}>
                <CollapsibleContent>
                  <div className={clsx('flex flex-col gap-2', infoItems.length > 0 && 'mt-2')}>
                    {asyncInfoItems.map(({ Icon, info }, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <InfoItem key={i} Icon={Icon} info={info} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {loading && <Spinner className="absolute top-0 right-0 text-muted-foreground" />}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
