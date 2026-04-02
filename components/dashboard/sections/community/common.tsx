import React, { useCallback } from 'react';
import { capitalize } from 'lodash';
import type { LucideProps } from 'lucide-react';
import {
  Archive,
  ArrowRightLeft,
  BookKey,
  Building2,
  HandCoins,
  HelpCircle,
  Pencil,
  Receipt,
  Store,
  User,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '@/lib/actions/types';
import { CollectiveType } from '@/lib/constants/collectives';
import type {
  CommunityAccountDetailQuery,
  DashboardVendorsQuery,
  KycStatusFieldsFragment,
  PeopleHostDashboardQuery,
  VendorFieldsFragment,
} from '@/lib/graphql/types/v2/graphql';
import { AccountType } from '@/lib/graphql/types/v2/graphql';
import { KycProvider } from '@/lib/graphql/types/v2/schema';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { ActivityDescriptionI18n } from '@/lib/i18n/activities';
import { i18nLegalDocumentStatus } from '@/lib/i18n/legal-document';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import { KYCVerificationProviderBadge } from '@/components/kyc/drawer/KYCVerificationProviderBadge';
import { i18nKYCVerificationStatus } from '@/components/kyc/intl';
import { KYCVerificationStatusBadge } from '@/components/kyc/KYCVerificationStatusBadge';
import { KYCRequestModal } from '@/components/kyc/request/KYCRequestModal';
import { useModal } from '@/components/ModalContext';
import { DataList, DataListItem } from '@/components/ui/DataList';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/HoverCard';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import DateTime from '../../../DateTime';
import { ALL_SECTIONS } from '../../constants';
import { getActivityVariables } from '../ActivityLog/ActivityDescription';
import { LegalDocumentServiceBadge } from '../legal-documents/LegalDocumentServiceBadge';
import { LegalDocumentStatusBadge } from '../legal-documents/LegalDocumentStatusBadge';

type UsePersonActionsOptions = {
  accountSlug: string;
  hasKYCFeature: boolean;
  editVendor?: (vendor: VendorFieldsFragment) => void;
  archiveVendor?: (vendor: VendorFieldsFragment) => void;
};

export const getCollectiveTypeIcon = (
  type: AccountType | (typeof CollectiveType)[keyof typeof CollectiveType],
  props?: LucideProps,
): React.ReactNode => {
  switch (type) {
    case AccountType.ORGANIZATION:
      return <Building2 {...props} />;
    case AccountType.VENDOR:
      return <Store {...props} />;
    case CollectiveType.USER:
    case AccountType.INDIVIDUAL:
      return <User {...props} />;
  }
};

type TaxFormBadgeProps = {
  taxForms: CommunityAccountDetailQuery['host']['hostedLegalDocuments'];
  host?: CommunityAccountDetailQuery['host'];
};

export function TaxFormBadge({ taxForms }: TaxFormBadgeProps) {
  const intl = useIntl();
  const taxForm = taxForms?.nodes?.[0];
  if (!taxForm) {
    return null;
  }
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <LegalDocumentStatusBadge
          size="sm"
          status={taxForm.status}
          className="cursor-pointer"
          label={
            <React.Fragment>
              <FormattedMessage defaultMessage="Tax Form" id="7TBksX" />{' '}
            </React.Fragment>
          }
        />
      </HoverCardTrigger>
      <HoverCardContent className="w-72 text-sm" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">
              <FormattedMessage defaultMessage="US Tax Form" id="TaxForm.USTitle" />
              {taxForm.year && <span className="ml-1 text-muted-foreground">({taxForm.year})</span>}
            </span>
            <LegalDocumentServiceBadge size="sm" service={taxForm.service} />
          </div>
          <DataList className="gap-1 text-sm font-normal">
            <DataListItem
              label={<FormattedMessage defaultMessage="Status" id="LegalDocument.Status" />}
              value={i18nLegalDocumentStatus(intl, taxForm.status)}
              labelClassName="min-w-0 w-24 basis-auto"
            />
            {taxForm.requestedAt && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Requested" id="Expense.RequestedDate" />}
                value={<FormattedDate value={taxForm.requestedAt} dateStyle="medium" />}
                labelClassName="min-w-0 w-24 basis-auto"
              />
            )}
            {taxForm.updatedAt && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Last Updated" id="LastUpdated" />}
                value={<FormattedDate value={taxForm.updatedAt} dateStyle="medium" />}
                labelClassName="min-w-0 w-24 basis-auto"
              />
            )}
          </DataList>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

