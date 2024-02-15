import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { accountHasGST, accountHasVAT, TaxType } from '@opencollective/taxes';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Form, Formik } from 'formik';
import { get, groupBy, isEmpty, map } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { formatCurrency } from '../../lib/currency-utils';
import { getCurrentLocalDateStr } from '../../lib/date-utils';
import { requireFields } from '../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import formatCollectiveType from '../../lib/i18n/collective-type';
import { i18nTaxType } from '../../lib/i18n/taxes';
import { require2FAForAdmins } from '../../lib/policies';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import AccountingCategorySelect from '../AccountingCategorySelect';
import { collectivePageQuery, getCollectivePageQueryVariables } from '../collective-page/graphql/queries';
import { getBudgetSectionQuery, getBudgetSectionQueryVariables } from '../collective-page/sections/Budget';
import { DefaultCollectiveLabel } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputPercentage from '../StyledInputPercentage';
import StyledLink from '../StyledLink';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import StyledTooltip from '../StyledTooltip';
import { TaxesFormikFields, validateTaxInput } from '../taxes/TaxesFormikFields';
import { P, Span } from '../Text';
import { TwoFactorAuthRequiredMessage } from '../TwoFactorAuthRequiredMessage';

const AddFundsModalContainer = styled(StyledModal)`
  width: 100%;
  max-width: 576px;
  padding: 24px 30px;
  ${props =>
    props.showSuccessModal &&
    css`
      background-image: url('/static/images/platform-tip-background.svg');
      background-repeat: no-repeat;
      background-size: 100%;
      background-position: left 0 bottom 95px;
      @media (max-width: 30em) {
        background-position: left 0 top 0;
      }
    `}
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

const addFundsMutation = gql`
  mutation AddFunds(
    $fromAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $tier: TierReferenceInput
    $amount: AmountInput!
    $description: String!
    $memo: String
    $processedAt: DateTime
    $hostFeePercent: Float!
    $invoiceTemplate: String
    $tax: TaxInput
    $accountingCategory: AccountingCategoryReferenceInput
  ) {
    addFunds(
      account: $account
      fromAccount: $fromAccount
      amount: $amount
      description: $description
      memo: $memo
      processedAt: $processedAt
      hostFeePercent: $hostFeePercent
      tier: $tier
      invoiceTemplate: $invoiceTemplate
      tax: $tax
      accountingCategory: $accountingCategory
    ) {
      id
      description
      memo
      processedAt
      hostFeePercent
      taxAmount {
        valueInCents
      }
      taxes {
        type
        percentage
      }
      transactions {
        id
        type
      }
      fromAccount {
        id
        slug
        name
      }
      toAccount {
        id
        slug
        name
        stats {
          id
          balance {
            valueInCents
          }
        }
      }
      accountingCategory {
        id
        code
        name
        kind
      }
      tier {
        id
        legacyId
        slug
        name
      }
    }
  }
`;

const addFundsTierFieldsFragment = gql`
  fragment AddFundsTierFields on Tier {
    id
    slug
    legacyId
    name
  }
`;

const addFundsAccountQueryHostFieldsFragment = gql`
  fragment AddFundsAccountQueryHostFields on Host {
    id
    type
    legacyId
    slug
    name
    settings
    plan {
      id
      hostFees
    }
    policies {
      id
      REQUIRE_2FA_FOR_ADMINS
    }
    isTrustedHost
    vendors(forAccount: { slug: $slug }) {
      nodes {
        id
        slug
        name
        type
        description
        imageUrl(height: 64)
      }
    }
    orderAccountingCategories: accountingCategories(kind: [CONTRIBUTION, ADDED_FUNDS]) {
      nodes {
        id
        code
        name
        kind
      }
    }
  }
