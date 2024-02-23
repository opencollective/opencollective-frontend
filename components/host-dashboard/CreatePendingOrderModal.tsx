import React from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { accountHasGST, accountHasVAT, TaxType } from '@opencollective/taxes';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import dayjs from 'dayjs';
import { Form, Formik, useFormikContext } from 'formik';
import { cloneDeep, debounce, groupBy, map, omit, pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../lib/currency-utils';
import { requireFields, verifyEmailPattern } from '../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { CreatePendingContributionModalQuery, OrderPageQuery } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import formatCollectiveType from '../../lib/i18n/collective-type';
import { i18nTaxType } from '../../lib/i18n/taxes';
import { require2FAForAdmins } from '../../lib/policies';
import { omitDeep } from '../../lib/utils';

import AccountingCategorySelect from '../AccountingCategorySelect';
import CollectivePicker, { DefaultCollectiveLabel } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import { confirmContributionFieldsFragment } from '../ContributionConfirmationModal';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputPercentage from '../StyledInputPercentage';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import StyledTextarea from '../StyledTextarea';
import StyledTooltip from '../StyledTooltip';
import { TaxesFormikFields } from '../taxes/TaxesFormikFields';
import { P, Span } from '../Text';
import { TwoFactorAuthRequiredMessage } from '../TwoFactorAuthRequiredMessage';
import { useToast } from '../ui/useToast';
import { vendorFieldFragment } from '../vendors/queries';

const EDITABLE_FIELDS = [
  'amount',
  'platformTipAmount',
  'description',
  'expectedAt',
  'fromAccount',
  'fromAccountInfo',
  'hostFeePercent',
  'tier',
  'memo',
  'ponumber',
  'paymentMethod',
  'tax',
];

const debouncedLazyQuery = debounce((searchFunc, variables) => {
  return searchFunc({ variables });
}, 750);

const CreatePendingContributionModalContainer = styled(StyledModal)`
  width: 100%;
  max-width: 576px;
  padding: 24px 30px;
`;

const AmountDetailsLine = ({ label, value, currency, isLargeAmount }) => (
  <Flex justifyContent="space-between" alignItems="center">
    <Span fontSize="12px" lineHeight="18px" fontWeight="500">
      <FormattedMessage id="withColon" defaultMessage="{item}:" values={{ item: label }} />
    </Span>
    <Span fontSize={isLargeAmount ? '18px' : '12px'} lineHeight={isLargeAmount ? '27px' : '18px'} fontWeight="500">
      <FormattedMoneyAmount amount={value} currency={currency} />
    </Span>
  </Flex>
);

AmountDetailsLine.propTypes = {
  label: PropTypes.node,
  currency: PropTypes.string.isRequired,
  value: PropTypes.number,
  isLargeAmount: PropTypes.bool,
};

const createPendingContributionModalQuery = gql`
  query CreatePendingContributionModal($slug: String!) {
    host(slug: $slug) {
      id
      legacyId
      type
      isHost
      name
      slug
      currency
      settings
      hostFeePercent
      orderAccountingCategories: accountingCategories(kind: [CONTRIBUTION, ADDED_FUNDS]) {
        nodes {
          id
          name
          friendlyName
          code
          kind
        }
      }
      plan {
        id
        hostFees
      }
      policies {
        id
        REQUIRE_2FA_FOR_ADMINS
      }
      isTrustedHost
      vendors {
        totalCount
        nodes {
          id
          ...VendorFields
        }
      }
    }
  }

  ${vendorFieldFragment}
`;

const createPendingContributionModalCollectiveQuery = gql`
  query CreatePendingContributionCollective($slug: String!) {
    account(slug: $slug) {
      id
      type
      currency
      childrenAccounts {
        nodes {
          id
          type
          legacyId
          isHost
          name
          slug
          currency
          settings
          imageUrl
          ... on AccountWithContributions {
            tiers {
              nodes {
                id
                slug
                legacyId
                name
              }
            }
          }
        }
      }
      ... on AccountWithHost {
        bankTransfersHostFeePercent: hostFeePercent(paymentMethodType: MANUAL)
        host {
          id
          legacyId
          vendors(forAccount: { slug: $slug }, limit: 5) {
            nodes {
              id
              slug
              name
              type
              description
              imageUrl(height: 64)
            }
          }
        }
      }
      ... on AccountWithContributions {
        tiers {
          nodes {
            id
            slug
            legacyId
            name
          }
        }
      }
    }
  }
`;

const createPendingContributionMutation = gql`
  mutation CreatePendingContribution($order: PendingOrderCreateInput!) {
    createPendingOrder(order: $order) {
      legacyId
      id
      status
    }
  }
`;

const editPendingContributionMutation = gql`
  mutation EditPendingContribution($order: PendingOrderEditInput!) {
    editPendingOrder(order: $order) {
      legacyId
      id
      status
      ...ConfirmContributionFields
    }
  }
  ${confirmContributionFieldsFragment}
`;

const validate = values => {
  const errors = requireFields(values, [
    'totalAmount.valueInCents',
    'fromAccount',
    'toAccount',
    'expectedAt',
    'fromAccountInfo.name',
    'fromAccountInfo.email',
  ]);

  verifyEmailPattern(errors, values, 'fromAccountInfo.email');
  return errors;
};

// Build an account reference. Compatible with accounts from V1 and V2.
const buildAccountReference = input => {
  return typeof input.id === 'string' ? { id: input.id } : { legacyId: input.id };
};

const getTiersOptions = (intl, tiers) => {
  if (!tiers) {
    return [];
  }

  return [
    {
      value: null,
      label: intl.formatMessage({ defaultMessage: 'No tier' }),
    },
    ...tiers.map(tier => ({
      value: tier,
      label: `#${tier.legacyId} - ${tier.name}`,
    })),
  ];
};

const Field = styled(StyledInputFormikField).attrs({
  labelFontSize: '16px',
  labelFontWeight: '700',
})``;

const getApplicableTaxType = (collective, host) => {
  if (accountHasVAT(collective, host)) {
    return TaxType.VAT;
  } else if (accountHasGST(host || collective)) {
    return TaxType.GST;
  }
};

const getAmountsFromValues = values => {
  const total = values.totalAmount?.valueInCents || 0;
  const tip = values.platformTipAmount?.valueInCents || 0;
  const contribution = total ? Math.round(total - tip) : null;
  const gross = Math.round(contribution / (1 + (values.tax?.rate || 0)));
  const tax = Math.round(contribution - gross);
  const hostFee = Math.round(gross * (values.hostFeePercent / 100));
  const valid = total > 0 && contribution > 0;
  return { total, tip, contribution, tax, gross, hostFee, valid };
};

type CreatePendingContributionFormProps = {
  host: CreatePendingContributionModalQuery['host'];
  edit?: Partial<OrderPageQuery['order']>;
  onClose: () => void;
  onSuccess?: () => void;
  loading?: boolean;
  error?: any;
};

const CreatePendingContributionForm = ({ host, onClose, error, edit }: CreatePendingContributionFormProps) => {
  const formik = useFormikContext<any>();
  const { values, isSubmitting, setFieldValue } = formik;
  const intl = useIntl();
  const [getCollectiveInfo, { data, loading: collectiveLoading }] = useLazyQuery(
    createPendingContributionModalCollectiveQuery,
    {
      context: API_V2_CONTEXT,
      variables: { slug: host.slug },
    },
  );

  React.useEffect(() => {
    if (values.toAccount?.slug) {
      debouncedLazyQuery(getCollectiveInfo, { slug: values.toAccount.slug });
    }
  }, [values.toAccount]);

  React.useEffect(() => {
    setFieldValue('amount.currency', data?.account?.currency || host.currency);
    if (formik.touched.hostFeePercent !== true) {
      setFieldValue('hostFeePercent', data?.account?.bankTransfersHostFeePercent || host.hostFeePercent);
    }
  }, [data?.account]);

  React.useEffect(() => {
    if (values.fromAccount?.type === 'VENDOR') {
      const vendorInfo = host?.vendors?.nodes?.find(vendor => vendor.id === formik.values?.fromAccount?.id)?.vendorInfo;
      if (vendorInfo?.contact) {
        formik.touched.fromAccountInfo?.['name'] !== true &&
          setFieldValue('fromAccountInfo.name', vendorInfo.contact.name);
        formik.touched.fromAccountInfo?.['email'] !== true &&
          setFieldValue('fromAccountInfo.email', vendorInfo.contact.email);
      }
    } else {
      formik.touched.fromAccountInfo?.['name'] !== true &&
        formik.values?.fromAccountInfo?.name &&
        setFieldValue('fromAccountInfo.name', '');
      formik.touched.fromAccountInfo?.['email'] !== true &&
        formik.values?.fromAccountInfo?.email &&
        setFieldValue('fromAccountInfo.email', '');
    }
  }, [values.fromAccount]);

  const collective = data?.account;
  const currency = collective?.currency || host.currency;
  const childrenOptions = collective?.childrenAccounts?.nodes || [];
  const childAccount = values.childAccount?.id && childrenOptions.find(option => option.id === values.childAccount?.id);
  const canAddHostFee = host?.plan?.hostFees;
  const hostFeePercent = host.hostFeePercent;
  const applicableTax = getApplicableTaxType(collective, host);
  const tiersOptions = childAccount
    ? getTiersOptions(intl, childAccount?.tiers?.nodes || [])
    : getTiersOptions(intl, collective?.tiers?.nodes || []);

  const recommendedVendors = collective?.host?.vendors?.nodes || [];
  const defaultSources = [...recommendedVendors, host];
  const defaultSourcesOptions = map(groupBy(defaultSources, 'type'), (accounts, type) => {
    return {
      label: formatCollectiveType(intl, type, accounts.length),
      options: accounts.map(account => ({
        value: account,
        label: <DefaultCollectiveLabel value={account} />,
      })),
    };
  });

  const expectedAtOptions = [
    {
      value: dayjs().add(1, 'month'),
      label: intl.formatMessage({ defaultMessage: 'Within {n} {n, plural, one {month} other {months}}' }, { n: 1 }),
    },
    {
      value: dayjs().add(3, 'month'),
      label: intl.formatMessage({ defaultMessage: 'Within {n} {n, plural, one {month} other {months}}' }, { n: 3 }),
    },
    {
      value: dayjs().add(6, 'month'),
      label: intl.formatMessage({ defaultMessage: 'Within {n} {n, plural, one {month} other {months}}' }, { n: 6 }),
    },
    {
      value: dayjs().add(1, 'year'),
      label: intl.formatMessage({ defaultMessage: 'Within {n} {n, plural, one {year} other {years}}' }, { n: 1 }),
    },
  ];
  if (edit?.pendingContributionData?.expectedAt) {
    expectedAtOptions.push({
      value: dayjs(edit.pendingContributionData.expectedAt),
      label: intl.formatMessage(
        { defaultMessage: 'Around {date}', id: 'Fields.expectedAt.date' },
        { date: dayjs(edit.pendingContributionData.expectedAt).format('MMMM D, YYYY') },
      ),
    });
  }
  const paymentMethodOptions = [
    { value: 'UNKNOWN', label: intl.formatMessage({ id: 'Unknown', defaultMessage: 'Unknown' }) },
    { value: 'BANK_TRANSFER', label: intl.formatMessage({ defaultMessage: 'Bank Transfer' }) },
    { value: 'CHECK', label: intl.formatMessage({ id: 'PaymentMethod.Check', defaultMessage: 'Check' }) },
  ];

  const amounts = getAmountsFromValues(values);
  return (
    <Form data-cy="create-pending-contribution-form">
      <ModalBody mt="24px">
        <Field
          name="toAccount"
          htmlFor="CreatePendingContribution-toAccount"
          label={<FormattedMessage defaultMessage="Create pending contribution for:" />}
          labelFontSize="16px"
          labelFontWeight="700"
        >
          {({ form, field }) => (
            <CollectivePickerAsync
              inputId={field.id}
              data-cy="create-pending-contribution-to"
              types={['COLLECTIVE', 'ORGANIZATION', 'FUND']}
              error={field.error}
              hostCollectiveIds={[host.legacyId]}
              onBlur={() => form.setFieldTouched(field.name, true)}
              onChange={({ value }) => form.setFieldValue(field.name, value)}
              collective={field.value}
              disabled={Boolean(edit)}
              preload
            />
          )}
        </Field>
        {!edit && (
          <Field
            name="childAccount"
            htmlFor="CreatePendingContribution-childAccount"
            label={<FormattedMessage defaultMessage="Select event or project:" />}
            labelFontSize="16px"
            labelFontWeight="700"
            mt={3}
            required={false}
          >
            {({ form, field }) => (
              <CollectivePicker
                inputId={field.id}
                data-cy="create-pending-contribution-child"
                error={field.error}
                onBlur={() => form.setFieldTouched(field.name, true)}
                onChange={({ value }) => form.setFieldValue(field.name, value ? { id: value?.id } : null)}
                isLoading={collectiveLoading}
                collectives={childrenOptions}
                customOptions={[
                  { value: null, label: intl.formatMessage({ id: 'Account.None', defaultMessage: 'None' }) },
                ]}
                isSearchable={childrenOptions.length > 10}
                collective={childAccount}
                disabled={!values.toAccount}
              />
            )}
          </Field>
        )}
        <Field
          name="tier"
          htmlFor="CreatePendingContribution-tier"
          label={<FormattedMessage defaultMessage="Tier" />}
          mt={3}
          required={false}
        >
          {({ form, field }) => (
            <StyledSelect
              inputId={field.id}
              data-cy="create-pending-contribution-tier"
              error={field.error}
              onBlur={() => form.setFieldTouched(field.name, true)}
              onChange={({ value }) => form.setFieldValue(field.name, value)}
              isLoading={collectiveLoading}
              options={tiersOptions}
              disabled={!values.toAccount}
              isSearchable={tiersOptions.length > 10}
              value={tiersOptions.find(option =>
                !values.tier ? option.value === null : option.value?.id === values.tier.id,
              )}
            />
          )}
        </Field>

        <Field
          name="fromAccount"
          htmlFor="CreatePendingContribution-fromAccount"
          label={<FormattedMessage defaultMessage="Who is this contribution from?" />}
          mt={3}
          required
        >
          {({ form, field }) => (
            <CollectivePickerAsync
              inputId={field.id}
              data-cy="create-pending-contribution-source"
              types={['USER', 'ORGANIZATION', 'VENDOR']}
              error={field.error}
              onBlur={() => form.setFieldTouched(field.name, true)}
              customOptions={defaultSourcesOptions}
              onChange={({ value }) => form.setFieldValue(field.name, value)}
              collective={field.value}
              includeVendorsForHostId={collective?.host?.legacyId}
              menuPortalTarget={null}
              creatable={['USER', 'VENDOR']}
              HostCollectiveId={host?.legacyId}
            />
          )}
        </Field>
        <Field
          name="fromAccountInfo.name"
          htmlFor="CreatePendingContribution-fromAccountInfo-name"
          label={<FormattedMessage id="ContactName" defaultMessage="Contact name" />}
          mt={3}
          required
        >
          {({ field }) => <StyledInput data-cy="create-pending-contribution-contact-name" {...field} />}
        </Field>
        <Field
          name="fromAccountInfo.email"
          htmlFor="CreatePendingContribution-fromAccountInfo-email"
          label={<FormattedMessage id="Fields.fromAccountInfo.email" defaultMessage="Contact email" />}
          hint={
            <FormattedMessage
              id="Fields.fromAccountInfo.email.hint"
              defaultMessage="All communication email will be sent to this email address."
            />
          }
          mt={3}
          required
        >
          {({ field }) => (
            <StyledInput
              type="email"
              placeholder="e.g., yourname@yourhost.com"
              data-cy="create-pending-contribution-fromAccountInfo-email"
              {...field}
            />
          )}
        </Field>

        {/* Contribution */}
        {host.orderAccountingCategories?.nodes?.length > 0 && (
          <Field
            name="accountingCategory"
            htmlFor="addFunds-accountingCategory"
            required={false}
            label={<FormattedMessage id="AddFundsModal.accountingCategory" defaultMessage="Accounting category" />}
            mt={3}
          >
            {({ form, field }) => (
              <AccountingCategorySelect
                id={field.id}
                kind="CONTRIBUTION"
                onChange={value => form.setFieldValue(field.name, value)}
                host={host}
                account={collective}
                selectedCategory={field.value}
                allowNone={true}
                borderRadiusClass="rounded"
              />
            )}
          </Field>
        )}

        <Field
          name="ponumber"
          htmlFor="CreatePendingContribution-ponumber"
          label={<FormattedMessage id="Fields.PONumber" defaultMessage="PO Number" />}
          mt={3}
          hint={
            <FormattedMessage defaultMessage="External reference code for this contribution. This is usually a reference number from the contributor accounting system." />
          }
          required={false}
        >
          {({ field }) => <StyledInput type="text" data-cy="create-pending-contribution-ponumber" {...field} />}
        </Field>
        <Field
          name="memo"
          htmlFor="CreatePendingContribution-memo"
          label={<FormattedMessage id="Expense.PrivateNote" defaultMessage="Private note" />}
          mt={3}
          required={false}
        >
          {({ field }) => <StyledTextarea data-cy="create-pending-contribution-memo" {...field} />}
        </Field>
        <Flex mt={3} flexWrap="wrap">
          <Field
            name="totalAmount.valueInCents"
            htmlFor="CreatePendingContribution-amount"
            label={<FormattedMessage id="TotalAmount" defaultMessage="Total amount" />}
            required
            flex="1 1"
          >
            {({ form, field }) => (
              <StyledInputAmount
                id={field.id}
                data-cy="create-pending-contribution-amount"
                currency={currency}
                placeholder="0.00"
                error={field.error}
                value={field.value}
                maxWidth="100%"
                onChange={value => form.setFieldValue(field.name, value)}
                onBlur={() => form.setFieldTouched(field.name, true)}
              />
            )}
          </Field>
          {/** Can only edit platform tip if already set on the contribution */}
          {Boolean(edit?.platformTipAmount?.valueInCents || edit?.platformTipEligible) && (
            <Box ml={2} flex="1 1">
              <Field
                name="platformTipAmount.valueInCents"
                htmlFor="CreatePendingContribution-tip"
                label={<FormattedMessage id="Transaction.kind.PLATFORM_TIP" defaultMessage="Platform tip" />}
                required
                flex="1 1"
              >
                {({ form, field }) => (
                  <StyledInputAmount
                    id={field.id}
                    data-cy="create-pending-contribution-tip-amount"
                    currency={currency}
                    placeholder="0.00"
                    error={field.error}
                    value={field.value}
                    maxWidth="100%"
                    onChange={value => form.setFieldValue(field.name, value)}
                    onBlur={() => form.setFieldTouched(field.name, true)}
                    min={field.value ? 0 : undefined}
                    max={amounts.total ? amounts.total : undefined}
                  />
                )}
              </Field>
            </Box>
          )}
          {canAddHostFee && (
            <Field
              name="hostFeePercent"
              htmlFor="CreatePendingContribution-hostFeePercent"
              label={
                <span>
                  <FormattedMessage defaultMessage="Host Fee" />
                  {` `}
                  <StyledTooltip
                    content={() => (
                      <FormattedMessage
                        id="AddFundsModal.hostFee.tooltip"
                        defaultMessage="The default host fee percentage is set up in your host settings. The host fee is charged by the fiscal host to the collectives for the financial services provided."
                      />
                    )}
                  >
                    <InfoCircle size={16} />
                  </StyledTooltip>
                </span>
              }
              ml="8px"
              required={false}
            >
              {({ form, field }) => (
                <StyledInputPercentage
                  id={field.id}
                  placeholder={hostFeePercent}
                  value={field.value}
                  error={field.error}
                  onChange={value => form.setFieldValue(field.name, value)}
                  onBlur={() => form.setFieldTouched(field.name, true)}
                  maxWidth="100%"
                />
              )}
            </Field>
          )}
        </Flex>
        {applicableTax && (
          <Box mt={3}>
            <TaxesFormikFields
              taxType={applicableTax}
              formik={formik}
              formikValuePath="tax"
              isOptional
              dispatchDefaultValueOnMount={false}
              labelProps={{ fontSize: '16px', fontWeight: '700' }}
              idNumberLabelRenderer={shortTaxTypeLabel =>
                intl.formatMessage(
                  { defaultMessage: "Contributor's {taxName} identifier" },
                  { taxName: shortTaxTypeLabel },
                )
              }
            />
          </Box>
        )}
        <Field
          name="expectedAt"
          htmlFor="CreatePendingContribution-expectedAt"
          mt={3}
          label={<FormattedMessage id="Fields.expectedAt" defaultMessage="When are these funds expected to arrive?" />}
          hint={
            values.expectedAt && (
              <FormattedMessage
                id="Fields.expectedAt.date"
                defaultMessage="Around {date}"
                values={{ date: dayjs(values.expectedAt).format('DD/MM/YYYY') }}
              />
            )
          }
          required
        >
          {({ form, field }) => (
            <StyledSelect
              inputId={field.id}
              data-cy="create-pending-contribution-expectedAt"
              error={field.error}
              onBlur={() => form.setFieldTouched(field.name, true)}
              onChange={({ value }) => form.setFieldValue(field.name, value)}
              options={expectedAtOptions}
              value={expectedAtOptions.find(option => dayjs(values.expectedAt).isSame(option.value))}
            />
          )}
        </Field>
        <Field
          name="paymentMethod"
          htmlFor="CreatePendingContribution-.paymentMethod"
          mt={3}
          label={<FormattedMessage id="Fields.paymentMethod" defaultMessage="Payment method" />}
          required={false}
        >
          {({ form, field }) => (
            <StyledSelect
              inputId={field.id}
              data-cy="create-pending-contribution-.paymentMethod"
              error={field.error}
              onBlur={() => form.setFieldTouched(field.name, true)}
              onChange={({ value }) => form.setFieldValue(field.name, value)}
              options={paymentMethodOptions}
              value={paymentMethodOptions.find(option => option.value === values.paymentMethod)}
            />
          )}
        </Field>
        <Field
          name="description"
          htmlFor="CreatePendingContribution-description"
          label={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
          mt={3}
          required={false}
        >
          {({ field }) => (
            <StyledInput
              data-cy="create-pending-contribution-description"
              {...field}
              placeholder={values.toAccount && `Financial contribution to ${values.toAccount.name}`}
            />
          )}
        </Field>
        <P fontSize="14px" lineHeight="17px" fontWeight="500" mt={4}>
          <FormattedMessage id="Details" defaultMessage="Details" />
        </P>
        <StyledHr my={2} borderColor="black.300" />
        <AmountDetailsLine
          value={amounts.total || 0}
          currency={currency}
          label={<FormattedMessage id="AddFundsModal.fundingAmount" defaultMessage="Funding amount" />}
        />
        {Boolean(amounts.tip) && (
          <AmountDetailsLine
            value={-amounts.tip || 0}
            currency={currency}
            label={<FormattedMessage defaultMessage="{service} platform tip" values={{ service: 'Open Collective' }} />}
          />
        )}
        {Boolean(values.tax?.rate) && (
          <React.Fragment>
            <AmountDetailsLine
              value={-amounts.tax}
              currency={currency}
              label={`${i18nTaxType(intl, values.tax.type, 'long')} (${Math.round(values.tax.rate * 100)}%)`}
            />
            <StyledHr my={1} borderColor="black.200" />
          </React.Fragment>
        )}
        {Boolean(amounts.hostFee) && (
          <React.Fragment>
            <AmountDetailsLine
              value={-amounts.hostFee || 0}
              currency={currency}
              label={
                <FormattedMessage
                  id="AddFundsModal.hostFees"
                  defaultMessage="Host fee charged to collective ({hostFees})"
                  values={{ hostFees: `${values.hostFeePercent}%` }}
                />
              }
            />
            <StyledHr my={1} borderColor="black.200" />
          </React.Fragment>
        )}
        <AmountDetailsLine
          value={amounts.valid ? amounts.gross - amounts.hostFee : null}
          currency={currency}
          label={<FormattedMessage id="AddFundsModal.netAmount" defaultMessage="Net amount received by collective" />}
          isLargeAmount
        />

        {Boolean(amounts.tip && amounts.contribution && amounts.tip >= amounts.contribution) && (
          <MessageBox type="warning" mt={2}>
            <FormattedMessage
              id="Warning.TipAmountContributionWarning"
              defaultMessage="You are about to make a contribution of {contributionAmount} to {accountName} that includes a {tipAmount} tip to the Open Collective platform. The tip amount looks unusually high.{newLine}{newLine}Are you sure you want to do this?"
              values={{
                contributionAmount: formatCurrency(amounts.total, currency, { locale: intl.locale }),
                tipAmount: formatCurrency(amounts.tip, currency, { locale: intl.locale }),
                accountName: collective?.name || 'collective',
                newLine: ' ',
              }}
            />
          </MessageBox>
        )}

        {error && <MessageBoxGraphqlError error={error} mt={3} fontSize="13px" />}
      </ModalBody>
      <ModalFooter>
        <Flex justifyContent="space-between" flexWrap="wrap">
          <StyledButton mx={2} mb={1} minWidth={100} onClick={onClose} type="button">
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
          <StyledButton
            type="submit"
            data-cy="create-pending-contribution-submit-btn"
            buttonStyle="primary"
            mx={2}
            mb={1}
            minWidth={120}
            loading={isSubmitting}
          >
            {edit ? (
              <FormattedMessage defaultMessage="Edit pending contribution" />
            ) : (
              <FormattedMessage defaultMessage="Create pending contribution" />
            )}
          </StyledButton>
        </Flex>
      </ModalFooter>
    </Form>
  );
};

type CreatePendingContributionModalProps = {
  hostSlug: string;
  edit?: Partial<OrderPageQuery['order']>;
  onClose: () => void;
  onSuccess: () => void;
};

const CreatePendingContributionModal = ({ hostSlug, edit, ...props }: CreatePendingContributionModalProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const { toast } = useToast();

  const { data, loading } = useQuery<CreatePendingContributionModalQuery>(createPendingContributionModalQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: hostSlug },
  });

  const host = data?.host;
  const [createPendingOrder, { error: createOrderError }] = useMutation(createPendingContributionMutation, {
    context: API_V2_CONTEXT,
  });
  const [editPendingOrder, { error: editOrderError }] = useMutation(editPendingContributionMutation, {
    context: API_V2_CONTEXT,
  });

  // No modal if logged-out
  if (!LoggedInUser) {
    return null;
  }

  const handleClose = () => {
    props.onClose();
  };

  const error = createOrderError || editOrderError;
  const initialValues = edit
    ? {
        ...edit,
        fromAccountInfo: edit.pendingContributionData?.fromAccountInfo,
        expectedAt: edit.pendingContributionData?.expectedAt,
        ponumber: edit.pendingContributionData?.ponumber,
        memo: edit.pendingContributionData?.memo,
        paymentMethod: edit.pendingContributionData?.paymentMethod,
        tax: edit.tax && omit(edit.tax, ['id']),
      }
    : { hostFeePercent: host?.hostFeePercent || 0 };

  return (
    <CreatePendingContributionModalContainer {...props} trapFocus onClose={handleClose}>
      <ModalHeader>
        {edit ? (
          <FormattedMessage defaultMessage="Edit Pending Contribution #{id}" values={{ id: edit.legacyId }} />
        ) : (
          <FormattedMessage defaultMessage="Create Pending Contribution" />
        )}
      </ModalHeader>
      {loading ? (
        <LoadingPlaceholder mt={2} height={200} />
      ) : require2FAForAdmins(host) && !LoggedInUser.hasTwoFactorAuth ? (
        <TwoFactorAuthRequiredMessage borderWidth={0} noTitle />
      ) : (
        <Formik
          initialValues={initialValues}
          enableReinitialize={true}
          validate={validate}
          onSubmit={async values => {
            const amounts = getAmountsFromValues(values);
            const tax = !values.tax ? null : cloneDeep(values.tax);
            if (tax) {
              // Populate amount so that API can double-check there's no rounding error
              tax.amount = { valueInCents: amounts.tax, currency: values.amount.currency };
            }

            if (edit) {
              const order = omitDeep(
                {
                  id: edit.id,
                  ...pick(values, EDITABLE_FIELDS),
                  fromAccount: buildAccountReference(values.fromAccount),
                  tier: !values.tier ? null : { id: values.tier.id },
                  expectedAt: values.expectedAt ? dayjs(values.expectedAt).format() : null,
                  amount: { ...values.amount, valueInCents: amounts.gross },
                  platformTipAmount: values.platformTipAmount?.valueInCents ? values.platformTipAmount : null,
                  tax,
                },
                ['__typename'],
              );

              const result = await editPendingOrder({ variables: { order } });

              toast({
                variant: 'success',
                message: (
                  <FormattedMessage
                    defaultMessage="Pending contribution #{orderId} updated"
                    values={{ orderId: result.data.editPendingOrder.legacyId }}
                  />
                ),
              });
            } else {
              const order = {
                ...omit(values, ['totalAmount']), // Total amount is transformed to amount when passed to the API
                amount: { ...values.amount, valueInCents: amounts.gross },
                fromAccount: buildAccountReference(values.fromAccount),
                toAccount: values.childAccount
                  ? buildAccountReference(values.childAccount)
                  : buildAccountReference(values.toAccount),
                childAccount: undefined,
                tier: !values.tier ? null : { id: values.tier.id },
                expectedAt: values.expectedAt ? dayjs(values.expectedAt).format() : null,
                tax,
                accountingCategory: values.accountingCategory && { id: values.accountingCategory.id },
              };

              const result = await createPendingOrder({ variables: { order } });

              toast({
                variant: 'success',
                message: (
                  <FormattedMessage
                    defaultMessage="Pending contribution created with reference #{orderId}"
                    values={{ orderId: result.data.createPendingOrder.legacyId }}
                  />
                ),
              });
            }

            props.onSuccess();
            handleClose();
          }}
        >
          <CreatePendingContributionForm
            host={host}
            onClose={handleClose}
            loading={loading}
            error={error}
            edit={edit}
          />
        </Formik>
      )}
    </CreatePendingContributionModalContainer>
  );
};

export default CreatePendingContributionModal;