type KYCStatusBadgeProps = {
  kycStatus: KycStatusFieldsFragment | null | undefined;
};

export function KYCStatusBadge({ kycStatus }: KYCStatusBadgeProps) {
  const intl = useIntl();
  const verification = kycStatus?.manual;
  if (!verification) {
    return null;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <KYCVerificationStatusBadge
          size="sm"
          status={verification.status}
          className="cursor-pointer"
          label={
            <React.Fragment>
              <FormattedMessage defaultMessage="KYC" id="KYC" />{' '}
            </React.Fragment>
          }
        />
      </HoverCardTrigger>
      <HoverCardContent className="w-72 text-sm" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">
              <FormattedMessage defaultMessage="KYC Verification" id="odBeoC" />
            </span>
            {verification.provider && <KYCVerificationProviderBadge provider={verification.provider} />}
          </div>
          <DataList className="gap-1 text-sm font-normal">
            <DataListItem
              label={<FormattedMessage defaultMessage="Status" id="LegalDocument.Status" />}
              value={i18nKYCVerificationStatus(intl, verification.status)}
              labelClassName="min-w-0 w-24 basis-auto"
            />
            {verification.requestedAt && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Requested" id="Expense.RequestedDate" />}
                value={<FormattedDate value={verification.requestedAt} dateStyle="medium" />}
                labelClassName="min-w-0 w-24 basis-auto"
              />
            )}
            {verification.verifiedAt && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Verified at" id="CJrQQ0" />}
                value={<FormattedDate value={verification.verifiedAt} dateStyle="medium" />}
                labelClassName="min-w-0 w-24 basis-auto"
              />
            )}
            {verification.revokedAt && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Revoked at" id="PDbgKg" />}
                value={<FormattedDate value={verification.revokedAt} dateStyle="medium" />}
                labelClassName="min-w-0 w-24 basis-auto"
              />
            )}
            {verification.createdByUser && (
              <DataListItem
                label={<FormattedMessage defaultMessage="Added by" id="KYC.AddedBy" />}
                value={verification.createdByUser.name}
                labelClassName="min-w-0 w-24 basis-auto"
              />
            )}
          </DataList>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export enum AccountDetailView {
  OVERVIEW = 'overview',
  TRANSACTIONS = 'transactions',
  ACTIVITIES = 'activities',
  KYC = 'kyc',
}

type CommunityAccount =
  | PeopleHostDashboardQuery['community']['nodes'][number]
  | DashboardVendorsQuery['community']['nodes'][number];

export function usePersonActions(opts: UsePersonActionsOptions) {
  const intl = useIntl();
  const { showModal } = useModal();
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();

  return useCallback<GetActions<CommunityAccount>>(
    contributor => {
      const actions: ReturnType<GetActions<CommunityAccount>> = {
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
            pathname: LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS)
              ? `/dashboard/${hostSlug}/${ALL_SECTIONS.HOST_PAYMENT_REQUESTS}`
              : `/dashboard/${hostSlug}/${ALL_SECTIONS.HOST_EXPENSES}`,
            query: {
              ...(!LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS) && {
                status: 'ALL',
              }),
              searchTerm: `@${contributorSlug}`,
            },
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
            defaultMessage: 'Submit Manual KYC Verification',
            id: 'y47Tc8',
          }),
          Icon: BookKey,
          onClick: () =>
            showModal(KYCRequestModal, {
              requestedByAccount: { slug: opts.accountSlug },
              verifyAccount: { id: contributor.id },
              provider: KycProvider.MANUAL as any,
              refetchQueries: ['PeopleHostDashboard'],
            }),
        });
      }

      return actions;
    },
    [intl, showModal, router, opts, LoggedInUser],
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
