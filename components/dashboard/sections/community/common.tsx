import React, { useCallback } from 'react';
import { capitalize, compact } from 'lodash';
import {
  Archive,
  ArrowRightLeft,
  BookKey,
  EarthIcon,
  EyeIcon,
  HandCoins,
  HelpCircle,
  Pencil,
  Receipt,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '@/lib/actions/types';
import { CollectiveType } from '@/lib/constants/collectives';
import type { CommunityAccountDetailQuery, VendorFieldsFragment } from '@/lib/graphql/types/v2/graphql';
import type { Contributor } from '@/lib/graphql/types/v2/schema';
import { ActivityDescriptionI18n } from '@/lib/i18n/activities';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';

import { KYCRequestModal } from '@/components/kyc/request/KYCRequestModal';
import LinkCollective from '@/components/LinkCollective';
import { useModal } from '@/components/ModalContext';
import { actionsColumn } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { getActivityVariables } from '../ActivityLog/ActivityDescription';

type UsePersonActionsOptions = {
  accountSlug: string;
  hasKYCFeature: boolean;
  editVendor?: (vendor: VendorFieldsFragment) => void;
  archiveVendor?: (vendor: VendorFieldsFragment) => void;
};

export function usePersonActions(opts: UsePersonActionsOptions) {
  const intl = useIntl();
  const { showModal } = useModal();
  const router = useRouter();

  return useCallback<GetActions<Contributor>>(
    contributor => {
      const actions: ReturnType<GetActions<Contributor>> = {
        primary: [],
        secondary: [],
      };

      // The contributor in this context is actually an Account from the community query
      const account = contributor as unknown as { slug?: string; type?: string };
      const contributorSlug = account.slug;
      const hostSlug = router.query.slug as string;

      if (!contributorSlug || !hostSlug) {
        return actions;
      }

      actions.primary.push({
        key: 'view-expenses',
        label: intl.formatMessage({
          defaultMessage: 'View All Expenses',
          id: 'ViewAllExpenses',
        }),
        Icon: Receipt,
        onClick: () => {
          router.push({
            pathname: `/dashboard/${hostSlug}/host-expenses`,
            query: { status: 'ALL', searchTerm: `@${contributorSlug}` },
          });
        },
      });

      actions.primary.push({
        key: 'view-contributions',
        label: intl.formatMessage({
          defaultMessage: 'View All Contributions',
          id: 'ViewAllContributions',
        }),
        Icon: HandCoins,
        onClick: () => {
          router.push({
            pathname: `/dashboard/${hostSlug}/incoming-contributions`,
            query: { searchTerm: `@${contributorSlug}` },
          });
        },
      });

      actions.primary.push({
        key: 'view-transactions',
        label: intl.formatMessage({
          defaultMessage: 'View All Transactions',
          id: 'transactions.viewAll',
        }),
        Icon: ArrowRightLeft,
        onClick: () => {
          router.push({
            pathname: `/dashboard/${hostSlug}/host-transactions`,
            query: { searchTerm: `@${contributorSlug}` },
          });
        },
      });

      if (account.type === CollectiveType.VENDOR) {
        if (opts.editVendor) {
          actions.secondary.push({
            key: 'edit-vendor',
            label: intl.formatMessage({
              defaultMessage: 'Edit',
              id: 'Edit',
            }),
            Icon: Pencil,
            onClick: () => {
              opts.editVendor(contributor as unknown as VendorFieldsFragment);
            },
          });
        }
        if (opts.archiveVendor) {
          actions.secondary.push({
            key: 'archive-vendor',
            label: (contributor as unknown as VendorFieldsFragment).isArchived
              ? intl.formatMessage({
                  defaultMessage: 'Unarchive Vendor',
                  id: 'Vendor.UnarchiveVendor',
                })
              : intl.formatMessage({
                  defaultMessage: 'Archive Vendor',
                  id: 'Vendor.ArchiveVendor',
                }),
            Icon: Archive, // Replace with Unarchive icon if available
            onClick: () => {
              opts.archiveVendor(contributor as unknown as VendorFieldsFragment);
            },
          });
        }
      }

      if (opts.hasKYCFeature && account.type === CollectiveType.INDIVIDUAL) {
        actions.secondary.push({
          key: 'request-kyc',
          label: intl.formatMessage({
            defaultMessage: 'Request KYC Verification',
            id: 'Kio9p/',
          }),
          Icon: BookKey,
          onClick: () =>
            showModal(KYCRequestModal, {
              requestedByAccount: { slug: opts.accountSlug },
              verifyAccount: { id: contributor.id },
            }),
        });
      }

      return actions;
    },
    [intl, showModal, router, opts.accountSlug, opts.hasKYCFeature],
  );
}

type UseAssociatedCollectiveActionsOpts = Pick<UsePersonActionsOptions, 'accountSlug'>;
type AssociatedCollective = CommunityAccountDetailQuery['account']['communityStats']['associatedCollectives'][number];

export function useAssociatedCollectiveActions(opts: UseAssociatedCollectiveActionsOpts) {
  const intl = useIntl();
  const router = useRouter();

  return useCallback<GetActions<AssociatedCollective>>(
    associatedCollective => {
      const actions: ReturnType<GetActions<AssociatedCollective>> = {
        primary: [],
        secondary: [],
      };

      // The contributor in this context is actually an Account from the community query
      const account = associatedCollective && 'account' in associatedCollective ? associatedCollective.account : null;
      const collectiveSlug = account?.slug;
      const hostSlug = router.query.slug as string;

      if (!collectiveSlug || !hostSlug) {
        return actions;
      }

      actions.primary.push({
        key: 'view-expenses',
        label: intl.formatMessage({
          defaultMessage: 'View All Expenses',
          id: 'ViewAllExpenses',
        }),
        Icon: Receipt,
        onClick: () => {
          router.push({
            pathname: `/dashboard/${hostSlug}/host-expenses`,
            query: { status: 'ALL', searchTerm: `@${opts.accountSlug}`, account: collectiveSlug },
          });
        },
      });
      actions.primary.push({
        key: 'view-contributions',
        label: intl.formatMessage({
          defaultMessage: 'View All Contributions',
          id: 'ViewAllContributions',
        }),
        Icon: HandCoins,
        onClick: () => {
          router.push({
            pathname: `/dashboard/${hostSlug}/incoming-contributions`,
            query: { searchTerm: `@${opts.accountSlug}`, hostedAccounts: collectiveSlug },
          });
        },
      });
      actions.primary.push({
        key: 'view-transactions',
        label: intl.formatMessage({
          defaultMessage: 'View All Transactions',
          id: 'transactions.viewAll',
        }),
        Icon: ArrowRightLeft,
        onClick: () => {
          router.push({
            pathname: `/dashboard/${hostSlug}/host-transactions`,
            query: { searchTerm: `@${opts.accountSlug}`, account: collectiveSlug },
          });
        },
      });

      actions.secondary.push({
        key: 'view-collective-details',
        label: intl.formatMessage({
          defaultMessage: 'View Collective Details',
          id: 'CommunitySection.ViewCollectiveDetails',
        }),
        Icon: EyeIcon,
        onClick: () => {
          router.push(`/dashboard/${hostSlug}/hosted-collectives/${account.id}`);
        },
      });
      actions.secondary.push({
        key: 'view-collective-profile',
        label: intl.formatMessage({
          defaultMessage: 'View Collective Public Profile',
          id: 'CommunitySection.ViewCollectiveProfile',
        }),
        Icon: EarthIcon,
        onClick: () => {
          router.push(`/${account.slug}`);
        },
      });

      return actions;
    },
    [intl, router, opts.accountSlug],
  );
}

type ActivityType = NonNullable<CommunityAccountDetailQuery['firstActivity']['nodes'][0]>;

export const RichActivityDate = ({
  date,
  activity,
}: {
  date: string | null | undefined;
  activity?: ActivityType | null;
}) => {
  const intl = useIntl();
  if (!date) {
    return null;
  } else if (!activity) {
    return <DateTime value={date} dateStyle="long" />;
  }

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <div className="inline-flex cursor-help items-center gap-1.5">
          <span className="border-b border-dashed border-muted-foreground/40">
            <DateTime value={date} dateStyle="long" />
          </span>
          <HelpCircle size={14} className="shrink-0 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="z-[9999] max-w-xs text-left">
        {ActivityDescriptionI18n[activity.type]
          ? intl.formatMessage(ActivityDescriptionI18n[activity.type], getActivityVariables(intl, activity))
          : capitalize(activity.type.replace(/_/g, ' '))}
      </TooltipContent>
    </Tooltip>
  );
};

