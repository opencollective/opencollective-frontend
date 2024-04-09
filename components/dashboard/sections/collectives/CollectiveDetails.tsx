import React, { useEffect, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { PopoverTrigger } from '@radix-ui/react-popover';
import { clamp, cloneDeep, groupBy, isEmpty, isEqual, isNaN, round } from 'lodash';
import { ChevronDown, FileText } from 'lucide-react';
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
import { elementFromClass } from '../../../../lib/react-utils';

import Avatar from '../../../Avatar';
import { DataTable } from '../../../DataTable';
import { useDrawerActionsContainer } from '../../../Drawer';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import { H4 } from '../../../Text';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { InfoList, InfoListItem } from '../../../ui/InfoList';
import { InputGroup } from '../../../ui/Input';
import { Popover, PopoverContent } from '../../../ui/Popover';
import { RadioGroup, RadioGroupItem } from '../../../ui/RadioGroup';
import { useToast } from '../../../ui/useToast';

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
  host: HostedCollectivesQuery['host'];
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
      toast({ variant: 'success', message: <FormattedMessage defaultMessage="Fee structure updated" /> });
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
              <FormattedMessage defaultMessage="Use the global fee in your settings." />
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
      toast({ variant: 'success', message: <FormattedMessage defaultMessage="Expense types updated" /> });
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
            <FormattedMessage defaultMessage="Use global settings" />
          ) : (
            Object.keys(expenseTypes)
              .filter(expenseType => expenseTypes[expenseType])
              .map(expenseType => i18nExpenseType(intl, expenseType))
              .join(', ') || <FormattedMessage defaultMessage="Custom" />
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
                <FormattedMessage defaultMessage="Use global settings" />
              </label>
            </div>
          </PopoverRadioWrapper>
          <PopoverRadioWrapper>
            <div className="flex items-center gap-2">
              <RadioGroupItem value={'CUSTOM'} />
              <label className="cursor-pointer text-sm font-medium" htmlFor={'CUSTOM'}>
                <FormattedMessage defaultMessage="Customize" />
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

const CollectiveDetails = ({
  collective: c,
  collectiveId,
  host,
  openCollectiveDetails,
  loading,
  onEdit,
}: CollectiveDetailsProps) => {
  const intl = useIntl();
  const drawerActionsContainer = useDrawerActionsContainer();
  const { data, loading: loadingCollectiveInfo } = useQuery(hostedCollectiveDetailQuery, {
    variables: { id: collectiveId },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
    skip: Boolean(c),
  });
  const collective = c || data?.account;
  const isHostedCollective = collective?.host?.id === host?.id;
  const isLoading = loading || loadingCollectiveInfo;

  const children = groupBy(collective?.childrenAccounts?.nodes, 'type');
  return (
    <div>
      <H4 mb={32}>
        <FormattedMessage defaultMessage="Collective's overview" />
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
              title={<FormattedMessage defaultMessage="Fee Structure" />}
              value={<LoadingPlaceholder height={24} width={256} />}
            />
            <InfoListItem
              title={<FormattedMessage defaultMessage="Expense Types" />}
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
              <LinkCollective
                collective={collective}
                className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
              >
                {collective.name}
              </LinkCollective>
              {collective.parent && (
                <div className="text-sm font-normal text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="{childAccountType} by {parentAccount}"
                    values={{
                      childAccountType: (
                        <Badge size="xs" type="outline">
                          {formatCollectiveType(intl, collective.type)}
                        </Badge>
                      ),
                      parentAccount: (
                        <LinkCollective collective={collective.parent} withHoverCard>
                          {collective.parent.name}
                        </LinkCollective>
                      ),
                    }}
                  />
                </div>
              )}
            </div>
          </SectionTitle>

          <InfoList className="sm:grid-cols-2">
            <InfoListItem
              title={<FormattedMessage id="HostedSince" defaultMessage="Hosted since" />}
              value={
                collective.approvedAt ? (
                  <FormattedDate value={collective.approvedAt} day="numeric" month="long" year="numeric" />
                ) : (
                  <FormattedMessage defaultMessage="Not Hosted" />
                )
              }
            />
            <InfoListItem
              title={<FormattedMessage id="Balance" defaultMessage="Balance" />}
              value={
                <FormattedMoneyAmount
                  amount={collective.stats.balance.valueInCents}
                  currency={collective.stats.balance.currency}
                  showCurrencyCode={false}
                  amountStyles={{}}
                />
              }
            />
            {isHostedCollective && (
              <React.Fragment>
                <InfoListItem
                  title={<FormattedMessage defaultMessage="Fee Structure" />}
                  value={<HostFeeStructurePicker host={host} collective={collective} />}
                />
                <InfoListItem
                  title={<FormattedMessage defaultMessage="Expense Types" />}
                  value={<ExpenseTypesPicker host={host} collective={collective} />}
                />
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
                        meta={{ intl, openCollectiveDetails }}
                        onClickRow={row => openCollectiveDetails(row.original)}
                        className="border-none"
                      />
                    }
                  />
                ),
            )}
          </InfoList>
          {drawerActionsContainer &&
            isHostedCollective &&
            createPortal(
              <div className="flex flex-grow justify-end gap-2">
                <MoreActionsMenu collective={collective} onEdit={onEdit}>
                  <Button className="rounded-full" variant="outline">
                    <FormattedMessage defaultMessage="More Actions" />
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
