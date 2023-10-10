import React from 'react';
import { flatten, isEmpty, omit } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { simpleDateToISOString } from '../lib/date-utils';
import type { Account } from '../lib/graphql/types/v2/graphql';
import { useAsyncCall } from '../lib/hooks/useAsyncCall';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';

import { PeriodFilterForm } from './filters/PeriodFilter';
import { Box, Flex, Grid } from './Grid';
import MessageBox from './MessageBox';
import { getSelectedPeriodOptionFromInterval, PERIOD_FILTER_PRESETS } from './PeriodFilterPresetsSelect';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import StyledHr from './StyledHr';
import StyledInputField from './StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import StyledSelect from './StyledSelect';
import { Span } from './Text';

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
  onClose: () => void;
  dateFrom?: string;
  dateTo?: string;
  dateInterval?: { from?: string; to?: string; timezoneType?: string };
  collective: Account;
  host?: Account;
  accounts?: Account[];
  filters?: Record<string, string>;
};

const ExportTransactionsCSVModal = ({
  onClose,
  collective,
  dateInterval,
  host,
  accounts,
  filters,
  ...props
}: ExportTransactionsCSVModalProps) => {
  const isHostReport = Boolean(host);

  const intl = useIntl();
  const [tmpDateInterval, setTmpDateInterval] = React.useState(dateInterval || { to: null, from: null });
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>('#');
  const [fieldOption, setFieldOption] = React.useState(FieldOptions[0].value);
  const [fields, setFields] = React.useState(DEFAULT_FIELDS.reduce((obj, key) => ({ ...obj, [key]: true }), {}));
  const [isValidDateInterval, setIsValidDateInterval] = React.useState(true);
  const datePresetSelectedOption = React.useMemo(
    () => getSelectedPeriodOptionFromInterval(tmpDateInterval as any),
    [tmpDateInterval],
  );
  const datePresetOptions = React.useMemo(() => {
    return Object.keys(PERIOD_FILTER_PRESETS).map(presetKey => ({
      value: presetKey,
      label: PERIOD_FILTER_PRESETS[presetKey].label,
    }));
  }, [intl]);
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
    const { from, to, timezoneType } = tmpDateInterval;

    const url = isHostReport
      ? new URL(`${process.env.REST_URL}/v2/${host.slug}/hostTransactions.csv`)
      : new URL(`${process.env.REST_URL}/v2/${collective.slug}/transactions.csv`);

    url.searchParams.set('fetchAll', '1');

    if (isHostReport) {
      if (accounts?.length) {
        url.searchParams.set('account', accounts.map(a => a.slug).join(','));
      }
    } else {
      if (!filters?.ignoreGiftCardsTransactions) {
        url.searchParams.set('includeGiftCardTransactions', '1');
      }
      if (!filters?.ignoreIncognitoTransactions) {
        url.searchParams.set('includeIncognitoTransactions', '1');
      }
      if (!filters?.ignoreChildrenTransactions) {
        url.searchParams.set('includeChildrenTransactions', '1');
      }
      for (const key in omit(filters, [
        'ignoreGiftCardsTransactions',
        'ignoreIncognitoTransactions',
        'ignoreChildrenTransactions',
      ])) {
        url.searchParams.set(key, filters[key]);
      }
    }
    if (from) {
      url.searchParams.set('dateFrom', simpleDateToISOString(from, false, timezoneType));
    }
    if (to) {
      url.searchParams.set('dateTo', simpleDateToISOString(to, true, timezoneType));
    }
    if (!isEmpty(fields)) {
      url.searchParams.set('fields', Object.keys(fields).join(','));
    }
    return url.toString();
  };

  React.useEffect(() => {
    fetchRows();
  }, [tmpDateInterval, collective, host, accounts]);

  React.useEffect(() => {
    const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (typeof document !== 'undefined' && accessToken) {
      document.cookie =
        env === 'development' || env === 'e2e'
          ? `authorization="Bearer ${accessToken}";path=/;SameSite=strict;max-age=120`
          : // It is not possible to use HttpOnly when setting from JavaScript.
            // I'm enforcing SameSitre and Domain in production to prevent CSRF.
            `authorization="Bearer ${accessToken}";path=/;SameSite=strict;max-age=120;domain=opencollective.com;secure`;
    }
    setDownloadUrl(getUrl());
  }, [fields, tmpDateInterval]);

  const expectedTimeInMinutes = Math.round((exportedRows * 1.1) / AVERAGE_TRANSACTIONS_PER_MINUTE);
  const disabled = !isValidDateInterval || exportedRows > 100e3;

  return (
    <StyledModal onClose={onClose} width="100%" maxWidth="576px" {...props}>
      <ModalHeader>
        <FormattedMessage id="ExportTransactionsCSVModal.Title" defaultMessage="Export Transactions" />
      </ModalHeader>
      <ModalBody>
        {isHostReport && accounts?.length && (
          <MessageBox type="warning" withIcon mt={3}>
            <FormattedMessage
              id="ExportTransactionsCSVModal.FilteredCollectivesWarning"
              defaultMessage="This report is affected by the collective filter and will include all transactions from the following accounts: {accounts}"
              values={{
                accounts: accounts.map(a => a.slug).join(', '),
              }}
            />
          </MessageBox>
        )}
        {!isEmpty(filters) && (
          <MessageBox type="warning" withIcon mt={3}>
            <FormattedMessage
              id="ExportTransactionsCSVModal.FiltersWarning"
              defaultMessage="This report is affected by the filters set on the transactions page."
            />
          </MessageBox>
        )}
        <Grid mt={3} gridGap={2} gridTemplateColumns={`1fr 1fr`} display={['block', 'grid']}>
          <Box>
            <StyledInputField
              label={<FormattedMessage defaultMessage="Date range" />}
              labelFontWeight="700"
              labelProps={{ fontWeight: 'bold', fontSize: '16px' }}
              name="datePresets"
              mt={1}
            >
              {inputProps => (
                <StyledSelect
                  {...inputProps}
                  options={datePresetOptions}
                  onChange={({ value }) => setTmpDateInterval(PERIOD_FILTER_PRESETS[value].getInterval())}
                  value={datePresetSelectedOption}
                  width="100%"
                />
              )}
            </StyledInputField>
          </Box>
          <Box display={['none', 'block']}></Box>
          <Box display={['none', 'block']} gridRow="2" gridColumn="2"></Box>
          <PeriodFilterForm
            onChange={setTmpDateInterval}
            onValidate={setIsValidDateInterval}
            value={tmpDateInterval}
            inputId="daterange"
            omitPresets
          />
          <StyledInputField
            label={<FormattedMessage defaultMessage="Exported Fields" />}
            labelFontWeight="700"
            labelProps={{ fontWeight: 'bold', fontSize: '16px' }}
            name="fieldOptions"
            mt={3}
            gridColumn="1 / span 2"
          >
            {inputProps => (
              <StyledSelect
                {...inputProps}
                options={FieldOptions}
                onChange={handleFieldOptionsChange}
                defaultValue={FieldOptions.find(option => option.value === fieldOption)}
                width="100%"
              />
            )}
          </StyledInputField>
        </Grid>
        {fieldOption === FIELD_OPTIONS.DEFAULT && (
          <MessageBox type="info" mt={3}>
            {flatten(
              DEFAULT_FIELDS.map((field, i) => [
                FieldLabels[field] || field,
                i < DEFAULT_FIELDS.length - 1 ? ', ' : '.',
              ]),
            )}
          </MessageBox>
        )}
        {fieldOption === FIELD_OPTIONS.CUSTOM &&
          Object.keys(FIELD_GROUPS).map(group => {
            const isSelected = FIELD_GROUPS[group].every(f => fields[f]);
            return (
              <Box key={group}>
                <Flex mt={3} alignItems="center">
                  <Span fontWeight={700} fontSize="16px" lineHeight="24px">
                    {FieldGroupLabels[group] || group}
                  </Span>
                  <StyledHr borderColor="black.300" mx={2} flex="1" />
                  <StyledButton
                    buttonSize="tiny"
                    onClick={() => handleGroupSwitch({ name: group, checked: !isSelected })}
                  >
                    {isSelected ? (
                      <FormattedMessage id="ExportTransactionsCSVModal.UnselectAll" defaultMessage="Unselect all" />
                    ) : (
                      <FormattedMessage id="ExportTransactionsCSVModal.SelectAll" defaultMessage="Select all" />
                    )}
                  </StyledButton>
                </Flex>

                <Grid mt={1} gridGap={1} gridTemplateColumns={['1fr', '1fr 1fr']}>
                  {FIELD_GROUPS[group]
                    .filter(field => !(isHostReport && HOST_OMITTED_FIELDS.includes(field)))
                    .map(field => (
                      <StyledCheckbox
                        key={field}
                        name={field}
                        onChange={handleFieldSwitch}
                        checked={fields[field] === true}
                        label={FieldLabels[field] || field}
                      />
                    ))}
                </Grid>
              </Box>
            );
          })}
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
      </ModalBody>
      <ModalFooter showDivider={false}>
        <Flex justifyContent="flex-end" width="100%">
          <StyledButton
            buttonSize="small"
            buttonStyle="primary"
            as={disabled || isFetchingRows ? undefined : 'a'}
            loading={isFetchingRows}
            href={disabled ? undefined : downloadUrl}
            disabled={disabled}
          >
            <FormattedMessage defaultMessage="Export CSV" />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

export default ExportTransactionsCSVModal;
