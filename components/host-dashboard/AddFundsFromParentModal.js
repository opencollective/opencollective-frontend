import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { requireFields } from '../../lib/form-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import {
  budgetSectionQuery,
  collectivePageQuery,
  getCollectivePageQueryVariables,
} from '../collective-page/graphql/queries';
import { getBudgetSectionQueryVariables } from '../collective-page/sections/Budget';
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
import StyledLink from '../StyledLink';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from '../StyledModal';
import { P, Span } from '../Text';
import { useUser } from '../UserProvider';

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
    $hostFeePercent: Float!
    $platformFeePercent: Float
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
      transactions {
        id
        type
      }
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

const AddFundsFromParentModal = ({ host, collective, ...props }) => {
  const { LoggedInUser } = useUser();
  const [fundDetails, setFundDetails] = useState({});

  const [submitAddFunds, { error: fundError }] = useMutation(addFundsMutation, {
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
      onClose={handleClose}
    >
      <CollectiveModalHeader collective={collective} onClick={handleClose} />
      <Formik
        initialValues={getInitialValues({
          account: collective,
          fromAccount: collective.parentCollective,
        })}
        validate={validate}
        onSubmit={async values => {
          await submitAddFunds({
            variables: {
              ...values,
              amount: { valueInCents: values.amount },
              platformTip: { valueInCents: 0 },
              fromAccount: buildAccountReference(values.fromAccount),
              account: buildAccountReference(values.account),
            },
          });
          setFundDetails({
            showPlatformTipModal: true,
            fundAmount: values.amount,
            description: values.description,
            source: values.fromAccount.name,
          });
        }}
      >
        {({ values, isSubmitting, isValid, dirty }) => {
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
                        disabled={true}
                        getDefaultOptions={build => build(collective.parentCollective)}
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
                    label={<FormattedMessage id="AddFundsModal.description" defaultMessage="Description" />}
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
                  </Flex>
                  <P fontSize="14px" lineHeight="17px" fontWeight="500" mt={4}>
                    <FormattedMessage id="AddFundsModal.Details" defaultMessage="Details" />
                  </P>
                  <StyledHr my={2} borderColor="black.300" />
                  <AmountDetailsLine
                    value={values.amount || 0}
                    currency={collective.currency}
                    label={<FormattedMessage id="AddFundsModal.fundingAmount" defaultMessage="Funding amount" />}
                  />
                  <StyledHr my={2} borderColor="black.300" />
                  <AmountDetailsLine
                    value={values.amount}
                    currency={collective.currency}
                    label={
                      <FormattedMessage
                        id="AddFundsModal.netAmount"
                        defaultMessage="Net amount received by collective"
                      />
                    }
                    isLargeAmount
                  />
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
                      disabled={!dirty || !isValid}
                      loading={isSubmitting}
                    >
                      <FormattedMessage id="AddFundsModal.addFunds" defaultMessage="Add Funds" />
                    </StyledButton>
                    <StyledButton mx={2} mb={1} minWidth={100} onClick={handleClose} type="button">
                      <FormattedMessage id="AddFundsModal.cancel" defaultMessage="Cancel" />
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
                      <FormattedMessage id="AddFundsModal.finish" defaultMessage="Finish" />
                    </StyledButton>
                    {!fundDetails.showPlatformTipModal && (
                      <StyledButton mx={2} mb={1} minWidth={100} onClick={handleClose} type="button">
                        <FormattedMessage id="AddFundsModal.cancel" defaultMessage="Cancel" />
                      </StyledButton>
                    )}
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

AddFundsFromParentModal.propTypes = {
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
    slug: PropTypes.string,
    parentCollective: PropTypes.object,
  }).isRequired,
  onClose: PropTypes.func,
};

export default AddFundsFromParentModal;
