import React from 'react';
import dayjs from 'dayjs';
import { flatten, isEmpty, omit } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { fetchCSVFileFromRESTService } from '../lib/api';
import { formatErrorMessage } from '../lib/errors';
import type { Account } from '../lib/graphql/types/v2/graphql';
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
import { TOAST_TYPE, useToasts } from './ToastProvider';

const AVERAGE_TRANSACTIONS_PER_MINUTE = 8240;

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
  | 'paymentMethodService'
  | 'paymentMethodType'
  | 'expenseId'
  | 'expenseLegacyId'
  | 'expenseType'
  | 'expenseTags'
  | 'payoutMethodType'
  | 'merchantId'
  | 'orderMemo';

const FIELD_GROUPS: Record<string, CSVField[]> = {
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
    'paymentMethodService',
    'paymentMethodType',
  ],
  expense: ['expenseId', 'expenseLegacyId', 'expenseType', 'expenseTags', 'payoutMethodType', 'merchantId'],
  legacy: ['platformFee', 'hostFee'],
};

const FieldGroupLabels: Record<keyof typeof FIELD_GROUPS, any> = {
  transaction: <FormattedMessage defaultMessage="Transaction" />,
  accounts: <FormattedMessage defaultMessage="Accounts" />,
  order: <FormattedMessage defaultMessage="Order" />,
  expense: <FormattedMessage id="Expense" defaultMessage="Expense" />,
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

const FieldLabels = {
  date: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
  datetime: <FormattedMessage defaultMessage="Date & Time" />,
  id: <FormattedMessage defaultMessage="Transaction ID" />,
  legacyId: <FormattedMessage defaultMessage="Legacy Transaction ID" />,
  shortId: <FormattedMessage defaultMessage="Short Transaction ID" />,
  shortGroup: <FormattedMessage defaultMessage="Short Group ID" />,
  group: <FormattedMessage defaultMessage="Group ID" />,
  description: <FormattedMessage id="Fields.description" defaultMessage="Description" />,
  type: <FormattedMessage defaultMessage="Type" />,
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
  accountSlug: <FormattedMessage defaultMessage="Account Slug" />,
  accountName: <FormattedMessage defaultMessage="Account Name" />,
  accountType: <FormattedMessage defaultMessage="Account Type" />,
  accountEmail: <FormattedMessage defaultMessage="Account Email" />,
  oppositeAccountSlug: <FormattedMessage defaultMessage="Opposite Account Slug" />,
  oppositeAccountName: <FormattedMessage defaultMessage="Opposite Account Name" />,
  oppositeAccountType: <FormattedMessage defaultMessage="Opposite Account Type" />,
  oppositeAccountEmail: <FormattedMessage defaultMessage="Opposite Account Email" />,
  hostSlug: <FormattedMessage defaultMessage="Host Slug" />,
  hostName: <FormattedMessage defaultMessage="Host Name" />,
  hostType: <FormattedMessage defaultMessage="Host Type" />,
  orderId: <FormattedMessage defaultMessage="Order ID" />,
  orderLegacyId: <FormattedMessage defaultMessage="Legacy Order ID" />,
  orderFrequency: <FormattedMessage defaultMessage="Order Frequency" />,
  orderMemo: <FormattedMessage defaultMessage="Order Memo" />,
  orderProcessedDate: <FormattedMessage defaultMessage="Order Processed Date" />,
  paymentMethodService: <FormattedMessage defaultMessage="Payment Method Service" />,
  paymentMethodType: <FormattedMessage defaultMessage="Payment Method Type" />,
  expenseId: <FormattedMessage defaultMessage="Expense ID" />,
  expenseLegacyId: <FormattedMessage defaultMessage="Legacy Expense ID" />,
  expenseType: <FormattedMessage defaultMessage="Expense Type" />,
  expenseTags: <FormattedMessage defaultMessage="Expense Tags" />,
  payoutMethodType: <FormattedMessage defaultMessage="Payout Method Type" />,
  merchantId: <FormattedMessage defaultMessage="Merchant ID" />,
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

type ExportTransactionsCSVModalProps = {
  onClose: () => void;
  dateFrom?: string;
  dateTo?: string;
  collective: Account;
  host?: Account;
  accounts?: Account[];
};

const ExportTransactionsCSVModal = ({
  onClose,
  collective,
  dateFrom,
  dateTo,
  host,
  accounts,
  ...props
}: ExportTransactionsCSVModalProps) => {
  const now = new Date().toISOString();
  const isHostReport = Boolean(host);
  const interval = { from: dateFrom, to: dateTo || now };

  const intl = useIntl();
  const { addToast } = useToasts();
  const [exportedRows, setExportedRows] = React.useState(0);
  const [tmpDateInterval, setTmpDateInterval] = React.useState(interval);
  const [fieldOption, setFieldOption] = React.useState(FieldOptions[0].value);
  const [fields, setFields] = React.useState(DEFAULT_FIELDS.reduce((obj, key) => ({ ...obj, [key]: true }), {}));
  const [isValidDateInterval, setIsValidDateInterval] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const datePresetSelectedOption = React.useMemo(
    () => getSelectedPeriodOptionFromInterval(tmpDateInterval),
    [tmpDateInterval],
  );
  const datePresetPptions = React.useMemo(() => {
    return Object.keys(PERIOD_FILTER_PRESETS).map(presetKey => ({
      value: presetKey,
      label: PERIOD_FILTER_PRESETS[presetKey].label,
    }));
  }, [intl]);

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
    const format = 'txt';
    const { from, to } = tmpDateInterval;
    const url = isHostReport
      ? new URL(`${process.env.REST_URL}/v2/${host.slug}/hostTransactions.${format}`)
      : new URL(`${process.env.REST_URL}/v2/${collective.slug}/transactions.${format}`);

    url.searchParams.set('fetchAll', '1');

    if (isHostReport) {
      if (accounts?.length) {
        url.searchParams.set('account', accounts.map(a => a.slug).join(','));
      }
    } else {
      url.searchParams.set('includeChildrenTransactions', '1');
      url.searchParams.set('includeIncognitoTransactions', '1');
      url.searchParams.set('includeGiftCardTransactions', '1');
    }

    if (from) {
      url.searchParams.set('dateFrom', from);
    }
    if (to) {
      url.searchParams.set('dateTo', to);
    }
    if (!isEmpty(fields)) {
      url.searchParams.set('fields', Object.keys(fields).join(','));
    }
    return url.toString();
  };

  const fetchRows = async () => {
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
      setExportedRows(rows);
      return rows;
    }
  };

  const handleExport = async () => {
    const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) {
      try {
        setLoading(true);
        const url = getUrl();
        const { from, to } = tmpDateInterval;
        let filename = isHostReport ? `${host.slug}-host-transactions` : `${collective.slug}-transactions`;
        if (from) {
          const until = to || dayjs().format('YYYY-MM-DD');
          filename += `-${from}-${until}`;
        }
        const rows = await fetchRows();
        if (rows > 100e3) {
          addToast({
            type: TOAST_TYPE.ERROR,
            message: (
              <FormattedMessage
                id="ExportTransactionsCSVModal.RowsWarning"
                defaultMessage="Sorry, the requested file is would take too long to be exported. Row count ({rows}) above limit."
                values={{ rows: exportedRows }}
              />
            ),
          });
          return;
        }
        await fetchCSVFileFromRESTService(url, filename);
        addToast({ type: TOAST_TYPE.SUCCESS, message: <FormattedMessage defaultMessage="File downloaded!" /> });
        onClose();
      } catch (error) {
        addToast({ type: TOAST_TYPE.ERROR, message: formatErrorMessage(intl, error) });
      } finally {
        setLoading(false);
      }
    }
  };

  React.useEffect(() => {
    fetchRows();
  }, [tmpDateInterval, collective, host, accounts]);

  const expectedTimeInMinutes = Math.round((exportedRows * 1.1) / AVERAGE_TRANSACTIONS_PER_MINUTE);

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
              defaultMessage="This report is affected by the collective filtter and will include all transactions from the following accounts: {accounts}"
              values={{
                accounts: accounts.map(a => a.slug).join(', '),
              }}
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
                  options={datePresetPptions}
                  onChange={({ value }) => setTmpDateInterval(PERIOD_FILTER_PRESETS[value].getInterval())}
                  value={datePresetSelectedOption}
                  width="100%"
                  disabled={loading}
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
            disabled={loading}
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
                disabled={loading}
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
                    .filter(field => field !== 'balance' || !isHostReport)
                    .map(field => (
                      <StyledCheckbox
                        key={field}
                        name={field}
                        disabled={loading}
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
            onClick={handleExport}
            loading={loading}
            disabled={!isValidDateInterval || exportedRows > 100e3}
            minWidth={140}
          >
            <FormattedMessage defaultMessage="Export CSV" />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

export default ExportTransactionsCSVModal;
