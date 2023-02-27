import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { Formik } from 'formik';
import { findLast, get, omit } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';

import { BANK_TRANSFER_DEFAULT_INSTRUCTIONS, PayoutMethodType } from '../../../lib/constants/payout-method';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { formatManualInstructions } from '../../../lib/payment-method-utils';

import ConfirmationModal from '../../ConfirmationModal';
import Container from '../../Container';
import PayoutBankInformationForm from '../../expenses/PayoutBankInformationForm';
import { Box, Flex } from '../../Grid';
import Image from '../../Image';
import Loading from '../../Loading';
import StyledButton from '../../StyledButton';
import { P } from '../../Text';
import UpdateBankDetailsForm from '../UpdateBankDetailsForm';
import { formatAccountDetails } from '../utils';

import SettingsSectionTitle from './SettingsSectionTitle';

const hostQuery = gql`
  query EditCollectiveBankTransferHost($slug: String) {
    host(slug: $slug) {
      id
      slug
      legacyId
      currency
      settings
      connectedAccounts {
        id
        service
      }
      plan {
        id
        hostedCollectives
        manualPayments
        name
      }
      payoutMethods {
        id
        name
        data
        type
      }
    }
  }
`;

const createPayoutMethodMutation = gql`
  mutation EditCollectiveBankTransferCreatePayoutMethod(
    $payoutMethod: PayoutMethodInput!
    $account: AccountReferenceInput!
  ) {
    createPayoutMethod(payoutMethod: $payoutMethod, account: $account) {
      data
      id
      name
      type
    }
  }
`;

const removePayoutMethodMutation = gql`
  mutation EditCollectiveBankTransferRemovePayoutMethod($payoutMethodId: String!) {
    removePayoutMethod(payoutMethodId: $payoutMethodId) {
      id
    }
  }
`;