export const associatedTableColumns = (intl, includeAssociatedCollectiveColumns = false) =>
  compact([
    {
      accessorKey: 'account',
      header: intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
      meta: {
        className: 'max-w-48',
      },
      cell: ({ row }) => {
        const { account } = row.original;
        return (
          <div className="flex min-w-0 items-center overflow-hidden">
            {account.isFrozen && (
              <Badge type="info" size="xs" className="mr-2">
                <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
              </Badge>
            )}
            <LinkCollective
              collective={account}
              className="flex min-w-0 items-center gap-1 overflow-hidden"
              withHoverCard
            >
              <Avatar size={24} collective={account} mr={2} />
              <span className="truncate">{account.name}</span>
            </LinkCollective>
          </div>
        );
      },
    },
    {
      accessorKey: 'relations',
      header: intl.formatMessage({ defaultMessage: 'Roles', id: 'c35gM5' }),
      cell: ({ row }) => {
        const relations =
          row.original.relations?.filter(
            (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes('PAYEE')),
          ) || [];
        return (
          <div className="flex gap-1 align-middle">
            {relations.map(role => (
              <div
                key={role}
                className="inline-flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1 align-middle text-xs font-medium text-nowrap text-muted-foreground ring-1 ring-slate-300 ring-inset"
              >
                {formatCommunityRelation(intl, role)}
              </div>
            ))}
          </div>
        );
      },
    },
    includeAssociatedCollectiveColumns && {
      accessorKey: 'expenses',
      header: intl.formatMessage({ defaultMessage: 'Total Expenses', id: 'TotalExpenses' }),
      cell: ({ row }) => {
        const summary = row.original.transactionSummary;
        const total = summary?.expenseTotal;
        const count = summary?.expenseCount || 0;

        if (!total || count === 0) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="text-sm">
            <FormattedMoneyAmount
              amount={Math.abs(total.valueInCents)}
              currency={total.currency}
              showCurrencyCode={false}
            />
            <span className="ml-1 text-muted-foreground">({count})</span>
          </div>
        );
      },
    },

    includeAssociatedCollectiveColumns && {
      accessorKey: 'contributions',
      header: intl.formatMessage({ defaultMessage: 'Total Contributions', id: 'TotalContributions' }),
      cell: ({ row }) => {
        const summary = row.original.transactionSummary;
        const total = summary?.contributionTotal;
        const count = summary?.contributionCount || 0;

        if (!total || count === 0) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="text-sm">
            <FormattedMoneyAmount
              amount={Math.abs(total.valueInCents)}
              currency={total.currency}
              showCurrencyCode={false}
            />
            <span className="ml-1 text-muted-foreground">({count})</span>
          </div>
        );
      },
    },
    includeAssociatedCollectiveColumns && {
      accessorKey: 'firstInteraction',
      header: intl.formatMessage({ defaultMessage: 'First Interaction', id: 'FirstInteraction' }),
      cell: ({ row }) => {
        const date = row.original.firstInteractionAt;
        return date ? <DateTime value={date} dateStyle="medium" /> : <span className="text-muted-foreground">—</span>;
      },
    },
    includeAssociatedCollectiveColumns && actionsColumn,
  ]);

export const getMembersTableColumns = intl => [
  {
    accessorKey: 'account',
    header: intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    cell: ({ row }) => {
      const { account } = row.original;
      const legalName = account.legalName !== account.name && account.legalName;
      return (
        <div className="flex items-center text-nowrap">
          <LinkCollective collective={account} className="flex items-center gap-1" withHoverCard>
            <Avatar size={24} collective={account} mr={2} />
            {account.name || account.slug}
            {legalName && <span className="ml-1 text-muted-foreground">{`(${legalName})`}</span>}
          </LinkCollective>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: intl.formatMessage({ defaultMessage: 'Role', id: 'members.role.label' }),
    cell: ({ row }) => {
      return (
        <div className="inline-flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1 align-middle text-xs font-medium text-nowrap text-muted-foreground ring-1 ring-slate-300 ring-inset">
          {capitalize(row.original.role.replace('_', ' ').toLowerCase())}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: intl.formatMessage({ defaultMessage: 'Member Since', id: 'MemberSince' }),
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return date ? <DateTime value={date} dateStyle="medium" /> : <span className="text-muted-foreground">—</span>;
    },
  },
];
