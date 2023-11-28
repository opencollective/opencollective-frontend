import React from 'react';
import { flatten, isEmpty, omit } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { HostReportsPageQueryVariables, TransactionsPageQueryVariables } from '../../lib/graphql/types/v2/graphql';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';

import MessageBox from '../MessageBox';
import StyledInputField from '../StyledInputField';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Collapsible, CollapsibleContent } from '../ui/Collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Separator } from '../ui/Separator';

import { Filterbar } from './filters/Filterbar';

const AVERAGE_TRANSACTIONS_PER_MINUTE = 8240;
// Fields that are not available when exporting transactions from the host dashboard
const HOST_OMITTED_FIELDS = ['balance', 'hostSlug', 'hostName', 'hostType'];

type CSVField =
  | 'date'
  | 'datetime'
  | 'id'
  | 'legacyId'
  | 'shortId'
  | 'shortGroup'
  | 'group'
  | 'description'
  | 'type'
  | 'kind'
  | 'isRefund'
  | 'isRefunded'
  | 'refundId'
  | 'shortRefundId'
  | 'displayAmount'
  | 'amount'
  | 'paymentProcessorFee'
  | 'platformFee'
  | 'hostFee'
  | 'netAmount'
  | 'balance'
  | 'currency'
  | 'accountSlug'
  | 'accountName'
  | 'accountType'
  | 'accountEmail'
  | 'oppositeAccountSlug'
  | 'oppositeAccountName'
  | 'oppositeAccountType'
  | 'oppositeAccountEmail'
  | 'hostSlug'
  | 'hostName'
  | 'hostType'
  | 'orderId'
  | 'orderLegacyId'
  | 'orderFrequency'
  | 'orderProcessedDate'
  | 'orderCustomData'
  | 'paymentMethodService'
  | 'paymentMethodType'
  | 'expenseId'
  | 'expenseLegacyId'
  | 'expenseType'
  | 'expenseTags'
  | 'payoutMethodType'
  | 'merchantId'
  | 'orderMemo'
  | 'taxAmount'
  | 'taxType'
  | 'taxRate'
  | 'taxIdNumber';

const FIELD_GROUPS: Record<string, readonly CSVField[]> = {
  transaction: [
    'date',
    'datetime',
    'id',
    'legacyId',
    'shortId',
    'shortGroup',
    'group',
    'description',
    'type',
    'kind',
    'isRefund',
    'isRefunded',
    'refundId',
    'shortRefundId',
    'displayAmount',
    'amount',
    'paymentProcessorFee',
    'netAmount',
    'balance',
    'currency',
  ],
  accounts: [
    'accountSlug',
    'accountName',
    'accountType',
    'accountEmail',
    'oppositeAccountSlug',
    'oppositeAccountName',
    'oppositeAccountType',
    'oppositeAccountEmail',
    'hostSlug',
    'hostName',
    'hostType',
  ],
  order: [
    'orderId',
    'orderLegacyId',
    'orderMemo',
    'orderFrequency',
    'orderProcessedDate',
    'orderCustomData',
    'paymentMethodService',
    'paymentMethodType',
  ],
  expense: ['expenseId', 'expenseLegacyId', 'expenseType', 'expenseTags', 'payoutMethodType', 'merchantId'],
  tax: ['taxAmount', 'taxType', 'taxRate', 'taxIdNumber'],
  legacy: ['platformFee', 'hostFee'],
};

const FieldGroupLabels: Record<keyof typeof FIELD_GROUPS, React.ReactNode> = {
  transaction: <FormattedMessage defaultMessage="Transaction" />,
  accounts: <FormattedMessage defaultMessage="Account" />,
  order: <FormattedMessage defaultMessage="Contribution" />,
  expense: <FormattedMessage id="Expense" defaultMessage="Expense" />,
  tax: <FormattedMessage defaultMessage="Tax" />,
  legacy: <FormattedMessage id="Legacy/Deprecated" defaultMessage="Legacy/Deprecated" />,
};

const DEFAULT_FIELDS = [
  'datetime',
  'shortId',
  'shortGroup',
  'description',
  'type',
  'kind',
  'isRefund',
  'isRefunded',
  'shortRefundId',
  'displayAmount',
  'amount',
  'paymentProcessorFee',
  'netAmount',
  'balance',
  'currency',
  'accountSlug',
  'accountName',
  'oppositeAccountSlug',
  'oppositeAccountName',
  // Payment Method (for orders)
  'paymentMethodService',
  'paymentMethodType',
  // Type and Payout Method (for expenses)
  'expenseType',
  'expenseTags',
  'payoutMethodType',
  // Extra fields
  'merchantId',
  'orderMemo',
];

