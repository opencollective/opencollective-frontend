import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Form, Formik } from 'formik';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { formatCurrency } from '../../lib/currency-utils';
import { requireFields } from '../../lib/form-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { collectivePageQuery, getCollectivePageQueryVariables } from '../collective-page/graphql/queries';
import { budgetSectionQuery, getBudgetSectionQueryVariables } from '../collective-page/sections/Budget';
import { DefaultCollectiveLabel } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Flex } from '../Grid';
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
import { useUser } from '../UserProvider';

import illustration from '../contribution-flow/fees-on-top-illustration.png';

const Illustration = styled.img.attrs({ src: illustration })`
  width: 40px;
  height: 40px;
`;

const PlatformTipContainer = styled(StyledModal)`
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

const addFundsMutation = gqlV2/* GraphQL */ `
  mutation AddFunds(
    $fromAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $amount: AmountInput!
    $description: String!
    $hostFeePercent: Int!
    $platformFeePercent: Int
  ) {
    addFunds(
      account: $account
      fromAccount: $fromAccount
      amount: $amount
      description: $description
      hostFeePercent: $hostFeePercent
      platformFeePercent: $platformFeePercent
    ) {
      id
      toAccount {
        id
        stats {
          balance {
            valueInCents
          }
        }
      }
    }
  }