const editBankTransferMutation = gql`
  mutation EditCollectiveBankTransfer($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const renderBankInstructions = (instructions, bankAccountInfo) => {
  const formatValues = {
    account: bankAccountInfo ? formatAccountDetails(bankAccountInfo) : '',
    reference: '76400',
    OrderId: '76400',
    amount: '$30',
    collective: 'acme',
  };

  return formatManualInstructions(instructions, formatValues);
};

const BankTransfer = props => {
  const { loading, data } = useQuery(hostQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: props.collectiveSlug },
  });
  const [createPayoutMethod] = useMutation(createPayoutMethodMutation, { context: API_V2_CONTEXT });
  const [removePayoutMethod] = useMutation(removePayoutMethodMutation, { context: API_V2_CONTEXT });
  const [editBankTransfer] = useMutation(editBankTransferMutation, { context: API_V2_CONTEXT });
  const [showForm, setShowForm] = React.useState(false);
  const [showRemoveBankConfirmationModal, setShowRemoveBankConfirmationModal] = React.useState(false);

  if (loading) {
    return <Loading />;
  }

  const existingManualPaymentMethod = !!get(data.host, 'settings.paymentMethods.manual');
  const showEditManualPaymentMethod = !showForm && data.host;
  const existingPayoutMethod = data.host.payoutMethods.find(pm => pm.data.isManualBankTransfer);
  const useStructuredForm =
    !existingManualPaymentMethod || (existingManualPaymentMethod && existingPayoutMethod) ? true : false;
  const instructions = data.host.settings?.paymentMethods?.manual?.instructions || BANK_TRANSFER_DEFAULT_INSTRUCTIONS;

  // Fix currency if the existing payout method already matches the collective currency
  // or if it was already defined by Stripe
  const existingPayoutMethodMatchesCurrency = existingPayoutMethod?.data?.currency === data.host.currency;
  const isConnectedToStripe = data.host.connectedAccounts?.find?.(ca => ca.service === 'stripe');
  const fixedCurrency =
    useStructuredForm && (existingPayoutMethodMatchesCurrency || isConnectedToStripe) && data.host.currency;

  const initialValues = {
    ...(existingPayoutMethod || { data: { currency: fixedCurrency || data.host.currency } }),
    instructions,
  };

  const latestBankAccount = findLast(
    data?.host?.payoutMethods,
    payoutMethod => payoutMethod.type === PayoutMethodType.BANK_ACCOUNT,
  );

  return (
    <Flex className="EditPaymentMethods" flexDirection="column">
      {showEditManualPaymentMethod && (
        <Fragment>
          <SettingsSectionTitle>
            <FormattedMessage id="editCollective.receivingMoney.bankTransfers" defaultMessage="Bank Transfers" />
          </SettingsSectionTitle>

          <Box>
            <Container fontSize="12px" mt={2} color="black.600" textAlign="left">
              {data.host.plan.manualPayments ? (
                <FormattedMessage
                  id="paymentMethods.manual.add.info"
                  defaultMessage="Define instructions for contributions via bank transfer. When funds arrive, you can mark them as confirmed to credit the budget balance."
                />
              ) : (
                <FormattedMessage
                  id="paymentMethods.manual.upgradePlan"
                  defaultMessage="Subscribe to our special plans for hosts"
                />
              )}
            </Container>
          </Box>
          {existingManualPaymentMethod && (
            <Box pt={2}>
              <Container fontSize="12px" mt={2} mb={2} color="black.600" textAlign="left">
                <FormattedMessage defaultMessage="Preview of bank transfer instructions" />
              </Container>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                {renderBankInstructions(instructions, latestBankAccount?.data)}
              </pre>
            </Box>
          )}
          <Box alignItems="center" my={2}>
            <StyledButton
              buttonStyle="standard"
              buttonSize="small"
              disabled={!data.host.plan.manualPayments}
              onClick={() => {
                setShowForm(true);
                props.hideTopsection(true);
              }}
            >
              {existingManualPaymentMethod ? (
                <FormattedMessage id="paymentMethods.manual.edit" defaultMessage="Edit bank details" />
              ) : (
                <Fragment>
                  <Add size="1em" />
                  {'  '}
                  <FormattedMessage id="paymentMethods.manual.add" defaultMessage="Set bank details" />
                </Fragment>
              )}
            </StyledButton>{' '}
            {existingManualPaymentMethod && (
              <StyledButton
                mt={[2, 0]}
                buttonStyle="standard"
                buttonSize="small"
                disabled={!data.host.plan.manualPayments}
                onClick={() => {
                  setShowRemoveBankConfirmationModal(true);
                }}
              >
                <FormattedMessage defaultMessage="Remove bank details" />
              </StyledButton>
            )}
          </Box>
        </Fragment>
      )}
      {showForm && (
        <Formik
          initialValues={initialValues}
          onSubmit={async (values, { setSubmitting }) => {
            const { data, instructions } = values;
            if (data?.currency && data?.type) {
              await createPayoutMethod({
                variables: {
                  payoutMethod: { data: { ...data, isManualBankTransfer: true }, type: 'BANK_ACCOUNT' },
                  account: { slug: props.collectiveSlug },
                },
              });
            }
            await editBankTransfer({
              variables: {
                key: 'paymentMethods.manual.instructions',
                value: instructions,
                account: { slug: props.collectiveSlug },
              },
              refetchQueries: [
                { query: hostQuery, context: API_V2_CONTEXT, variables: { slug: props.collectiveSlug } },
              ],
              awaitRefetchQueries: true,
            });
            setSubmitting(false);
            setShowForm(false);
            props.hideTopsection(false);
          }}
        >
          {({ handleSubmit, isSubmitting, setFieldValue, values }) => (
            <form onSubmit={handleSubmit}>
              <SettingsSectionTitle>
                <FormattedMessage id="paymentMethods.manual.HowDoesItWork" defaultMessage="How does it work?" />
              </SettingsSectionTitle>
              <Flex flexDirection={['column', 'row']} alignItems={['center', 'start']}>
                <P mr={2}>
                  <FormattedMessage
                    id="paymentMethod.manual.edit.description"
                    defaultMessage='Contributors can choose "Bank Transfer" as a payment method at checkout and instructions will be automatically emailed to them. Once received, you can mark the transaction as confirmed to credit the budget on Open Collective.'
                  />
                </P>
                <Image alt="" src="/static/images/ManualPaymentMethod-BankTransfer.png" width={350} height={168} />
              </Flex>
              {useStructuredForm && (
                <React.Fragment>
                  <SettingsSectionTitle mt={4}>
                    <FormattedMessage
                      id="paymentMethods.manual.bankInfo.title"
                      defaultMessage="Add your bank account information"
                    />
                  </SettingsSectionTitle>
                  <Flex mr={2} flexDirection="column" width={[1, 0.5]}>
                    <PayoutBankInformationForm
                      getFieldName={string => string}
                      fixedCurrency={fixedCurrency}
                      ignoreBlockedCurrencies={false}
                      isNew
                      optional
                    />
                  </Flex>
                </React.Fragment>
              )}

              <SettingsSectionTitle mt={4}>
                <FormattedMessage id="paymentMethods.manual.instructions.title" defaultMessage="Define instructions" />
              </SettingsSectionTitle>
              <Box mr={2} flexGrow={1}>
                <UpdateBankDetailsForm
                  value={instructions}
                  onChange={({ instructions }) => setFieldValue('instructions', instructions)}
                  useStructuredForm={useStructuredForm}
                  bankAccount={values.data}
                />
              </Box>
              <Box my={3} textAlign={['center', 'left']}>
                <StyledButton
                  mr={2}
                  buttonStyle="standard"
                  buttonSize="medium"
                  onClick={() => {
                    setShowForm(false);
                    props.hideTopsection(false);
                  }}
                  disabled={isSubmitting}
                >
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </StyledButton>
                <StyledButton
                  buttonStyle="primary"
                  buttonSize="medium"
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  <FormattedMessage id="save" defaultMessage="Save" />
                </StyledButton>
              </Box>
            </form>
          )}
        </Formik>
      )}
      {showRemoveBankConfirmationModal && (
        <ConfirmationModal
          width="100%"
          maxWidth="570px"
          onClose={() => {
            setShowRemoveBankConfirmationModal(false);
          }}
          header={<FormattedMessage defaultMessage="Remove Bank Account" />}
          continueHandler={async () => {
            const paymentMethods = get(data.host, 'settings.paymentMethods');
            const modifiedPaymentMethods = omit(paymentMethods, 'manual');
            if (latestBankAccount) {
              await removePayoutMethod({
                variables: {
                  payoutMethodId: latestBankAccount.id,
                },
              });
            }
            await editBankTransfer({
              variables: {
                key: 'paymentMethods',
                value: modifiedPaymentMethods,
                account: { slug: props.collectiveSlug },
              },
              refetchQueries: [
                { query: hostQuery, context: API_V2_CONTEXT, variables: { slug: props.collectiveSlug } },
              ],
              awaitRefetchQueries: true,
            });
            setShowRemoveBankConfirmationModal(false);
          }}
        >
          <P fontSize="14px" lineHeight="18px" mt={2}>
            <FormattedMessage defaultMessage="Are you sure you want to remove bank account details?" />
          </P>
        </ConfirmationModal>
      )}
    </Flex>
  );
};

BankTransfer.propTypes = {
  collectiveSlug: PropTypes.string.isRequired,
  hideTopsection: PropTypes.func.isRequired,
};

export default injectIntl(BankTransfer);