`;

const addFundsAccountQuery = gql`
  query AddFundsAccount($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      type
      isHost
      name
      slug
      currency
      settings
      ... on Organization {
        tiers {
          nodes {
            id
            ...AddFundsTierFields
          }
        }
        host {
          ...AddFundsAccountQueryHostFields
        }
      }
      ... on AccountWithParent {
        parent {
          id
        }
      }
      ... on Host {
        ...AddFundsAccountQueryHostFields
      }
      ... on AccountWithHost {
        addedFundsHostFeePercent: hostFeePercent(paymentMethodType: HOST)
        host {
          ...AddFundsAccountQueryHostFields
        }
      }
      ... on AccountWithContributions {
        tiers {
          nodes {
            id
            ...AddFundsTierFields
          }
        }
      }
    }
  }
  ${addFundsTierFieldsFragment}
  ${addFundsAccountQueryHostFieldsFragment}
`;

const getInitialValues = values => ({
  amount: null,
  hostFeePercent: null,
  description: '',
  memo: null,
  processedAt: getCurrentLocalDateStr(),
  fromAccount: null,
  tier: null,
  tax: null,
  ...values,
});

const validate = (intl, values) => {
  const errors = requireFields(values, ['amount', 'fromAccount', 'description', 'processedAt']);
  const taxErrors = validateTaxInput(intl, values.tax, { requireTaxIdNumber: false });
  if (!isEmpty(taxErrors)) {
    errors.tax = taxErrors;
  }

  return errors;
};

const getApplicableTaxType = (collective, host) => {
  if (accountHasVAT(collective, host || collective.host)) {
    return TaxType.VAT;
  } else if (accountHasGST(host || collective.host || collective)) {
    return TaxType.GST;
  }
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

const checkCanAddHostFee = account => {
  // No host, or no account, no host fees
  if (!account?.host) {
    return false;
  }

  if (account.parent) {
    // No host fees for child of independent collective
    return account.host.id !== account.parent.id;
  }

  // No host fees for Host Organizations or Independent Collectives
  return account.host.id !== account.id;
};

const AddFundsModal = ({ collective, ...props }) => {
  const { LoggedInUser } = useLoggedInUser();
  const [fundDetails, setFundDetails] = useState({});
  const intl = useIntl();
  const { data, loading } = useQuery(addFundsAccountQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: collective.slug },
  });
  const account = data?.account;
  const currency = account?.currency;
  const host = account?.isHost && !account.host ? account : account?.host;
  const applicableTax = getApplicableTaxType(collective, host);

  const [submitAddFunds, { error: fundError }] = useMutation(addFundsMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [
      {
        context: API_V2_CONTEXT,
        query: getBudgetSectionQuery(true, false),
        variables: getBudgetSectionQueryVariables(collective.slug, false),
      },
      { query: collectivePageQuery, variables: getCollectivePageQueryVariables(collective.slug) },
    ],
    awaitRefetchQueries: true,
  });

  const tiersNodes = get(data, 'account.tiers.nodes');
  const tiersOptions = React.useMemo(() => getTiersOptions(intl, tiersNodes), [tiersNodes]);

  // No modal if logged-out
  if (!LoggedInUser) {
    return null;
  }

  // From the Collective page we pass collective as API v1 objects
  // From the Host dashboard we pass collective as API v2 objects
  const canAddHostFee = checkCanAddHostFee(account);
  const hostFeePercent = account?.addedFundsHostFeePercent || collective.hostFeePercent;
  const defaultHostFeePercent = canAddHostFee ? hostFeePercent : 0;
  const receiptTemplates = host?.settings?.invoice?.templates;
  const recommendedVendors = host?.vendors?.nodes || [];
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

  const receiptTemplateTitles = [];
  if (receiptTemplates?.default?.title?.length > 0) {
    receiptTemplateTitles.push({
      value: 'default',
      label: receiptTemplates?.default?.title,
    });
  }
  if (receiptTemplates?.alternative?.title?.length > 0) {
    receiptTemplateTitles.push({ value: 'alternative', label: receiptTemplates?.alternative?.title });
  }

  const handleClose = () => {
    setFundDetails({ showSuccessModal: false });
    props.onClose();
  };

  return (
    <AddFundsModalContainer {...props} trapFocus showSuccessModal={fundDetails.showSuccessModal} onClose={handleClose}>
      <CollectiveModalHeader collective={collective} onClick={handleClose} />
      {loading ? (
        <LoadingPlaceholder mt={2} height={200} />
      ) : require2FAForAdmins(host) && !LoggedInUser.hasTwoFactorAuth ? (
        <TwoFactorAuthRequiredMessage borderWidth={0} noTitle />
      ) : (
        <Formik
          initialValues={getInitialValues({ hostFeePercent: defaultHostFeePercent, account: collective })}
          enableReinitialize={true}
          validate={values => validate(intl, values)}
          onSubmit={async (values, formik) => {
            if (!fundDetails.showSuccessModal) {
              const defaultInvoiceTemplate = receiptTemplateTitles.length > 0 ? receiptTemplateTitles[0].value : null;
              const result = await submitAddFunds({
                variables: {
                  ...values,
                  amount: { valueInCents: values.amount },
                  platformTip: { valueInCents: 0 },
                  fromAccount: buildAccountReference(values.fromAccount),
                  account: buildAccountReference(values.account),
                  tier: !values.tier ? null : { id: values.tier.id },
                  invoiceTemplate: values.invoiceTemplate?.value || defaultInvoiceTemplate,
                  processedAt: values.processedAt ? new Date(values.processedAt) : null,
                  tax: values.tax,
                  accountingCategory: values.accountingCategory ? { id: values.accountingCategory.id } : null,
                },
              });

              const resultOrder = result.data.addFunds;
              setFundDetails({
                showSuccessModal: true,
                fundAmount: values.amount,
                taxAmount: resultOrder.taxAmount,
                hostFeePercent: resultOrder.hostFeePercent,
                taxes: resultOrder.taxes,
                description: resultOrder.description,
                memo: resultOrder.memo,
                processedAt: resultOrder.processedAt,
                source: resultOrder.fromAccount,
                tier: resultOrder.tier,
              });
              /*
               * Since `enableReinitialize` is used in this form, during the second step (platform tip step)
               * the form values will be reset. The validate function in this form
               * requires `amount`, `fromAccount` and `description` so we should
               * set them as otherwise the form will not be submittable.
               */
              formik.setValues({
                amount: values.amount,
                fromAccount: resultOrder.fromAccount,
                description: resultOrder.description,
                processedAt: resultOrder.processedAt,
              });
              props.onSuccess?.();
            } else {
              handleClose();
            }
          }}
        >
          {formik => {
            const { values, isSubmitting } = formik;
            const hostFeePercent = isNaN(values.hostFeePercent) ? defaultHostFeePercent : values.hostFeePercent;
            const taxAmount = !values.tax?.rate ? 0 : Math.round(values.amount - values.amount / (1 + values.tax.rate));
            const hostFee = Math.round((values.amount - taxAmount) * (hostFeePercent / 100));

            if (!fundDetails.showSuccessModal) {
              return (
                <Form data-cy="add-funds-form">
                  <h3>
                    <FormattedMessage id="AddFundsModal.SubHeading" defaultMessage="Add Funds to the Collective" />
                  </h3>
                  <ModalBody>
                    <Field
                      name="fromAccount"
                      htmlFor="addFunds-fromAccount"
                      label={<FormattedMessage id="AddFundsModal.source" defaultMessage="Source" />}
                      mt={3}
                    >
                      {({ form, field }) => (
                        <CollectivePickerAsync
                          inputId={field.id}
                          data-cy="add-funds-source"
                          types={['USER', 'ORGANIZATION', 'VENDOR']}
                          error={field.error}
                          onBlur={() => form.setFieldTouched(field.name, true)}
                          customOptions={defaultSourcesOptions}
                          onChange={({ value }) => form.setFieldValue(field.name, value)}
                          menuPortalTarget={null}
                          includeVendorsForHostId={host?.legacyId || undefined}
                          creatable={['USER', 'VENDOR']}
                          HostCollectiveId={host?.legacyId}
                        />
                      )}
                    </Field>
                    <Field
                      name="tier"
                      htmlFor="addFunds-tier"
                      label={<FormattedMessage defaultMessage="Tier" />}
                      mt={3}
                    >
                      {({ form, field }) => (
                        <StyledSelect
                          inputId={field.id}
                          data-cy="add-funds-tier"
                          error={field.error}
                          onBlur={() => form.setFieldTouched(field.name, true)}
                          onChange={({ value }) => form.setFieldValue(field.name, value)}
                          isLoading={loading}
                          options={tiersOptions}
                          isSearchable={tiersOptions.length > 10}
                          value={tiersOptions.find(option =>
                            !values.tier ? option.value === null : option.value?.id === values.tier.id,
                          )}
                        />
                      )}
                    </Field>
                    <Field
                      name="description"
                      htmlFor="addFunds-description"
                      label={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
                      mt={3}
                    >
                      {({ field }) => <StyledInput data-cy="add-funds-description" {...field} />}
                    </Field>
                    <Field
                      name="processedAt"
                      htmlFor="addFunds-processedAt"
                      inputType="date"
                      label={
                        <span>
                          <FormattedMessage defaultMessage="Effective Date" />
                          {` `}
                          <StyledTooltip
                            content={() => (
                              <FormattedMessage defaultMessage="Date funds were cleared on your bank, Wise, PayPal, Stripe or any other external account holding these funds." />
                            )}
                          >
                            <InfoCircle size={16} />
                          </StyledTooltip>
                        </span>
                      }
                      mt={3}
                    >
                      {({ field }) => <StyledInput data-cy="add-funds-processedAt" {...field} />}
                    </Field>
                    {account.host?.orderAccountingCategories?.nodes?.length > 0 && (
                      <Field
                        name="accountingCategory"
                        htmlFor="addFunds-accountingCategory"
                        required={false}
                        label={
                          <FormattedMessage
                            id="AddFundsModal.accountingCategory"
                            defaultMessage="Accounting category"
                          />
                        }
                        mt={3}
                      >
                        {({ form, field }) => (
                          <AccountingCategorySelect
                            id={field.id}
                            kind="CONTRIBUTION"
                            onChange={value => form.setFieldValue(field.name, value)}
                            host={host}
                            account={account}
                            selectedCategory={field.value}
                            allowNone={true}
                            borderRadiusClass="rounded"
                          />
                        )}
                      </Field>
                    )}
                    <Field
                      name="memo"
                      htmlFor="addFunds-memo"
                      label={
                        <span>
                          <FormattedMessage defaultMessage="Memo" />
                          {` `}
                          <StyledTooltip
                            content={() => (
                              <FormattedMessage defaultMessage="This is a private note that will only be visible to the host." />
                            )}
                          >
                            <InfoCircle size={16} />
                          </StyledTooltip>
                        </span>
                      }
                      required={false}
                      mt={3}
                    >
                      {({ field }) => <StyledInput data-cy="add-funds-memo" {...field} />}
                    </Field>
                    <Flex mt={3} flexWrap="wrap">
                      <Field
                        name="amount"
                        htmlFor="addFunds-amount"
                        label={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}
                        required
                        flex="1 1"
                      >
                        {({ form, field }) => (
                          <StyledInputAmount
                            id={field.id}
                            data-cy="add-funds-amount"
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
                      {canAddHostFee && (
                        <Field
                          name="hostFeePercent"
                          htmlFor="addFunds-hostFeePercent"
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
                          ml={3}
                        >
                          {({ form, field }) => (
                            <StyledInputPercentage
                              id={field.id}
                              placeholder={defaultHostFeePercent}
                              value={field.value}
                              error={field.error}
                              onChange={value => form.setFieldValue(field.name, value)}
                              onBlur={() => form.setFieldTouched(field.name, true)}
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
                              { defaultMessage: "Source's {taxName} identifier" },
                              { taxName: shortTaxTypeLabel },
                            )
                          }
                        />
                      </Box>
                    )}
                    {receiptTemplateTitles.length > 1 && (
                      <Container width="100%">
                        <Field
                          name="invoiceTemplate"
                          htmlFor="addFunds-invoiceTemplate"
                          label={<FormattedMessage defaultMessage="Choose receipt" />}
                          mt={3}
                        >
                          {({ form, field }) => (
                            <StyledSelect
                              id={field.id}
                              options={receiptTemplateTitles}
                              defaultValue={receiptTemplateTitles[0]}
                              onChange={value => form.setFieldValue(field.name, value)}
                            />
                          )}
                        </Field>
                      </Container>
                    )}
                    <P fontSize="14px" lineHeight="17px" fontWeight="500" mt={4}>
                      <FormattedMessage id="Details" defaultMessage="Details" />
                    </P>
                    <StyledHr my={2} borderColor="black.300" />
                    <AmountDetailsLine
                      value={values.amount || 0}
                      currency={currency}
                      label={<FormattedMessage id="AddFundsModal.fundingAmount" defaultMessage="Funding amount" />}
                    />
                    {Boolean(values.tax?.rate) && (
                      <React.Fragment>
                        <AmountDetailsLine
                          value={-taxAmount}
                          currency={currency}
                          label={`${i18nTaxType(intl, values.tax.type, 'long')} (${Math.round(
                            values.tax.rate * 100,
                          )}%)`}
                        />
                        <StyledHr my={1} borderColor="black.200" />
                        <AmountDetailsLine
                          value={(values.amount || 0) - taxAmount}
                          currency={currency}
                          label={
                            <FormattedMessage
                              defaultMessage="Gross amount without {taxName}"
                              values={{ taxName: i18nTaxType(intl, values.tax.type, 'short') }}
                            />
                          }
                        />
                        {canAddHostFee && <StyledHr my={1} borderColor="black.200" />}
                      </React.Fragment>
                    )}
                    {canAddHostFee && (
                      <AmountDetailsLine
                        value={!hostFee ? 0 : -hostFee}
                        currency={currency}
                        label={
                          <FormattedMessage
                            id="AddFundsModal.hostFees"
                            defaultMessage="Host fee charged to collective ({hostFees})"
                            values={{ hostFees: `${hostFeePercent}%` }}
                          />
                        }
                      />
                    )}
                    <StyledHr my={2} borderColor="black.300" />
                    <AmountDetailsLine
                      value={values.amount - hostFee - taxAmount}
                      currency={currency}
                      label={
                        <FormattedMessage
                          id="AddFundsModal.netAmount"
                          defaultMessage="Net amount received by collective"
                        />
                      }
                      isLargeAmount
                    />
                    <P fontSize="12px" lineHeight="18px" color="black.700" mt={2}>
                      <FormattedMessage
                        id="AddFundsModal.disclaimer"
                        defaultMessage="By clicking add funds, you agree to set aside {amount} in your bank account on behalf of this collective."
                        values={{ amount: formatCurrency(values.amount, currency, { locale: intl.locale }) }}
                      />
                    </P>
                    {fundError && <MessageBoxGraphqlError error={fundError} mt={3} fontSize="13px" />}
                  </ModalBody>
                  <ModalFooter isFullWidth>
                    <Flex justifyContent="center" flexWrap="wrap">
                      <StyledButton
                        type="submit"
                        data-cy="add-funds-submit-btn"
                        buttonStyle="primary"
                        mx={2}
                        mb={1}
                        minWidth={120}
                        loading={isSubmitting}
                      >
                        <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
                      </StyledButton>
                      <StyledButton mx={2} mb={1} minWidth={100} onClick={handleClose} type="button">
                        <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                      </StyledButton>
                    </Flex>
                  </ModalFooter>
                </Form>
              );
            } else {
              return (
                <Form>
                  <ModalBody data-cy="funds-added">
                    <Container>
                      <h3 className="mt-4 text-xl  text-black">
                        <FormattedMessage id="AddFundsModal.FundsAdded" defaultMessage="Funds Added ✅" />
                      </h3>
                      <Container pb={2} mt={3}>
                        <FormattedMessage id="AddFundsModal.YouAdded" defaultMessage="You added:" />
                        <ul className="mt-2 list-inside list-disc pl-3">
                          <li>
                            <strong>{`${fundDetails.fundAmount / 100} ${currency}`}</strong>
                          </li>
                          {Boolean(fundDetails.taxAmount) && (
                            <li>
                              <FormattedMessage
                                defaultMessage="Including {amount} {feeType} ({feeRate})"
                                values={{
                                  amount: (
                                    <FormattedMoneyAmount
                                      amount={fundDetails.taxAmount.valueInCents}
                                      currency={currency}
                                      showCurrencyCode={false}
                                    />
                                  ),
                                  feeType: i18nTaxType(intl, get(fundDetails.taxes, '0.type') || 'Tax', 'long'),
                                  feeRate: `${get(fundDetails.taxes, '0.percentage')}%`,
                                }}
                              />
                            </li>
                          )}
                          {Boolean(fundDetails.hostFeePercent) && (
                            <li>
                              <FormattedMessage
                                defaultMessage="Including {amount} {feeType} ({feeRate})"
                                values={{
                                  amount: (
                                    <FormattedMoneyAmount
                                      currency={currency}
                                      showCurrencyCode={false}
                                      amount={
                                        (fundDetails.fundAmount - (fundDetails.taxAmount?.valueInCents || 0)) *
                                        (fundDetails.hostFeePercent / 100)
                                      }
                                    />
                                  ),
                                  feeType: <FormattedMessage id="HostFee" defaultMessage="Host fee" />,
                                  feeRate: `${fundDetails.hostFeePercent}%`,
                                }}
                              />
                            </li>
                          )}
                          <li>
                            <FormattedMessage id="AddFundsModal.FromTheSource" defaultMessage="From the source" />{' '}
                            <strong>
                              <LinkCollective collective={fundDetails.source} />
                            </strong>
                          </li>
                          <li>
                            <FormattedMessage id="AddFundsModal.ForThePurpose" defaultMessage="For the purpose of" />{' '}
                            <strong>{fundDetails.description}</strong>
                          </li>
                          {fundDetails.memo && (
                            <li>
                              <FormattedMessage defaultMessage="Memo" />
                              {': '}
                              <strong>{fundDetails.memo}</strong>
                            </li>
                          )}
                          {fundDetails.processedAt && (
                            <li>
                              <Span textTransform="capitalize">
                                <FormattedMessage id="processedAt" defaultMessage="Fund received date" />
                              </Span>
                              {': '}
                              <strong>{intl.formatDate(fundDetails.processedAt, { timeZone: 'UTC' })}</strong>
                            </li>
                          )}
                          {fundDetails.tier && (
                            <li>
                              <FormattedMessage defaultMessage="For the tier" />{' '}
                              <StyledLink
                                as={Link}
                                openInNewTab
                                href={`${getCollectivePageRoute(collective)}/contribute/${fundDetails.tier.slug}-${
                                  fundDetails.tier.legacyId
                                }`}
                              >
                                <strong>{fundDetails.tier.name}</strong>
                              </StyledLink>
                            </li>
                          )}
                        </ul>
                      </Container>
                      <Container pb={2} mt={2}>
                        <FormattedMessage id="AddFundsModal.NeedHelp" defaultMessage="Need Help?" />{' '}
                        <StyledLink href="/support" buttonStyle="standard" buttonSize="tiny">
                          <FormattedMessage id="error.contactSupport" defaultMessage="Contact support" />
                        </StyledLink>
                      </Container>
                    </Container>
                  </ModalBody>
                  <ModalFooter isFullWidth>
                    <Flex justifyContent="center" flexWrap="wrap">
                      <StyledButton
                        type="submit"
                        data-cy="add-platform-tip-btn"
                        buttonStyle="primary"
                        mx={2}
                        mb={1}
                        minWidth={120}
                        loading={isSubmitting}
                      >
                        <FormattedMessage id="Finish" defaultMessage="Finish" />
                      </StyledButton>
                      {!fundDetails.showSuccessModal && (
                        <StyledButton mx={2} mb={1} minWidth={100} onClick={handleClose} type="button">
                          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                        </StyledButton>
                      )}
                    </Flex>
                  </ModalFooter>
                </Form>
              );
            }
          }}
        </Formik>
      )}
    </AddFundsModalContainer>
  );
};

AddFundsModal.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    hostFeePercent: PropTypes.number,
    slug: PropTypes.string,
    policies: PropTypes.object,
  }).isRequired,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};

export default AddFundsModal;