`;

const getInitialValues = values => ({
  amount: null,
  hostFeePercent: null,
  platformFeePercent: 0,
  description: '',
  fromAccount: null,
  ...values,
});

const validate = values => {
  return requireFields(values, ['amount', 'fromAccount', 'description']);
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

const AddFundsModal = ({ host, collective, ...props }) => {
  const { LoggedInUser } = useUser();
  const [fundDetails, setFundDetails] = useState({});
  const intl = useIntl();
  const options = React.useMemo(() => getOptions(fundDetails.fundAmount, collective.currency, intl), [
    fundDetails.fundAmount,
    collective.currency,
  ]);
  const formatOptionLabel = option => {
    if (option.currency) {
      return (
        <span>
          {formatCurrency(option.feeAmount, option.currency)}{' '}
          <Span color="black.500">({option.percentage * 100}%)</Span>
        </span>
      );
    } else {
      return option.label;
    }
  };
  const [selectedOption, setSelectedOption] = useState(options[1]);

  const [submitAddFunds, { error }] = useMutation(addFundsMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [
      {
        query: budgetSectionQuery,
        context: API_V2_CONTEXT,
        variables: getBudgetSectionQueryVariables(collective.slug),
      },
      { query: collectivePageQuery, variables: getCollectivePageQueryVariables(collective.slug) },
    ],
    awaitRefetchQueries: true,
  });

  // From the Collective page we pass host and collective as API v1 objects
  // From the Host dashboard we pass host and collective as API v2 objects
  const canAddHostFee = host.plan?.hostFees && collective.id !== host.id;
  const defaultHostFeePercent = canAddHostFee ? collective.hostFeePercent : 0;

  // We don't want to use Platform Fees anymore for Hosts that switched to the new model
  const canAddPlatformFee = LoggedInUser.isRoot() && host.plan?.hostFeeSharePercent === 0;
  const defaultPlatformFeePercent = 0;

  if (!LoggedInUser) {
    return null;
  }

  const handleClose = () => {
    setFundDetails({ showPlatformTipModal: false });
    props.onClose();
  };

  return (
    <PlatformTipContainer
      width="100%"
      maxWidth={435}
      {...props}
      trapFocus
      showPlatformTipModal={fundDetails.showPlatformTipModal}
    >
      <CollectiveModalHeader collective={collective} onClick={handleClose} />
      <Formik
        initialValues={getInitialValues({ hostFeePercent: defaultHostFeePercent, account: collective })}
        validate={validate}
        onSubmit={values =>
          !fundDetails.showPlatformTipModal
            ? submitAddFunds({
                variables: {
                  ...values,
                  amount: { valueInCents: values.amount },
                  fromAccount: buildAccountReference(values.fromAccount),
                  account: buildAccountReference(values.account),
                },
              }).then(() => {
                setFundDetails({
                  showPlatformTipModal: true,
                  fundAmount: values.amount,
                  description: values.description,
                  source: values.fromAccount.name,
                });
              })
            : submitAddFunds({
                variables: {
                  ...values,
                  amount: { valueInCents: values.amount },
                  fromAccount: buildAccountReference(values.fromAccount),
                  account: buildAccountReference(values.account),
                },
              }).then(props.onClose)
        }
      >
        {({ values, isSubmitting, isValid, dirty }) => {
          const hostFeePercent = isNaN(values.hostFeePercent) ? defaultHostFeePercent : values.hostFeePercent;
          const platformFeePercent = isNaN(values.platformFeePercent)
            ? defaultPlatformFeePercent
            : values.platformFeePercent;
          const hostFee = Math.round(values.amount * (hostFeePercent / 100));
          const platformFee = Math.round(values.amount * (platformFeePercent / 100));

          const defaultSources = [];
          defaultSources.push({ value: host, label: <DefaultCollectiveLabel value={host} /> });
          if (host.id !== collective.id) {
            defaultSources.push({ value: collective, label: <DefaultCollectiveLabel value={collective} /> });
          }

          if (!fundDetails.showPlatformTipModal) {
            return (
              <Form>
                <h3>
                  <FormattedMessage id="AddFundsModal.SubHeading" defaultMessage="Add Funds to the Collective" />
                </h3>
                <ModalBody>
                  <StyledInputFormikField
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
                  </StyledInputFormikField>
                  <StyledInputFormikField
                    name="description"
                    htmlFor="addFunds-description"
                    label={<FormattedMessage id="AddFundsModal.description" defaultMessage="Purpose Description" />}
                    mt={3}
                  >
                    {({ field }) => <StyledInput data-cy="add-funds-description" {...field} />}
                  </StyledInputFormikField>
                  <Flex mt={3} flexWrap="wrap">
                    <StyledInputFormikField
                      name="amount"
                      htmlFor="addFunds-amount"
                      label={<FormattedMessage id="AddFundsModal.amount" defaultMessage="Amount" />}
                      required
                      flex="1 1"
                    >
                      {({ form, field }) => (
                        <StyledInputAmount
                          id={field.id}
                          data-cy="add-funds-amount"
                          currency={collective.currency}
                          placeholder="0.00"
                          error={field.error}
                          value={field.value}
                          maxWidth="100%"
                          onChange={value => form.setFieldValue(field.name, value)}
                          onBlur={() => form.setFieldTouched(field.name, true)}
                        />
                      )}
                    </StyledInputFormikField>
                    {canAddHostFee && (
                      <StyledInputFormikField
                        name="hostFeePercent"
                        htmlFor="addFunds-hostFeePercent"
                        label={
                          <span>
                            <FormattedMessage id="AddFundsModal.hostFee" defaultMessage="Host Fee" />
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
                      </StyledInputFormikField>
                    )}
                  </Flex>
                  {canAddPlatformFee && (
                    <Flex mt={3} flexWrap="wrap">
                      <StyledInputFormikField
                        name="platformFeePercent"
                        htmlFor="addFunds-platformFeePercent"
                        label={<FormattedMessage id="AddFundsModal.PlatformFee" defaultMessage="Platform fee" />}
                      >
                        {({ form, field }) => (
                          <StyledInputPercentage
                            id={field.id}
                            placeholder="0"
                            value={field.value}
                            error={field.error}
                            onChange={value => form.setFieldValue(field.name, value)}
                            onBlur={() => form.setFieldTouched(field.name, true)}
                          />
                        )}
                      </StyledInputFormikField>
                    </Flex>
                  )}
                  <P fontSize="14px" lineHeight="17px" fontWeight="500" mt={4}>
                    <FormattedMessage id="AddFundsModal.Details" defaultMessage="Details" />
                  </P>
                  <StyledHr my={2} borderColor="black.300" />
                  <AmountDetailsLine
                    value={values.amount || 0}
                    currency={collective.currency}
                    label={<FormattedMessage id="AddFundsModal.fundingAmount" defaultMessage="Funding amount" />}
                  />
                  {canAddHostFee && (
                    <AmountDetailsLine
                      value={hostFee}
                      currency={collective.currency}
                      label={
                        <FormattedMessage
                          id="AddFundsModal.hostFees"
                          defaultMessage="Host fee charged to collective ({hostFees})"
                          values={{ hostFees: `${hostFeePercent}%` }}
                        />
                      }
                    />
                  )}
                  {canAddPlatformFee && (
                    <AmountDetailsLine
                      value={platformFee}
                      currency={collective.currency}
                      label={
                        <FormattedMessage
                          id="AddFundsModal.platformFees"
                          defaultMessage="Platform fees ({platformFees})"
                          values={{ platformFees: `${platformFeePercent}%` }}
                        />
                      }
                    />
                  )}
                  <StyledHr my={2} borderColor="black.300" />
                  <AmountDetailsLine
                    value={values.amount - hostFee - platformFee}
                    currency={collective.currency}
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
                      values={{ amount: formatCurrency(values.amount, collective.currency) }}
                    />
                  </P>
                  {error && <MessageBoxGraphqlError error={error} mt={3} fontSize="13px" />}
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
                      disabled={!dirty || !isValid}
                      loading={isSubmitting}
                    >
                      <FormattedMessage id="AddFundsModal.addFunds" defaultMessage="Add Funds" />
                    </StyledButton>
                    <StyledButton mx={2} mb={1} minWidth={100} onClick={props.onClose} type="button">
                      <FormattedMessage id="AddFundsModal.cancel" defaultMessage="Cancel" />
                    </StyledButton>
                  </Flex>
                </ModalFooter>
              </Form>
            );
          } else {
            return (
              <Form>
                <ModalBody>
                  <Container>
                    <h3>
                      <FormattedMessage id="AddFundsModal.FundsAdded" defaultMessage="Funds Added ✅" />
                    </h3>
                    <Container pb={2}>
                      <FormattedMessage id="AddFundsModal.YouAdded" defaultMessage="You added:" />
                      <ul>
                        <li>
                          <strong>{`${fundDetails.fundAmount / 100} ${collective.currency}`}</strong>
                        </li>
                        <li>
                          <FormattedMessage id="AddFundsModal.FromTheSource" defaultMessage="From the source" />{' '}
                          <strong>{fundDetails.source}</strong>
                        </li>
                        <li>
                          <FormattedMessage id="AddFundsModal.ForThePurpose" defaultMessage="For the purpose of" />{' '}
                          <strong>{fundDetails.description}</strong>
                        </li>
                      </ul>
                    </Container>
                    <Container pb={2}>
                      <FormattedMessage id="AddFundsModal.NeedHelp" defaultMessage="Need Help?" />{' '}
                      <StyledLink href="/support" buttonStyle="standard" buttonSize="tiny">
                        <FormattedMessage id="error.contactSupport" defaultMessage="Contact support" />
                      </StyledLink>
                    </Container>
                  </Container>
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
                        <Illustration />
                        <P fontWeight={500} fontSize="12px" lineHeight="18px" color="black.900" mx={10}>
                          <FormattedMessage
                            id="AddFundsModal.thankYou"
                            defaultMessage="Thank you for supporting us. Platform tip will be deducted from the host budget:"
                          />
                        </P>
                      </Flex>
                      <StyledSelect
                        aria-label="Donation percentage"
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
                          currency={collective.currency}
                          onChange={() => {}}
                          value={options[1].value}
                        />
                      </Flex>
                    )}
                  </div>
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
                      {selectedOption.value !== 0 ? (
                        <FormattedMessage id="AddFundsModal.tipAndFinish" defaultMessage="Tip and Finish" />
                      ) : (
                        <FormattedMessage id="AddFundsModal.finish" defaultMessage="Finish" />
                      )}
                    </StyledButton>
                    <StyledButton mx={2} mb={1} minWidth={100} onClick={handleClose} type="button">
                      <FormattedMessage id="AddFundsModal.cancel" defaultMessage="Cancel" />
                    </StyledButton>
                  </Flex>
                </ModalFooter>
              </Form>
            );
          }
        }}
      </Formik>
    </PlatformTipContainer>
  );
};

AddFundsModal.propTypes = {
  host: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    plan: PropTypes.shape({
      hostFees: PropTypes.bool,
      hostFeeSharePercent: PropTypes.number,
    }),
  }).isRequired,
  collective: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    hostFeePercent: PropTypes.number,
    platformFeePercent: PropTypes.number,
    slug: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func,
};

export default AddFundsModal;
