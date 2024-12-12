import React, { useEffect, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { PopoverTrigger } from '@radix-ui/react-popover';
import clsx from 'clsx';
import { clamp, cloneDeep, groupBy, isEmpty, isEqual, isNaN, round } from 'lodash';
import { AlertTriangle, ArrowLeft, ArrowRight, ChevronDown, FileText, Undo } from 'lucide-react';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../../lib/constants/collectives';
import EXPENSE_TYPE from '../../../../lib/constants/expenseTypes';
import { HOST_FEE_STRUCTURE } from '../../../../lib/constants/host-fee-structure';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  AccountWithHost,
  HostedCollectiveFieldsFragment,
  HostedCollectivesQuery,
} from '../../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { formatHostFeeStructure } from '../../../../lib/i18n/host-fee-structure';
import { i18nTransactionKind } from '../../../../lib/i18n/transaction';
import { elementFromClass } from '../../../../lib/react-utils';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import { useDrawerActionsContainer } from '../../../Drawer';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import { DataTable } from '../../../table/DataTable';
import { H4 } from '../../../Text';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { InfoList, InfoListItem } from '../../../ui/InfoList';
import { InputGroup } from '../../../ui/Input';
import { Popover, PopoverContent } from '../../../ui/Popover';
import { RadioGroup, RadioGroupItem } from '../../../ui/RadioGroup';
import { Switch } from '../../../ui/Switch';
import { useToast } from '../../../ui/useToast';
import { DashboardContext } from '../../DashboardContext';
import ActivityDescription from '../ActivityLog/ActivityDescription';
import { ActivityUser } from '../ActivityLog/ActivityUser';

import type { HostedCollectivesDataTableMeta } from './common';
import { cols, MoreActionsMenu } from './common';
import { hostedCollectiveDetailQuery } from './queries';

const editAccountHostFee = gql`
  mutation EditAccountFee($account: AccountReferenceInput!, $hostFeePercent: Float!, $isCustomFee: Boolean!) {
    editAccountFeeStructure(account: $account, hostFeePercent: $hostFeePercent, isCustomFee: $isCustomFee) {
      id
      ... on AccountWithHost {
        hostFeesStructure
        hostFeePercent
      }
      childrenAccounts {
        nodes {
          id
          ... on AccountWithHost {
            hostFeesStructure
            hostFeePercent
          }
        }
      }
    }
  }
`;

type CollectiveDetailsProps = {
  collective?: HostedCollectiveFieldsFragment & Partial<AccountWithHost>;
  collectiveId?: string;
  loading?: boolean;
  host?: HostedCollectivesQuery['host'];
  onCancel: () => void;
  onEdit?: () => void;
  openCollectiveDetails: (HostedCollectiveFieldsFragment) => void;
};

const SectionTitle = elementFromClass('div', 'text-md font-bold text-slate-800 mb-2 flex gap-4 items-center');
const PopoverRadioWrapper = elementFromClass('div', 'flex flex-col');

