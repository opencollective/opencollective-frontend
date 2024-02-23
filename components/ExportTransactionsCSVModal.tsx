// @deprecated, being replaced by components/dashboard/ExportTransactionsCSVModal.tsx - remove when new filters are applied everywhere
import React from 'react';
import { flatten, isEmpty, omit } from 'lodash';
import { FormattedMessage } from 'react-intl';

import {
  AVERAGE_TRANSACTIONS_PER_MINUTE,
  DEFAULT_FIELDS,
  FIELD_GROUPS_2024,
  FIELD_OPTIONS,
  FieldGroupLabels,
  FieldLabels,
  FieldOptions,
  HOST_OMITTED_FIELDS,
} from '../lib/csv';
import { simpleDateToISOString } from '../lib/date-utils';
import { getEnvVar } from '../lib/env-utils';
import type { Account } from '../lib/graphql/types/v2/graphql';
import { useAsyncCall } from '../lib/hooks/useAsyncCall';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { parseToBoolean } from '../lib/utils';

import { getIntervalFromValue, PeriodFilterForm } from './filters/PeriodFilter';
import { Label } from './ui/Label';
import { Switch } from './ui/Switch';
import { Box, Flex, Grid } from './Grid';
import MessageBox from './MessageBox';
import PeriodFilterPresetsSelect from './PeriodFilterPresetsSelect';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import StyledHr from './StyledHr';
import StyledInputField from './StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import StyledSelect from './StyledSelect';
import { Span } from './Text';

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

  const intervalFromValue = React.useMemo(() => getIntervalFromValue(dateInterval), [dateInterval]);
  const [tmpDateInterval, setTmpDateInterval] = React.useState(intervalFromValue);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>('#');
  const [fieldOption, setFieldOption] = React.useState(FieldOptions[0].value);
  const [fields, setFields] = React.useState(DEFAULT_FIELDS.reduce((obj, key) => ({ ...obj, [key]: true }), {}));
  const [isValidDateInterval, setIsValidDateInterval] = React.useState(true);
  const [flattenTaxesAndPaymentProcessorFees, setFlattenTaxesAndPaymentProcessorFees] = React.useState(false);

  const fieldGroups = FIELD_GROUPS_2024;

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
      setFields({ ...fields, ...fieldGroups[name].reduce((obj, key) => ({ ...obj, [key]: true }), {}) });
    } else {
      setFields(omit(fields, fieldGroups[name]));
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
    if (flattenTaxesAndPaymentProcessorFees) {
      url.searchParams.set('flattenPaymentProcessorFee', '1');
      url.searchParams.set('flattenTax', '1');
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
            // I'm enforcing SameSite and Domain in production to prevent CSRF.
            `authorization="Bearer ${accessToken}";path=/;SameSite=strict;max-age=120;domain=opencollective.com;secure`;
    }
    setDownloadUrl(getUrl());
  }, [fields, flattenTaxesAndPaymentProcessorFees, tmpDateInterval]);

  const expectedTimeInMinutes = Math.round((exportedRows * 1.1) / AVERAGE_TRANSACTIONS_PER_MINUTE);
  const disabled = !isValidDateInterval || exportedRows > 100e3;

  return (
    <StyledModal onClose={onClose} width="100%" maxWidth="576px" {...props}>
      <ModalHeader>
        <FormattedMessage id="ExportTransactionsCSVModal.Title" defaultMessage="Export Transactions" />
      </ModalHeader>
      <ModalBody>
        {isHostReport && accounts?.length > 0 && (
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
              {() => (
                <PeriodFilterPresetsSelect
                  inputId="csv-export-date-presets-select"
                  // @ts-expect-error PeriodFilterPresetsSelect is not typed yet, the following conflicts with proptypes
                  SelectComponent={StyledSelect}
                  onChange={setTmpDateInterval}
                  interval={tmpDateInterval}
                  styles={null}
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
          Object.keys(fieldGroups).map(group => {
            const isSelected = fieldGroups[group].every(f => fields[f]);
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
                  {fieldGroups[group]
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

        {parseToBoolean(getEnvVar('LEDGER_SEPARATE_TAXES_AND_PAYMENT_PROCESSOR_FEES')) && (
          <div className="mt-4 flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">
                <FormattedMessage defaultMessage="Separate transactions compatibility" />
              </Label>
              <p className="text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="Export taxes and payment processor fees as columns" />
              </p>
            </div>
            <Switch
              checked={flattenTaxesAndPaymentProcessorFees}
              onCheckedChange={setFlattenTaxesAndPaymentProcessorFees}
            />
          </div>
        )}

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
            <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

export default ExportTransactionsCSVModal;
