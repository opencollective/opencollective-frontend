import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { capitalize, get, truncate } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import INTERVALS from '../../lib/constants/intervals';
import { getPrecisionFromAmount, graphqlAmountValueInCents } from '../../lib/currency-utils';
import type { Tier } from '../../lib/graphql/types/v2/schema';
import { getCollectivePageRoute } from '../../lib/url-helpers';
import { i18nTierType } from '@/lib/i18n/tier-type';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import StyledLink from '../StyledLink';
import { actionsColumn, DataTable } from '../table/DataTable';
import { Badge } from '../ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

type TierRow = Tier | { id: 'custom'; type: 'CUSTOM'; name: string; description?: string };

interface TiersTableProps {
  data: TierRow[];
  collective: { slug: string; currency: string; id: number };
  loading?: boolean;
  getActions: GetActions<TierRow>;
  onRowClick?: (row: TierRow) => void;
  emptyMessage?: () => React.ReactNode;
  onReorder?: (newOrder: string[]) => void;
}

const TiersTable = ({ data, collective, loading, getActions, onRowClick, emptyMessage }: TiersTableProps) => {
  const intl = useIntl();
  const [localData, setLocalData] = React.useState(data);
  const hasCustomContribution = !get(collective, 'settings.disableCustomContributions', false);

  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  const getTierKey = (tier: TierRow): string => {
    if (tier.id === 'custom') {
      return 'custom';
    }
    const tierData = tier as Tier;
    return String(tierData.legacyId || tierData.id);
  };

  const itemIds = localData.map(t => getTierKey(t));

  const columns: ColumnDef<TierRow>[] = [
    {
      id: 'type',
      header: () => <FormattedMessage defaultMessage="Type" id="Fields.type" />,
      meta: { className: 'w-24' },
      cell: ({ row }) => {
        const tier = row.original;
        if (tier.id === 'custom') {
          return (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2 font-medium text-muted-foreground italic underline decoration-dashed underline-offset-4">
                  <span className="text-nowrap">
                    <FormattedMessage defaultMessage="Default Tier" id="agyQD7" />
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <FormattedMessage
                  id="tier.defaultContribution.description"
                  defaultMessage="The default contribution tier doesn't enforce any minimum amount or interval. This is the easiest way for people to contribute to your Collective, but it cannot be customized."
                />
              </TooltipContent>
            </Tooltip>
          );
        } else {
          return <div className="truncate font-medium">{capitalize(i18nTierType(intl, tier.type))}</div>;
        }
      },
    },
    {
      accessorKey: 'name',
      header: () => <FormattedMessage defaultMessage="Name" id="Fields.name" />,
      meta: { className: 'w-48' },
      cell: ({ row }) => {
        const tier = row.original;
        const isCustom = tier.id === 'custom';
        const name = isCustom ? intl.formatMessage({ id: 'Donation', defaultMessage: 'Donation' }) : tier.name;

        if (isCustom) {
          return <div className="truncate font-medium">{name}</div>;
        }

        const tierWithPage = tier as Tier;
        if (tierWithPage.useStandalonePage) {
          const tierLegacyId = tierWithPage.legacyId || tierWithPage.id;
          return (
            <StyledLink
              as={Link}
              href={`${getCollectivePageRoute(collective)}/contribute/${tierWithPage.slug}-${tierLegacyId}`}
              color="black.900"
              $hoverColor="black.900"
              $underlineOnHover
              className="truncate font-medium"
            >
              {name}
            </StyledLink>
          );
        }

        return <div className="truncate font-medium">{name}</div>;
      },
    },
    {
      accessorKey: 'description',
      header: () => <FormattedMessage defaultMessage="Description" id="Fields.description" />,
      meta: { className: 'w-auto' },
      cell: ({ row }) => {
        const tier = row.original;
        const isCustom = tier.id === 'custom';
        let description: string | null = null;

        if (isCustom) {
          description = intl.formatMessage({
            id: 'CollectivePage.Contribute.Custom.Description',
            defaultMessage: 'Make a custom one-time or recurring contribution.',
          });
        } else {
          description = (tier as Tier).description;
        }

        if (!description) {
          return (
            <span className="text-slate-500 italic">
              <FormattedMessage id="TOxNpA" defaultMessage="No description provided" />
            </span>
          );
        }

        return <div className="truncate text-sm text-slate-600">{truncate(description, { length: 150 })}</div>;
      },
    },
    {
      id: 'amount',
      header: () => <FormattedMessage defaultMessage="Amount" id="Fields.amount" />,
      meta: { className: 'w-40', align: 'right' },
      cell: ({ row }) => {
        const tier = row.original;
        const isCustom = tier.id === 'custom';

        if (isCustom) {
          return (
            <span className="text-sm text-slate-500 italic">
              <FormattedMessage defaultMessage="Flexible" id="Flexible" />
            </span>
          );
        }

        const tierData = tier as Tier;
        const currency = tierData.amount?.currency || collective.currency;
        const isFlexibleAmount = tierData.amountType === 'FLEXIBLE';
        const minAmount = isFlexibleAmount ? tierData.minimumAmount : tierData.amount;
        const amountValue = graphqlAmountValueInCents(minAmount);

        if (!amountValue || amountValue === 0) {
          return (
            <span className="text-sm text-slate-500 italic">
              <FormattedMessage defaultMessage="Free" id="Free" />
            </span>
          );
        }

        const isFlexibleInterval = tierData.interval === INTERVALS.flexible;
        const interval = tierData.interval && !isFlexibleInterval ? tierData.interval : null;

        return (
          <div className="text-right">
            {isFlexibleAmount && (
              <div className="mb-0.5 text-xs text-slate-500 uppercase">
                <FormattedMessage id="ContributeTier.StartsAt" defaultMessage="Starts at" />
              </div>
            )}
            <FormattedMoneyAmount
              amount={amountValue}
              currency={currency}
              interval={interval}
              precision={getPrecisionFromAmount(amountValue)}
              showCurrencyCode={false}
              amountClassName="font-semibold"
            />
          </div>
        );
      },
    },
    {
      id: 'status',
      header: () => <FormattedMessage defaultMessage="Status" id="Fields.status" />,
      meta: { className: 'w-24' },
      cell: ({ row }) => {
        const tier = row.original;
        const isEnabled = tier.id !== 'custom' || hasCustomContribution;
        return (
          <Badge type={isEnabled ? 'success' : 'neutral'}>
            {isEnabled ? (
              <FormattedMessage defaultMessage="Enabled" id="Enabled" />
            ) : (
              <FormattedMessage defaultMessage="Disabled" id="Disabled" />
            )}
          </Badge>
        );
      },
    },
    {
      ...actionsColumn,
      meta: { className: 'w-24 text-right' },
    },
  ];

  return (
    <DataTable
      data-cy="tiers-table"
      columns={columns}
      data={localData}
      loading={loading}
      getActions={getActions}
      onClickRow={onRowClick ? row => onRowClick(row.original) : undefined}
      getRowId={row => getTierKey(row)}
      emptyMessage={emptyMessage}
      compact
      sortableRowIds={itemIds}
      getSortableRowId={row => getTierKey(row.original)}
    />
  );
};

export default TiersTable;
