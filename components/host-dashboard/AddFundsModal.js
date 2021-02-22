import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import { requireFields } from '../../lib/form-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { collectivePageQuery, getCollectivePageQueryVariables } from '../collective-page/graphql/queries';
import { budgetSectionQuery, getBudgetSectionQueryVariables } from '../collective-page/sections/Budget';
import { DefaultCollectiveLabel } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Flex } from '../Grid';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputPercentage from '../StyledInputPercentage';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from '../StyledModal';
import { P, Span } from '../Text';
import { useUser } from '../UserProvider';

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
    $platformTipPercent: Int
  ) {
    addFunds(
      account: $account
      fromAccount: $fromAccount
      amount: $amount
      description: $description
      hostFeePercent: $hostFeePercent
      platformFeePercent: $platformFeePercent
      platformTipPercent: $platformTipPercent
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
  platformTipPercent: 0,
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

const AddFundsModal = ({ host, collective, ...props }) => {
  const { LoggedInUser } = useUser();

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

  const canAddPlatformFee = LoggedInUser.isRoot();
  const defaultPlatformFeePercent = 0;
  const defaultPlatformTipPercent = 0;

  if (!LoggedInUser) {
    return null;
  }

  return (
    <StyledModal width="100%" maxWidth={435} {...props} trapFocus>
      <CollectiveModalHeader collective={collective} />
      <Formik
        initialValues={getInitialValues({ hostFeePercent: defaultHostFeePercent, account: collective })}
        validate={validate}
        onSubmit={values =>
          submitAddFunds({
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
          const platformTipPercent = isNaN(values.platformTipPercent)
            ? defaultPlatformTipPercent
            : values.platformTipPercent;
          const hostFee = Math.round(values.amount * (hostFeePercent / 100));
          const platformFee = Math.round(values.amount * (platformFeePercent / 100));
          const platformTip = Math.round(values.amount * (platformTipPercent / 100));

          return (
            <Form>
              <ModalBody>
                <P fontSize="16px" lineHeight="24px" fontWeight="500" mt={3}>
                  <FormattedMessage
                    id="AddFundsToCollectiveModal.Title"
                    defaultMessage="Add funds to the Collective:"
                  />
                </P>
                <Flex mt={3} flexWrap="wrap">
                  <StyledInputFormikField
                    name="amount"
                    htmlFor="addFunds-amount"
                    label={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}
                    required
                    flex="1 1"
                  >
                    {({ form, field }) => (
                      <StyledInputAmount
                        id={field.id}
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
                      label={<FormattedMessage id="HostFee" defaultMessage="Host fee" />}
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
                <Flex mt={3} flexWrap="wrap">
                  {canAddPlatformFee && (
                    <StyledInputFormikField
                      name="platformFeePercent"
                      htmlFor="addFunds-platformFeePercent"
                      label={<FormattedMessage id="PlatformFee" defaultMessage="Platform fee" />}
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
                  )}
                  {!canAddPlatformFee && (
                    <StyledInputFormikField
                      name="platformTipPercent"
                      htmlFor="addFunds-platformTipPercent"
                      label={<FormattedMessage id="PlatformTip" defaultMessage="Platform Tip" />}
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
                  )}
                </Flex>
                <StyledInputFormikField
                  name="description"
                  htmlFor="addFunds-description"
                  label={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
                  mt={3}
                >
                  {({ field }) => <StyledInput {...field} />}
                </StyledInputFormikField>
                <StyledInputFormikField
                  name="fromAccount"
                  htmlFor="addFunds-fromAccount"
                  label={<FormattedMessage id="AddFunds.source" defaultMessage="Source" />}
                  mt={3}
                >
                  {({ form, field }) => (
                    <CollectivePickerAsync
                      inputId={field.id}
                      types={['USER', 'ORGANIZATION']}
                      creatable
                      error={field.error}
                      createCollectiveOptionalFields={['location.address', 'location.country']}
                      onBlur={() => form.setFieldTouched(field.name, true)}
                      customOptions={[{ value: host, label: <DefaultCollectiveLabel value={host} /> }]}
                      onChange={({ value }) => form.setFieldValue(field.name, value)}
                    />
                  )}
                </StyledInputFormikField>
                <P fontSize="14px" lineHeight="17px" fontWeight="500" mt={4}>
                  <FormattedMessage id="Details" defaultMessage="Details" />
                </P>
                <StyledHr my={2} borderColor="black.300" />
                <AmountDetailsLine
                  value={values.amount || 0}
                  currency={collective.currency}
                  label={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}
                />
                {canAddHostFee && (
                  <AmountDetailsLine
                    value={hostFee}
                    currency={collective.currency}
                    label={
                      <FormattedMessage
                        id="addfunds.hostFees"
                        defaultMessage="Host fees ({hostFees})"
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
                        id="addfunds.platformFees"
                        defaultMessage="Platform fees ({platformFees})"
                        values={{ platformFees: `${platformFeePercent}%` }}
                      />
                    }
                  />
                )}
                {!canAddPlatformFee && (
                  <AmountDetailsLine
                    value={platformTip}
                    currency={collective.currency}
                    label={
                      <FormattedMessage
                        id="addfunds.platformTip"
                        defaultMessage="Platform Tip ({platformTip})"
                        values={{ platformTip: `${platformTipPercent}%` }}
                      />
                    }
                  />
                )}
                <StyledHr my={2} borderColor="black.300" />
                <AmountDetailsLine
                  value={values.amount - hostFee - platformFee - platformTip}
                  currency={collective.currency}
                  label={<FormattedMessage id="addfunds.netAmount" defaultMessage="Net amount" />}
                  isLargeAmount
                />
                <P fontSize="12px" lineHeight="18px" color="black.700" mt={2}>
                  <FormattedMessage
                    id="addfunds.disclaimer"
                    defaultMessage="You will set aside {amount} in your bank account for this purpose."
                    values={{ amount: formatCurrency(values.amount, collective.currency) }}
                  />
                </P>
                {error && <MessageBoxGraphqlError error={error} mt={3} fontSize="13px" />}
              </ModalBody>
              <ModalFooter isFullWidth>
                <Flex justifyContent="center" flexWrap="wrap">
                  <StyledButton
                    type="submit"
                    buttonStyle="primary"
                    mx={2}
                    mb={1}
                    minWidth={120}
                    disabled={!dirty || !isValid}
                    loading={isSubmitting}
                  >
                    <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
                  </StyledButton>
                  <StyledButton mx={2} mb={1} minWidth={100} onClick={props.onClose} type="button">
                    <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                  </StyledButton>
                </Flex>
              </ModalFooter>
            </Form>
          );
        }}
      </Formik>
    </StyledModal>
  );
};

AddFundsModal.propTypes = {
  host: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    plan: PropTypes.shape({
      hostFees: PropTypes.bool,
    }),
  }).isRequired,
  collective: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    hostFeePercent: PropTypes.number,
    platformFeePercent: PropTypes.number,
    platformTipPercent: PropTypes.number,
    slug: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func,
};

export default AddFundsModal;