const HostFeeStructurePicker = ({ collective, host }: Partial<CollectiveDetailsProps>) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [feeStructure, setFeeStructure] = useState<{
    hostFeesStructure: string;
    hostFeePercent: number;
  }>({
    hostFeesStructure: collective.hostFeesStructure,
    hostFeePercent: collective.hostFeePercent || host.hostFeePercent,
  });
  const [submitEditSettings, { loading }] = useMutation(editAccountHostFee, { context: API_V2_CONTEXT });
  const handleFeeStructureChange = async ({ hostFeesStructure, hostFeePercent }) => {
    const previousState = cloneDeep(feeStructure);
    const isCustomFee = hostFeesStructure === HOST_FEE_STRUCTURE.CUSTOM_FEE;
    hostFeePercent = isCustomFee ? hostFeePercent : host.hostFeePercent;
    const variables = {
      account: { slug: collective.slug },
      hostFeePercent,
      isCustomFee,
    };
    setFeeStructure({ hostFeesStructure, hostFeePercent });
    try {
      await submitEditSettings({ variables });
      toast({ variant: 'success', message: <FormattedMessage defaultMessage="Fee structure updated" id="oqXFC+" /> });
    } catch (e) {
      setFeeStructure(previousState);
      toast({ variant: 'error', message: e.message });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={open => !loading && setOpen(open)}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {formatHostFeeStructure(intl, collective.hostFeesStructure)}
          <ChevronDown className="ml-4 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <RadioGroup
          disabled={loading}
          value={feeStructure.hostFeesStructure}
          onValueChange={value => {
            handleFeeStructureChange({ hostFeesStructure: value, hostFeePercent: feeStructure.hostFeePercent });
          }}
        >
          <PopoverRadioWrapper>
            <div className="flex items-center gap-2">
              <RadioGroupItem value={HOST_FEE_STRUCTURE.DEFAULT} />
              <label className="cursor-pointer text-sm font-medium" htmlFor={HOST_FEE_STRUCTURE.DEFAULT}>
                {formatHostFeeStructure(intl, HOST_FEE_STRUCTURE.DEFAULT)}
              </label>
            </div>
            <div className="ml-6 text-xs text-slate-700">
              <FormattedMessage defaultMessage="Use the global fee in your settings." id="ylzz79" />
            </div>
          </PopoverRadioWrapper>
          <PopoverRadioWrapper>
            <div className="flex items-center gap-2">
              <RadioGroupItem value={HOST_FEE_STRUCTURE.CUSTOM_FEE} />
              <label className="cursor-pointer text-sm font-medium" htmlFor={HOST_FEE_STRUCTURE.CUSTOM_FEE}>
                {formatHostFeeStructure(intl, HOST_FEE_STRUCTURE.CUSTOM_FEE)}
              </label>
            </div>
            <div className="ml-6 mt-1 text-xs text-slate-700">
              <InputGroup
                disabled={loading}
                tabIndex={-1}
                autoFocus={false}
                append="%"
                type="number"
                min="0"
                max="100"
                value={isNaN(feeStructure.hostFeePercent) ? '' : feeStructure.hostFeePercent}
                step="0.1"
                onClick={() => {
                  setFeeStructure(state => ({ ...state, hostFeesStructure: HOST_FEE_STRUCTURE.CUSTOM_FEE }));
                }}
                onChange={e =>
                  setFeeStructure(() => ({
                    hostFeesStructure: HOST_FEE_STRUCTURE.CUSTOM_FEE,
                    hostFeePercent: parseFloat(e.target.value),
                  }))
                }
                onBlur={e =>
                  handleFeeStructureChange({
                    hostFeesStructure: HOST_FEE_STRUCTURE.CUSTOM_FEE,
                    hostFeePercent: clamp(round(parseFloat(e.target.value), 2), 0, 100),
                  })
                }
              />
            </div>
          </PopoverRadioWrapper>
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
};

const AdminsCanSeePayoutMethodsSwitch = ({ collective }: Partial<CollectiveDetailsProps>) => {
  const { toast } = useToast();
  const [submitSetPolicy, { loading }] = useMutation(
    gql`
      mutation UpdateCollectiveAdminsCanSeePayoutMethodPolicy($account: AccountReferenceInput!, $value: Boolean!) {
        setPolicies(account: $account, policies: { COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS: $value }) {
          id
          policies {
            id
            COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS
          }
        }
      }
    `,
    { context: API_V2_CONTEXT },
  );
  const handleUpdate = async value => {
    try {
      await submitSetPolicy({ variables: { account: { id: collective.id }, value } });
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Payout method policy updated" id="payoutMethodPolicyUpdated" />,
      });
    } catch (e) {
      toast({ variant: 'error', message: e.message });
    }
  };

  return (
    <Switch
      checked={Boolean(collective.policies.COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS)}
      disabled={loading}
      onCheckedChange={handleUpdate}
    />
  );
};

