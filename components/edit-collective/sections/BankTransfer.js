import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { Formik } from 'formik';
import { get } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';

import { BANK_TRANSFER_DEFAULT_INSTRUCTIONS } from '../../../lib/constants/payout-method';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import PayoutBankInformationForm from '../../expenses/PayoutBankInformationForm';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import Loading from '../../Loading';
import StyledButton from '../../StyledButton';
import { H3, H4, P } from '../../Text';
import UpdateBankDetailsForm from '../UpdateBankDetailsForm';

const { TW_API_COLLECTIVE_SLUG } = process.env;

const hostQuery = gqlV2/* GraphQL */ `
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
        addedFunds
        addedFundsLimit
        bankTransfers
        bankTransfersLimit
        hostDashboard
        hostedCollectives
        hostedCollectivesLimit
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

const createPayoutMethodMutation = gqlV2/* GraphQL */ `
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

const editBankTransferMutation = gqlV2/* GraphQL */ `
  mutation EditCollectiveBankTransfer($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const BankTransfer = props => {
  const { loading, data, refetch: refetchHostData } = useQuery(hostQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: props.collectiveSlug },
  });
  const [createPayoutMethod] = useMutation(createPayoutMethodMutation, { context: API_V2_CONTEXT });
  const [editBankTransfer] = useMutation(editBankTransferMutation, { context: API_V2_CONTEXT });
  const [showForm, setShowForm] = React.useState(false);

  if (loading) {
    return <Loading />;
  }

  const existingManualPaymentMethod = !!get(data.host, 'settings.paymentMethods.manual');
  const showEditManualPaymentMethod = !showForm && data.host;
  const existingPayoutMethod = data.host.payoutMethods.find(pm => pm.data.isManualBankTransfer);
  const useStructuredForm =
    !existingManualPaymentMethod || (existingManualPaymentMethod && existingPayoutMethod) ? true : false;
  const instructions =
    get(data.host, 'settings.paymentMethods.manual.instructions') || BANK_TRANSFER_DEFAULT_INSTRUCTIONS;

  // Fix currency if the existing payout method already matches the collective currency
  // or if it was already defined by Stripe
  const existingPayoutMethodMatchesCurrency = existingPayoutMethod?.data?.currency === data.host.currency;
  const isConnectedToStripe = data.host.connectedAccounts?.find?.(ca => ca.service === 'stripe');
  const fixedCurrency =
    useStructuredForm && (existingPayoutMethodMatchesCurrency || isConnectedToStripe) && data.host.currency;

  const initialValues = {
    ...(existingPayoutMethod || { data: { currency: fixedCurrency } }),
    instructions,
  };

  return (
    <Flex className="EditPaymentMethods" flexDirection="column">
      {showEditManualPaymentMethod && (
        <Fragment>
          <H4 mt={2}>
            <FormattedMessage id="editCollective.receivingMoney.bankTransfers" defaultMessage="Bank Transfers" />
          </H4>

          <Box>
            <Container fontSize="12px" mt={2} color="black.600" textAlign="left">
              {data.host.plan.manualPayments ? (
                <FormattedMessage
                  id="paymentMethods.manual.add.info"
                  defaultMessage="To receive donations  directly on your bank account on behalf of the collectives that you are hosting"
                />
              ) : (
                <FormattedMessage
                  id="paymentMethods.manual.upgradePlan"
                  defaultMessage="Subscribe to our special plans for hosts"
                />
              )}
              <Box mt={1}>
                <FormattedMessage
                  id="paymentMethods.manual.add.trial"
                  defaultMessage="Free for the first $1,000 received, "
                />
                <a href="/pricing">
                  <FormattedMessage id="paymentMethods.manual.add.seePricing" defaultMessage="see pricing" />
                </a>
              </Box>
            </Container>
          </Box>
          <Flex alignItems="center" my={2}>
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
                <FormattedMessage id="paymentMethods.manual.edit" defaultMessage="Edit your bank account details" />
              ) : (
                <Fragment>
                  <Add size="1em" />
                  {'  '}
                  <FormattedMessage id="paymentMethods.manual.add" defaultMessage="Add your bank account details" />
                </Fragment>
              )}
            </StyledButton>
          </Flex>
        </Fragment>
      )}
      {showForm && (
        <Formik
          initialValues={initialValues}
          onSubmit={async (values, { setSubmitting }) => {
            const { data, instructions } = values;
            if (data?.currency) {
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
            });
            setSubmitting(false);
            setShowForm(false);
            props.hideTopsection(false);
            refetchHostData();
          }}
        >
          {({ handleSubmit, isSubmitting, setFieldValue, values }) => (
            <form onSubmit={handleSubmit}>
              <H3>
                <FormattedMessage id="paymentMethods.manual.HowDoesItWork" defaultMessage="How does it work?" />
              </H3>
              <Flex flexDirection={['column', 'row']} alignItems={['center', 'start']}>
                <P>
                  <FormattedMessage
                    id="paymentMethod.manual.edit.description"
                    defaultMessage='Contributors will be able to choose "Bank Transfer" as a payment method when they check out. The instructions to make the wire transfer will be emailed to them along with a unique order id. Once you received the money, you will be able to mark the corresponding pending order as paid in your host dashboard.'
                  />
                </P>
                <img src="/static/images/ManualPaymentMethod-BankTransfer.png" width={350} />
              </Flex>
              <H3>
                <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />
              </H3>
              <P>
                <FormattedMessage
                  id="paymentMethod.manual.edit.description.pricing"
                  defaultMessage="There is no platform fee for donations made this way. However, we ask you to kindly subscribe to our special plans for fiscal hosts to be able to maintain and improve this feature over time (the first $1,000 of yearly budget are included in the free plan)"
                />
                .
                <br />
                <Link route={`/${data.host.slug}/edit/host-plan`}>
                  <FormattedMessage
                    id="paymentMethods.manual.upgradePlan"
                    defaultMessage="Subscribe to our special plans for hosts"
                  />
                </Link>
              </P>
              {useStructuredForm && (
                <React.Fragment>
                  <H3>
                    <FormattedMessage
                      id="paymentMethods.manual.bankInfo.title"
                      defaultMessage="Add your bank account information"
                    />
                  </H3>
                  <Flex mr={2} flexDirection="column" width={[1, 0.5]}>
                    <PayoutBankInformationForm
                      host={{ slug: TW_API_COLLECTIVE_SLUG }}
                      getFieldName={string => string}
                      fixedCurrency={fixedCurrency}
                      ignoreBlockedCurrencies={false}
                      isNew
                      optional
                    />
                  </Flex>
                </React.Fragment>
              )}

              <H3 my="1.5rem">
                <FormattedMessage
                  id="paymentMethods.manual.instructions.title"
                  defaultMessage="Define the instructions to make a bank transfer to your account"
                />
              </H3>
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
    </Flex>
  );
};

BankTransfer.propTypes = {
  collectiveSlug: PropTypes.string.isRequired,
  hideTopsection: PropTypes.func.isRequired,
};

export default injectIntl(BankTransfer);
