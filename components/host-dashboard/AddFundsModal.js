import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation, useQuery } from '@apollo/client';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Form, Formik } from 'formik';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { formatCurrency } from '../../lib/currency-utils';
import { requireFields } from '../../lib/form-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { require2FAForAdmins } from '../../lib/policies';
import { getCollectivePageRoute } from '../../lib/url-helpers';
import { getCurrentDateInUTC } from '../../lib/utils';

import { collectivePageQuery, getCollectivePageQueryVariables } from '../collective-page/graphql/queries';
import { getBudgetSectionQuery, getBudgetSectionQueryVariables } from '../collective-page/sections/Budget';
import { DefaultCollectiveLabel } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Flex } from '../Grid';
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
import { P, Span } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';
import { TwoFactorAuthRequiredMessage } from '../TwoFactorAuthRequiredMessage';

import illustration from '../contribution-flow/fees-on-top-illustration.png';

const Illustration = styled.img.attrs({ src: illustration })`
  width: 40px;
  height: 40px;
`;

const AddFundsModalContainer = styled(StyledModal)`
  width: 100%;
  max-width: 576px;
  padding: 24px 30px;
  ${props =>
    props.showPlatformTipModal &&
    css`
      background-image: url('/static/images/platform-tip-background.svg');
      background-repeat: no-repeat;
      background-size: 435px;
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
    ) {
      id
      description
      memo
      processedAt
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

const addFundsAccountQuery = gql`
  query AddFundsAccount($slug: String!) {
    account(slug: $slug) {
      id
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
      }
      ... on Host {
        id
        slug
        name
        settings
        plan {
          id
          hostFees
        }
        policies {
          REQUIRE_2FA_FOR_ADMINS
        }
        isTrustedHost
      }
      ... on AccountWithHost {
        addedFundsHostFeePercent: hostFeePercent(paymentMethodType: HOST)
        host {
          id
          slug
          name
          settings
          plan {
            id
            hostFees
          }
          policies {
            REQUIRE_2FA_FOR_ADMINS
          }
          isTrustedHost
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
`;

const addPlatformTipMutation = gql`
  mutation AddPlatformTip($amount: AmountInput!, $transaction: TransactionReferenceInput!) {
    addPlatformTipToTransaction(amount: $amount, transaction: $transaction) {
      id
    }
  }
`;

const getInitialValues = values => ({
  amount: null,
  hostFeePercent: null,
  description: '',
  memo: null,
  processedAt: getCurrentDateInUTC(),
  fromAccount: null,
  tier: null,
  ...values,
});

const validate = values => {
  return requireFields(values, ['amount', 'fromAccount', 'description', 'processedAt']);
};

// Build an account reference. Compatible with accounts from V1 and V2.
const buildAccountReference = input => {
  return typeof input.id === 'string' ? { id: input.id } : { legacyId: input.id };
};

const msg = defineMessages({
  noThankYou: {
    id: 'NoThankYou',
    defaultMessage: 'No thank you',
  },
  other: {
    id: 'platformFee.Other',
    defaultMessage: 'Other',
  },
});

const DEFAULT_PLATFORM_TIP_PERCENTAGES = [0.1, 0.15, 0.2];

const getOptionFromPercentage = (amount, currency, percentage) => {
  const feeAmount = isNaN(amount) ? 0 : Math.round(amount * percentage);
  return {
    // Value must be unique, so we set a special key if feeAmount is 0
    value: feeAmount || `${percentage}%`,
    feeAmount,
    percentage,
    currency,
    label: `${feeAmount / 100} ${currency} (${percentage * 100}%)`,
  };
};

const getOptions = (amount, currency, intl) => {
  return [
    ...DEFAULT_PLATFORM_TIP_PERCENTAGES.map(percentage => {
      return getOptionFromPercentage(amount, currency, percentage);
    }),
    {
      label: intl.formatMessage(msg.noThankYou),
      value: 0,
    },
    {
      label: intl.formatMessage(msg.other),
      value: 'CUSTOM',
    },
  ];
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

const AddFundsModal = ({ collective, ...props }) => {
  const { LoggedInUser } = useLoggedInUser();
  const [fundDetails, setFundDetails] = useState({});
  const { addToast } = useToasts();
  const intl = useIntl();
  const formatOptionLabel = option => {
    if (option.currency) {
      return (
        <span>
          {formatCurrency(option.feeAmount, option.currency, { locale: intl.locale })}{' '}
          <Span color="black.500">({option.percentage * 100}%)</Span>
        </span>
      );
    } else {
      return option.label;
    }
  };
  const [customAmount, setCustomAmount] = useState(0);
  const { data, loading } = useQuery(addFundsAccountQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: collective.slug },
  });
  const account = data?.account;
  const currency = account?.currency;
  const host = account?.isHost ? account : account?.host;

  const options = React.useMemo(
    () => getOptions(fundDetails.fundAmount, currency, intl),
    [fundDetails.fundAmount, currency],
  );
  const [selectedOption, setSelectedOption] = useState(options[3]);
  const [submitAddFunds, { data: addFundsResponse, error: fundError }] = useMutation(addFundsMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [
      {
        context: API_V2_CONTEXT,
        query: getBudgetSectionQuery(true, false, false),
        variables: getBudgetSectionQueryVariables(collective.slug, host?.slug, false),
      },
      { query: collectivePageQuery, variables: getCollectivePageQueryVariables(collective.slug) },
    ],
    awaitRefetchQueries: true,
  });

  const [addPlatformTip, { error: platformTipError }] = useMutation(addPlatformTipMutation, {
    context: API_V2_CONTEXT,
  });

  const tiersNodes = get(data, 'account.tiers.nodes');
  const accountSettings = get(data, 'account.settings');
  const tiersOptions = React.useMemo(
    () => getTiersOptions(intl, tiersNodes, accountSettings),
    [tiersNodes, accountSettings],
  );

  // No modal if logged-out
  if (!LoggedInUser) {
    return null;
  }

  // From the Collective page we pass host and collective as API v1 objects
  // From the Host dashboard we pass host and collective as API v2 objects
  const canAddHostFee = host?.plan?.hostFees && collective.id !== host?.id;
  const hostFeePercent = account?.addedFundsHostFeePercent || collective.hostFeePercent;
  const defaultHostFeePercent = canAddHostFee ? hostFeePercent : 0;
  const canAddPlatformTip = host?.isTrustedHost;
  const receiptTemplates = host?.settings?.invoice?.templates;

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
    setFundDetails({ showPlatformTipModal: false });
    setSelectedOption(options[3]);
    setCustomAmount(0);
    props.onClose();
  };

  return (
    <AddFundsModalContainer
      {...props}
      trapFocus
      showPlatformTipModal={fundDetails.showPlatformTipModal}
      onClose={handleClose}
    >
      <CollectiveModalHeader collective={collective} onClick={handleClose} />
      {loading ? (
        <LoadingPlaceholder mt={2} height={200} />
      ) : require2FAForAdmins(host) && !LoggedInUser.hasTwoFactorAuth ? (
        <TwoFactorAuthRequiredMessage borderWidth={0} noTitle />
      ) : (
        <Formik
          initialValues={getInitialValues({ hostFeePercent: defaultHostFeePercent, account: collective })}
          enableReinitialize={true}
          validate={validate}
          onSubmit={async (values, formik) => {
            if (!fundDetails.showPlatformTipModal) {
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
                },
              });

              const resultOrder = result.data.addFunds;
              setFundDetails({
                showPlatformTipModal: true,
                fundAmount: values.amount,
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
            } else if (selectedOption.value !== 0) {
              const creditTransaction = addFundsResponse.addFunds.transactions.filter(
                transaction => transaction.type === 'CREDIT',
              )[0];
              await addPlatformTip({
                variables: {
                  ...values,
                  amount: { valueInCents: selectedOption.value !== 'CUSTOM' ? selectedOption.value : customAmount },
                  transaction: { id: creditTransaction.id },
                },
              });
              handleClose();
              addToast({
                type: TOAST_TYPE.SUCCESS,
                message: (
                  <FormattedMessage id="AddFundsModal.Success" defaultMessage="Platform tip successfully added" />
                ),
              });
            } else {
              handleClose();
            }
          }}
        >
          {({ values, isSubmitting }) => {
            const hostFeePercent = isNaN(values.hostFeePercent) ? defaultHostFeePercent : values.hostFeePercent;
            const hostFee = Math.round(values.amount * (hostFeePercent / 100));

            const defaultSources = [];
            defaultSources.push({
              value: host,
              label: <DefaultCollectiveLabel value={host} />,
            });
            if (host?.id !== account.id) {
              defaultSources.push({ value: account, label: <DefaultCollectiveLabel value={account} /> });
            }

            if (!fundDetails.showPlatformTipModal) {
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
                          types={['USER', 'ORGANIZATION']}
                          creatable
                          error={field.error}
                          createCollectiveOptionalFields={['location.address', 'location.country']}
                          onBlur={() => form.setFieldTouched(field.name, true)}
                          customOptions={defaultSources}
                          onChange={({ value }) => form.setFieldValue(field.name, value)}
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
                          isSearchable={options.length > 10}
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
                          <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                          {` `}
                          <StyledTooltip
                            content={() => <FormattedMessage defaultMessage="Date the funds were received." />}
                          >
                            <InfoCircle size={16} />
                          </StyledTooltip>
                        </span>
                      }
                      mt={3}
                    >
                      {({ field }) => <StyledInput data-cy="add-funds-processedAt" {...field} />}
                    </Field>
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
                    {canAddHostFee && (
                      <AmountDetailsLine
                        value={hostFee}
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
                      value={values.amount - hostFee}
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
                      <h3>
                        <FormattedMessage id="AddFundsModal.FundsAdded" defaultMessage="Funds Added ✅" />
                      </h3>
                      <Container pb={2}>
                        <FormattedMessage id="AddFundsModal.YouAdded" defaultMessage="You added:" />
                        <ul>
                          <li>
                            <strong>{`${fundDetails.fundAmount / 100} ${currency}`}</strong>
                          </li>
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
                      <Container pb={2}>
                        <FormattedMessage id="AddFundsModal.NeedHelp" defaultMessage="Need Help?" />{' '}
                        <StyledLink href="/support" buttonStyle="standard" buttonSize="tiny">
                          <FormattedMessage id="error.contactSupport" defaultMessage="Contact support" />
                        </StyledLink>
                      </Container>
                    </Container>
                    {canAddPlatformTip && hostFee === 0 && (
                      <Container>
                        <StyledHr my={3} borderColor="black.300" />
                        <div>
                          <P fontWeight="400" fontSize="14px" lineHeight="21px" color="black.900" my={32}>
                            <FormattedMessage
                              id="AddFundsModal.platformTipInfo"
                              defaultMessage="Since you are not charging a host fee to the collective, Open Collective is free to use. We rely on your generosity to keep this possible!"
                            />
                          </P>
                          <Flex justifyContent="space-between" flexWrap={['wrap', 'nowrap']}>
                            <Flex alignItems="center">
                              <Illustration alt="" />
                              <P fontWeight={500} fontSize="12px" lineHeight="18px" color="black.900" mx={10}>
                                <FormattedMessage
                                  id="AddFundsModal.thankYou"
                                  defaultMessage="Thank you for supporting us. Platform tip will be deducted from the host budget:"
                                />
                              </P>
                            </Flex>
                            <StyledSelect
                              aria-label="Donation percentage"
                              data-cy="donation-percentage"
                              width="100%"
                              maxWidth={['100%', 190]}
                              mt={[2, 0]}
                              isSearchable={false}
                              fontSize="15px"
                              options={options}
                              onChange={setSelectedOption}
                              formatOptionLabel={formatOptionLabel}
                              value={selectedOption}
                            />
                          </Flex>
                          {selectedOption.value === 'CUSTOM' && (
                            <Flex justifyContent="flex-end" mt={2}>
                              <StyledInputAmount
                                id="platformTip"
                                currency={currency}
                                onChange={amount => setCustomAmount(amount)}
                                defaultValue={options[1].value}
                              />
                            </Flex>
                          )}
                        </div>
                        {platformTipError && <MessageBoxGraphqlError error={platformTipError} mt={3} fontSize="13px" />}
                      </Container>
                    )}
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
                        {selectedOption.value !== 0 ? (
                          <FormattedMessage id="AddFundsModal.tipAndFinish" defaultMessage="Tip and Finish" />
                        ) : (
                          <FormattedMessage id="Finish" defaultMessage="Finish" />
                        )}
                      </StyledButton>
                      {!fundDetails.showPlatformTipModal && (
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
};

export default AddFundsModal;