const FieldLabels: Record<CSVField, React.ReactNode> = {
  date: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
  datetime: <FormattedMessage defaultMessage="Date & Time" />,
  id: <FormattedMessage defaultMessage="Transaction ID" />,
  legacyId: <FormattedMessage defaultMessage="Legacy Transaction ID" />,
  shortId: <FormattedMessage defaultMessage="Short Transaction ID" />,
  shortGroup: <FormattedMessage defaultMessage="Short Group ID" />,
  group: <FormattedMessage defaultMessage="Group ID" />,
  description: <FormattedMessage id="Fields.description" defaultMessage="Description" />,
  type: <FormattedMessage id="transactions.type" defaultMessage="Type" />,
  kind: <FormattedMessage id="Transaction.Kind" defaultMessage="Kind" />,
  isRefund: <FormattedMessage defaultMessage="Is Refund" />,
  isRefunded: <FormattedMessage defaultMessage="Is Refunded" />,
  refundId: <FormattedMessage defaultMessage="Refund ID" />,
  shortRefundId: <FormattedMessage defaultMessage="Short Refund ID" />,
  displayAmount: <FormattedMessage defaultMessage="Display Amount" />,
  amount: <FormattedMessage id="Fields.amount" defaultMessage="Amount" />,
  paymentProcessorFee: <FormattedMessage defaultMessage="Payment Processor Fee" />,
  platformFee: <FormattedMessage defaultMessage="Platform Fee" />,
  hostFee: <FormattedMessage defaultMessage="Host Fee" />,
  netAmount: <FormattedMessage defaultMessage="Net Amount" />,
  balance: <FormattedMessage id="Balance" defaultMessage="Balance" />,
  currency: <FormattedMessage id="Currency" defaultMessage="Currency" />,
  accountSlug: <FormattedMessage defaultMessage="Account Handle" />,
  accountName: <FormattedMessage defaultMessage="Account Name" />,
  accountType: <FormattedMessage defaultMessage="Account Type" />,
  accountEmail: <FormattedMessage defaultMessage="Account Email" />,
  oppositeAccountSlug: <FormattedMessage defaultMessage="Opposite Account Handle" />,
  oppositeAccountName: <FormattedMessage defaultMessage="Opposite Account Name" />,
  oppositeAccountType: <FormattedMessage defaultMessage="Opposite Account Type" />,
  oppositeAccountEmail: <FormattedMessage defaultMessage="Opposite Account Email" />,
  hostSlug: <FormattedMessage defaultMessage="Host Handle" />,
  hostName: <FormattedMessage defaultMessage="Host Name" />,
  hostType: <FormattedMessage defaultMessage="Host Type" />,
  orderId: <FormattedMessage defaultMessage="Contribution ID" />,
  orderLegacyId: <FormattedMessage defaultMessage="Legacy Contribution ID" />,
  orderFrequency: <FormattedMessage defaultMessage="Contribution Frequency" />,
  orderMemo: <FormattedMessage defaultMessage="Contribution Memo" />,
  orderProcessedDate: <FormattedMessage defaultMessage="Contribution Processed Date" />,
  orderCustomData: <FormattedMessage defaultMessage="Contribution Custom Data" />,
  paymentMethodService: <FormattedMessage defaultMessage="Payment Method Service" />,
  paymentMethodType: <FormattedMessage defaultMessage="Payment Method Type" />,
  expenseId: <FormattedMessage defaultMessage="Expense ID" />,
  expenseLegacyId: <FormattedMessage defaultMessage="Legacy Expense ID" />,
  expenseType: <FormattedMessage defaultMessage="Expense Type" />,
  expenseTags: <FormattedMessage defaultMessage="Expense Tags" />,
  payoutMethodType: <FormattedMessage defaultMessage="Payout Method Type" />,
  merchantId: <FormattedMessage defaultMessage="Merchant ID" />,
  taxAmount: <FormattedMessage defaultMessage="Tax Amount" />,
  taxType: <FormattedMessage defaultMessage="Tax Type" />,
  taxRate: <FormattedMessage defaultMessage="Tax Rate" />,
  taxIdNumber: <FormattedMessage defaultMessage="Tax ID Number" />,
};

enum FIELD_OPTIONS {
  DEFAULT = 'DEFAULT',
  CUSTOM = 'CUSTOM',
}

const FieldOptionsLabels = {
  [FIELD_OPTIONS.DEFAULT]: <FormattedMessage defaultMessage="Default" />,
  [FIELD_OPTIONS.CUSTOM]: <FormattedMessage defaultMessage="Custom" />,
};