const editAccountSettingsMutation = gql`
  mutation EditAccountSettings($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const DISPLAYED_EXPENSE_TYPES = [EXPENSE_TYPE.INVOICE, EXPENSE_TYPE.RECEIPT, EXPENSE_TYPE.GRANT];

const ExpenseTypesPicker = ({ collective }: Partial<CollectiveDetailsProps>) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [expenseTypes, setExpenseTypes] = React.useState(() => collective.settings?.expenseTypes || {});
  const isUsingGlobalSetttings = isEmpty(expenseTypes);

  const [submitEditSettings, { loading, data }] = useMutation(editAccountSettingsMutation, { context: API_V2_CONTEXT });
  const handleUpdate = async value => {
    const previousState = cloneDeep(expenseTypes);
    const variables = {
      account: { slug: collective.slug },
      key: 'expenseTypes',
      value,
    };
    try {
      await submitEditSettings({ variables });
      toast({ variant: 'success', message: <FormattedMessage defaultMessage="Expense types updated" id="/ELnaY" /> });
    } catch (e) {
      setExpenseTypes(previousState);
      toast({ variant: 'error', message: e.message });
    }
  };
  useEffect(() => {
    if (
      !loading &&
      !isEqual(expenseTypes, data?.editAccountSetting?.settings || collective.settings?.expenseTypes || {})
    ) {
      handleUpdate(expenseTypes);
    }
  }, [expenseTypes, collective]);

  return (
    <Popover open={isOpen} onOpenChange={open => !loading && setOpen(open)}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {isUsingGlobalSetttings ? (
            <FormattedMessage defaultMessage="Use global settings" id="BXVJAo" />
          ) : (
            Object.keys(expenseTypes)
              .filter(expenseType => expenseTypes[expenseType])
              .map(expenseType => i18nExpenseType(intl, expenseType))
              .join(', ') || <FormattedMessage defaultMessage="Custom" id="Sjo1P4" />
          )}
          <ChevronDown className="ml-4 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <RadioGroup
          value={isUsingGlobalSetttings ? 'DEFAULT' : 'CUSTOM'}
          onValueChange={value => {
            setExpenseTypes(
              value === 'DEFAULT'
                ? {}
                : isEmpty(expenseTypes)
                  ? { [EXPENSE_TYPE.INVOICE]: true, [EXPENSE_TYPE.RECEIPT]: true }
                  : expenseTypes,
            );
          }}
          disabled={loading}
        >
          <PopoverRadioWrapper>
            <div className="flex items-center gap-2">
              <RadioGroupItem value={'DEFAULT'} />
              <label className="cursor-pointer text-sm font-medium" htmlFor={'DEFAULT'}>
                <FormattedMessage defaultMessage="Use global settings" id="BXVJAo" />
              </label>
            </div>
          </PopoverRadioWrapper>
          <PopoverRadioWrapper>
            <div className="flex items-center gap-2">
              <RadioGroupItem value={'CUSTOM'} />
              <label className="cursor-pointer text-sm font-medium" htmlFor={'CUSTOM'}>
                <FormattedMessage defaultMessage="Customize" id="TXpOBi" />
              </label>
            </div>
            <div className="ml-6 mt-1 flex flex-col gap-1 text-slate-700">
              {DISPLAYED_EXPENSE_TYPES.map(expenseType => (
                <div key={expenseType}>
                  <label className="flex items-center gap-2 text-sm font-normal">
                    <input
                      type="checkbox"
                      disabled={loading || isUsingGlobalSetttings}
                      checked={expenseTypes?.[expenseType]}
                      onChange={() => {
                        setExpenseTypes(state => ({ ...state, [expenseType]: !state[expenseType] }));
                      }}
                    />
                    {i18nExpenseType(intl, expenseType)}
                  </label>
                </div>
              ))}
            </div>
          </PopoverRadioWrapper>
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
};

const transactionsTableColumns = [
  {
    accessorKey: 'clearedAt',
    header: () => <FormattedMessage defaultMessage="Effective Date" id="Gh3Obs" />,
    cell: ({ cell, row }) => {
      const clearedAt = cell.getValue();
      if (!clearedAt) {
        return (
          <div className="whitespace-nowrap text-green-500">
            <DateTime dateStyle="medium" timeStyle="short" value={row.original.createdAt} />
          </div>
        );
      }
      return (
        <div className="whitespace-nowrap">
          <DateTime dateStyle="medium" timeStyle="short" value={clearedAt} />
        </div>
      );
    },
  },
  {
    accessorKey: 'oppositeAccount',
    header: () => <FormattedMessage defaultMessage="Recipient/Sender" id="YT2bNN" />,
    cell: ({ cell, row }) => {
      const account = cell.getValue();
      const transaction = row.original;
      return (
        <AccountHoverCard
          account={account}
          trigger={
            <div className="flex items-center gap-1 truncate">
              {transaction.type === 'CREDIT' ? (
                <ArrowLeft className="inline-block shrink-0 text-green-600" size={16} />
              ) : (
                <ArrowRight className="inline-block shrink-0" size={16} />
              )}
              <Avatar collective={account} radius={20} />
              <span className="truncate">{account?.name}</span>
            </div>
          }
        />
      );
    },
  },
  {
    accessorKey: 'kind',
    header: () => <FormattedMessage defaultMessage="Kind" id="Transaction.Kind" />,
    cell: ({ cell, table, row }) => {
      const { intl } = table.options.meta;
      const kind = cell.getValue();
      const kindLabel = i18nTransactionKind(intl, kind);
      const isExpense = kind === 'EXPENSE';
      const { isRefund, isRefunded, isInReview, isDisputed, expense, isOrderRejected } = row.original;

      return (
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate">{kindLabel}</span>
            {isExpense && expense?.type && <Badge size="xs">{i18nExpenseType(intl, expense.type)}</Badge>}
          </div>
          <div>
            {isRefunded && !isOrderRejected && (
              <Badge size="xs" type={'warning'} className="items-center gap-1">
                <Undo size={12} />
                <FormattedMessage defaultMessage="Refunded" id="Gs86nL" />
              </Badge>
            )}
            {isRefund && (
              <Badge size="xs" type={'success'} className="items-center gap-1">
                <FormattedMessage id="Refund" defaultMessage="Refund" />
              </Badge>
            )}
            {isDisputed && (
              <Badge size="xs" type={'error'} className="items-center gap-1">
                <AlertTriangle size={12} />
                <FormattedMessage defaultMessage="Disputed" id="X1pwhF" />
              </Badge>
            )}
            {isOrderRejected && isRefunded && (
              <Badge size="xs" type={'error'} className="items-center gap-1">
                <AlertTriangle size={12} />
                <FormattedMessage defaultMessage="Rejected" id="5qaD7s" />
              </Badge>
            )}
            {isInReview && (
              <Badge size="xs" type={'warning'} className="items-center gap-1">
                <AlertTriangle size={12} />
                <FormattedMessage id="order.in_review" defaultMessage="In Review" />
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'netAmount',
    header: () => <FormattedMessage defaultMessage="Amount" id="Fields.amount" />,
    cell: ({ cell, row }) => {
      const netAmount = cell.getValue();
      const transaction = row.original;

      return (
        <div
          className={clsx(
            'truncate font-semibold antialiased',
            transaction.type === 'CREDIT' ? 'text-green-600' : 'text-slate-700',
          )}
        >
          <FormattedMoneyAmount
            amount={netAmount.valueInCents}
            currency={netAmount.currency}
            precision={2}
            showCurrencyCode={false}
          />
        </div>
      );
    },
  },
];

const activitiesTableColumns = [
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
    cell: ({ cell }) => {
      return <DateTime value={cell.getValue()} dateStyle="medium" timeStyle="short" />;
    },
  },
  {
    accessorKey: 'individual',
    header: () => <FormattedMessage id="Tags.USER" defaultMessage="User" />,
    cell: ({ row }) => {
      const activity = row.original;
      return <ActivityUser activity={activity} />;
    },
  },
  {
    accessorKey: 'description',
    header: () => <FormattedMessage id="Fields.description" defaultMessage="Description" />,
    cell: ({ row }) => {
      const activity = row.original;
      return <ActivityDescription activity={activity} />;
    },
  },
];

const CollectiveDetails = ({
  collective: c,
  collectiveId,
  host,
  openCollectiveDetails,
  loading,
  onEdit,
}: CollectiveDetailsProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { account } = React.useContext(DashboardContext);
  const drawerActionsContainer = useDrawerActionsContainer();
  const { data, loading: loadingCollectiveInfo } = useQuery(hostedCollectiveDetailQuery, {
    variables: { id: collectiveId || c?.id },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  });
  const collective = data?.account || c;
  const activities = data?.activities?.nodes;
  const isHostedCollective = host && collective?.host?.id === host?.id;
  const isLoading = loading || loadingCollectiveInfo;
  const isChild = !!collective?.parent?.id;

  const children = groupBy(collective?.childrenAccounts?.nodes, 'type');
  const balance = collective?.stats?.balance;
  const consolidatedBalance = collective?.stats?.consolidatedBalance;
  const displayBalance =
    !isChild && balance?.valueInCents !== consolidatedBalance?.valueInCents ? (
      <React.Fragment>
        <FormattedMoneyAmount amount={balance?.valueInCents} currency={balance?.currency} />
        <span className="ml-2">
          (<FormattedMoneyAmount amount={consolidatedBalance?.valueInCents} currency={consolidatedBalance?.currency} />{' '}
          <FormattedMessage defaultMessage="total" id="total" />)
        </span>
      </React.Fragment>
    ) : (
      <FormattedMoneyAmount amount={balance?.valueInCents} currency={balance?.currency} />
    );
  return (
    <div>
      <H4 mb={32}>
        <FormattedMessage defaultMessage="Collective's overview" id="28uZ0u" />
      </H4>
      {isLoading ? (
        <React.Fragment>
          <SectionTitle>
            <LoadingPlaceholder height={48} width={312} />
          </SectionTitle>
          <InfoList className="sm:grid-cols-2">
            <InfoListItem
              title={<FormattedMessage id="HostedSince" defaultMessage="Hosted since" />}
              value={<LoadingPlaceholder height={24} width={256} />}
            />
            <InfoListItem
              title={<FormattedMessage id="Balance" defaultMessage="Balance" />}
              value={<LoadingPlaceholder height={24} width={256} />}
            />
            <InfoListItem
              title={<FormattedMessage defaultMessage="Fee Structure" id="CS88Lr" />}
              value={<LoadingPlaceholder height={24} width={256} />}
            />
            <InfoListItem
              title={<FormattedMessage defaultMessage="Expense Types" id="D+aS5Z" />}
              value={<LoadingPlaceholder height={24} width={256} />}
            />
            <InfoListItem
              className="sm:col-span-2"
              title={<FormattedMessage id="Team" defaultMessage="Team" />}
              value={<LoadingPlaceholder height={24} width={400} />}
            />
          </InfoList>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <SectionTitle>
            <Avatar collective={collective} radius={48} />
            <div>
              <div className="flex flex-row">
                <LinkCollective
                  collective={collective}
                  className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
                >
                  {collective.name}
                </LinkCollective>
                {collective.isFrozen && (
                  <Badge type="info" size="xs" className="ml-2">
                    <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
                  </Badge>
                )}
              </div>
              <div className="text-sm font-normal text-muted-foreground">
                <Badge size="xs" type="outline">
                  {formatCollectiveType(intl, collective.type)}
                </Badge>
                {collective.parent && (
                  <FormattedMessage
                    defaultMessage=" by {parentAccount}"
                    id="LGPYM7"
                    values={{
                      parentAccount: (
                        <LinkCollective collective={collective.parent} withHoverCard>
                          {collective.parent.name}
                        </LinkCollective>
                      ),
                    }}
                  />
                )}
              </div>
            </div>
          </SectionTitle>

          <InfoList className="flex flex-col sm:grid sm:grid-cols-2">
            <InfoListItem
              title={<FormattedMessage id="HostedSince" defaultMessage="Hosted since" />}
              value={
                collective.approvedAt ? (
                  <FormattedDate value={collective.approvedAt} day="numeric" month="long" year="numeric" />
                ) : (
                  <FormattedMessage defaultMessage="Not Hosted" id="OARQHL" />
                )
              }
            />
            <InfoListItem title={<FormattedMessage id="Balance" defaultMessage="Balance" />} value={displayBalance} />
            {isHostedCollective && (
              <React.Fragment>
                <InfoListItem
                  title={<FormattedMessage defaultMessage="Fee Structure" id="CS88Lr" />}
                  value={<HostFeeStructurePicker host={host} collective={collective} />}
                />
                <InfoListItem
                  title={<FormattedMessage defaultMessage="Expense Types" id="D+aS5Z" />}
                  value={<ExpenseTypesPicker host={host} collective={collective} />}
                />
                <div className="col-span-2 mb-8 flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-4">
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">
                      <FormattedMessage defaultMessage="Show payout method details" id="3P4Al8" />
                    </p>
                    <p className="mt-2 text-slate-700">
                      <FormattedMessage
                        defaultMessage="Allow Collective Admins to view sensitive payout method details of payees"
                        id="N+kkx3"
                      />
                    </p>
                  </div>
                  <AdminsCanSeePayoutMethodsSwitch collective={collective} />
                </div>
              </React.Fragment>
            )}
            <InfoListItem
              className="sm:col-span-2"
              title={<FormattedMessage id="Team" defaultMessage="Team" />}
              value={
                <div className="flex flex-wrap gap-4">
                  {collective.members?.nodes?.map(admin => (
                    <div className="flex items-center whitespace-nowrap" key={admin.id}>
                      <LinkCollective
                        collective={admin.account}
                        className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
                        withHoverCard
                        hoverCardProps={{ includeAdminMembership: { accountSlug: collective.slug } }}
                      >
                        <Avatar collective={admin.account} radius={24} /> {admin.account.name}
                      </LinkCollective>
                    </div>
                  ))}
                </div>
              }
            />
            {isHostedCollective && collective.hostAgreements?.totalCount > 0 && (
              <InfoListItem
                className="sm:col-span-2"
                title={<FormattedMessage id="Agreements" defaultMessage="Agreements" />}
                value={
                  <div className="flex gap-2">
                    {collective.hostAgreements.nodes.map(agreement => (
                      <button
                        key={agreement.id}
                        className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs"
                      >
                        <FileText size={14} />
                        {agreement.title}
                      </button>
                    ))}
                  </div>
                }
              />
            )}
            {[CollectiveType.PROJECT, CollectiveType.EVENT].map(
              type =>
                children[type] && (
                  <InfoListItem
                    key={type}
                    className="sm:col-span-2"
                    title={<span className="text-base">{formatCollectiveType(intl, type, children[type].length)}</span>}
                    value={
                      <DataTable
                        innerClassName="text-xs text-muted-foreground"
                        columns={[cols.childCollective, cols.fee, cols.hostedSince, cols.balance, cols.actions]}
                        data={children[type] || []}
                        mobileTableView
                        compact
                        meta={
                          {
                            intl,
                            onClickRow: row => openCollectiveDetails(row.original),
                            openCollectiveDetails,
                          } as HostedCollectivesDataTableMeta
                        }
                        onClickRow={row => openCollectiveDetails(row.original)}
                      />
                    }
                  />
                ),
            )}
            <InfoListItem
              className="sm:col-span-2"
              title={<FormattedMessage id="menu.transactions" defaultMessage="Transactions" />}
              value={
                <div className="flex flex-col gap-2">
                  <DataTable
                    innerClassName="text-xs text-muted-foreground"
                    columns={transactionsTableColumns}
                    data={collective.transactions?.nodes || []}
                    mobileTableView
                    compact
                    meta={{ intl }}
                  />

                  <Button
                    className="sm:self-end"
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      router.push(getDashboardRoute(account, `host-transactions?account=${collective.slug}`))
                    }
                  >
                    <FormattedMessage id="viewTransactions" defaultMessage="View Transactions" />
                  </Button>
                </div>
              }
            />
            <InfoListItem
              className="sm:col-span-2"
              title={<FormattedMessage id="Activities" defaultMessage="Activities" />}
              value={
                <div className="flex flex-col gap-2">
                  <DataTable
                    innerClassName="text-xs text-muted-foreground"
                    columns={activitiesTableColumns}
                    data={activities}
                    mobileTableView
                    compact
                    meta={{ intl }}
                  />
                  <Button
                    className="sm:self-end"
                    variant="outline"
                    size="xs"
                    onClick={() => router.push(getDashboardRoute(account, `activity-log?account=${collective.slug}`))}
                  >
                    <FormattedMessage id="viewActivities" defaultMessage="View Activities" />
                  </Button>
                </div>
              }
            />
          </InfoList>
          {drawerActionsContainer &&
            isHostedCollective &&
            createPortal(
              <div className="flex flex-grow justify-end gap-2">
                <MoreActionsMenu collective={collective} onEdit={onEdit}>
                  <Button className="rounded-full" variant="outline">
                    <FormattedMessage defaultMessage="More Actions" id="A7ugfn" />
                  </Button>
                </MoreActionsMenu>
              </div>,
              drawerActionsContainer,
            )}
        </React.Fragment>
      )}
    </div>
  );
};

export default CollectiveDetails;