const FieldOptions = Object.keys(FIELD_OPTIONS).map(value => ({ value, label: FieldOptionsLabels[value] }));
const env = process.env.OC_ENV;

type ExportTransactionsCSVModalProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  queryFilter: useQueryFilterReturnType<any, TransactionsPageQueryVariables | HostReportsPageQueryVariables>;
  accountSlug?: string;
  hostSlug?: string;
  trigger: React.ReactNode;
};

const ExportTransactionsCSVModal = ({
  open,
  setOpen,
  accountSlug,
  hostSlug,
  trigger,
  queryFilter,
}: ExportTransactionsCSVModalProps) => {
  const isHostReport = Boolean(hostSlug);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>('#');
  const [fieldOption, setFieldOption] = React.useState(FieldOptions[0].value);
  const [fields, setFields] = React.useState(DEFAULT_FIELDS.reduce((obj, key) => ({ ...obj, [key]: true }), {}));

  const {
    loading: isFetchingRows,
    call: fetchRows,
    data: exportedRows,
  } = useAsyncCall(
    async () => {
      const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        const url = getUrl();
        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const rows = parseInt(response.headers.get('x-exported-rows'), 10);
        return rows;
      }
    },
    { defaultData: 0 },
  );

  const handleFieldOptionsChange = ({ value }) => {
    setFieldOption(value);
    if (value === FIELD_OPTIONS.DEFAULT) {
      setFields(DEFAULT_FIELDS.reduce((obj, key) => ({ ...obj, [key]: true }), {}));
    }
  };

  const handleFieldSwitch = ({ name, checked }) => {
    if (checked) {
      setFields({ ...fields, [name]: true });
    } else {
      setFields(omit(fields, [name]));
    }
  };

  const handleGroupSwitch = ({ name, checked }) => {
    if (checked) {
      setFields({ ...fields, ...FIELD_GROUPS[name].reduce((obj, key) => ({ ...obj, [key]: true }), {}) });
    } else {
      setFields(omit(fields, FIELD_GROUPS[name]));
    }
  };

  const getUrl = () => {
    const url = isHostReport
      ? new URL(`${process.env.REST_URL}/v2/${hostSlug}/hostTransactions.csv`)
      : new URL(`${process.env.REST_URL}/v2/${accountSlug}/transactions.csv`);

    url.searchParams.set('fetchAll', '1');

    if (isHostReport) {
      if (queryFilter.values.account) {
        url.searchParams.set('account', queryFilter.values.account);
      }
    } else {
      url.searchParams.set('includeGiftCardTransactions', '1');
      url.searchParams.set('includeIncognitoTransactions', '1');
      url.searchParams.set('includeChildrenTransactions', '1');

      if (queryFilter.values.kind) {
        url.searchParams.set('kind', queryFilter.values.kind.join(','));
      }

      if (queryFilter.values.amount) {
        const toAmountStr = ({ gte, lte }) => (lte ? `${gte}-${lte}` : `${gte}+`);
        url.searchParams.set('amount', toAmountStr(queryFilter.values.amount));
      }

      if (queryFilter.values.paymentMethodType) {
        url.searchParams.set('paymentMethodType', queryFilter.values.paymentMethodType.join(','));
      }

      if (queryFilter.values.type) {
        url.searchParams.set('type', queryFilter.values.type);
      }

      if (queryFilter.values.searchTerm) {
        url.searchParams.set('searchTerm', queryFilter.values.searchTerm);
      }
    }
    if (queryFilter.values.date) {
      if (queryFilter.variables.dateFrom) {
        url.searchParams.set('dateFrom', queryFilter.variables.dateFrom);
      }
      if (queryFilter.variables.dateTo) {
        url.searchParams.set('dateTo', queryFilter.variables.dateTo);
      }
    }

    if (!isEmpty(fields)) {
      url.searchParams.set('fields', Object.keys(fields).join(','));
    }

    return url.toString();
  };

  React.useEffect(() => {
    if (open) {
      fetchRows();
    }
  }, [queryFilter.values, accountSlug, hostSlug, open]);

  React.useEffect(() => {
    const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (typeof document !== 'undefined' && accessToken) {
      document.cookie =
        env === 'development' || env === 'e2e'
          ? `authorization="Bearer ${accessToken}";path=/;SameSite=strict;max-age=120`
          : // It is not possible to use HttpOnly when setting from JavaScript.
            // I'm enforcing SameSite and Domain in production to prevent CSRF.
            `authorization="Bearer ${accessToken}";path=/;SameSite=strict;max-age=120;domain=opencollective.com;secure`;
    }
    setDownloadUrl(getUrl());
  }, [fields, queryFilter.values, accountSlug, hostSlug]);

  const expectedTimeInMinutes = Math.round((exportedRows * 1.1) / AVERAGE_TRANSACTIONS_PER_MINUTE);
  const disabled = exportedRows > 100e3 || isFetchingRows;
  const url = disabled ? '#' : downloadUrl;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage id="ExportTransactionsCSVModal.Title" defaultMessage="Export Transactions" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage
              id="ExportTransactionsCSVModal.FiltersWarning"
              defaultMessage="This report is affected by the filters set on the transactions page."
            />
          </DialogDescription>
        </DialogHeader>
        <div>
          <p className="mb-2 font-medium">
            <FormattedMessage defaultMessage="Filters" />
          </p>
          <Filterbar {...queryFilter} filters={omit(queryFilter.filters, 'orderBy')} views={null} hideSeparator />
        </div>

        <StyledInputField
          label={<FormattedMessage defaultMessage="Exported Fields" />}
          labelFontWeight="500"
          labelProps={{ fontSize: '16px', letterSpacing: '0px' }}
          name="fieldOptions"
        >
          {inputProps => {
            return (
              <Select
                onValueChange={value => handleFieldOptionsChange({ value })}
                defaultValue={FieldOptions.find(option => option.value === fieldOption).value}
                {...inputProps}
              >
                <SelectTrigger className="">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FieldOptions.map(option => (
                    <SelectItem value={option.value} key={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }}
        </StyledInputField>

        <div>
          <Collapsible open={fieldOption === FIELD_OPTIONS.DEFAULT}>
            <CollapsibleContent>
              <MessageBox type="info" mt={3}>
                {flatten(
                  DEFAULT_FIELDS.map((field, i) => [
                    FieldLabels[field] || field,
                    i < DEFAULT_FIELDS.length - 1 ? ', ' : '.',
                  ]),
                )}
              </MessageBox>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible open={fieldOption === FIELD_OPTIONS.CUSTOM}>
            <CollapsibleContent>
              <div className="flex flex-col gap-6">
                {Object.keys(FIELD_GROUPS).map(group => {
                  const isSelected = FIELD_GROUPS[group].every(f => fields[f]);
                  return (
                    <div key={group}>
                      <div className="flex items-center">
                        <span className="font-medium">{FieldGroupLabels[group] || group}</span>
                        <Separator className="mx-2 flex-1" />
                        <Button
                          variant="outline"
                          size="xs"
                          className="rounded-full"
                          onClick={() => handleGroupSwitch({ name: group, checked: !isSelected })}
                        >
                          {isSelected ? (
                            <FormattedMessage
                              id="ExportTransactionsCSVModal.UnselectAll"
                              defaultMessage="Unselect all"
                            />
                          ) : (
                            <FormattedMessage id="ExportTransactionsCSVModal.SelectAll" defaultMessage="Select all" />
                          )}
                        </Button>
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {FIELD_GROUPS[group]
                          .filter(field => !(isHostReport && HOST_OMITTED_FIELDS.includes(field)))
                          .map(field => (
                            <div key={field} className="flex items-center space-x-2">
                              <Checkbox
                                id={field}
                                checked={fields[field] === true}
                                onCheckedChange={checked => handleFieldSwitch({ name: field, checked })}
                              />
                              <label
                                htmlFor={field}
                                className="cursor-pointer text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {FieldLabels[field] || field}
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {exportedRows > 100e3 ? (
          <MessageBox type="error" withIcon mt={3}>
            <FormattedMessage
              id="ExportTransactionsCSVModal.RowsWarning"
              defaultMessage="Sorry, the requested file is would take too long to be exported. Row count ({rows}) above limit."
              values={{ rows: exportedRows }}
            />
          </MessageBox>
        ) : exportedRows > 10e3 ? (
          <MessageBox type="info" withIcon mt={3}>
            <FormattedMessage
              id="ExportTransactionsCSVModal.ExportTimeWarning"
              defaultMessage="We're exporting {rows} {rows, plural, one {row} other {rows}}, this can take up to {expectedTimeInMinutes} {expectedTimeInMinutes, plural, one {minute} other {minutes}}."
              values={{
                rows: exportedRows,
                expectedTimeInMinutes,
              }}
            />
          </MessageBox>
        ) : null}
        <DialogFooter>
          <Button asChild loading={isFetchingRows} disabled={disabled}>
            <a href={url} rel="noreferrer" target="_blank">
              <FormattedMessage defaultMessage="Export CSV" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportTransactionsCSVModal;
