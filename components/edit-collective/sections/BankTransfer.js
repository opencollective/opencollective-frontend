import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { get, set } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Add } from '@styled-icons/material/Add';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';

import { compose } from '../../../lib/utils';
import { addEditCollectiveMutation } from '../../../lib/graphql/mutations';

import { Flex, Box } from '../../Grid';
import { H3, H4, P } from '../../Text';
import Link from '../../Link';
import Loading from '../../Loading';
import StyledButton from '../../StyledButton';
import Container from '../../Container';

import UpdateBankDetailsForm from '../UpdateBankDetailsForm';

class BankTransfer extends React.Component {
  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    /** From graphql query */
    data: PropTypes.object.isRequired,
    /** From intl */
    intl: PropTypes.object.isRequired,
    /** From graphql query */
    editCollective: PropTypes.func.isRequired,

    hideTopsection: PropTypes.func.isRequired,
  };

  state = {
    bankDetails: null,
    error: null,
    submitting: false,
  };

  showManualPaymentMethod = (formvalue, setError) => {
    this.props.hideTopsection(formvalue);
    if (setError) {
      this.setState({ showManualPaymentMethodForm: formvalue, error: null });
    } else {
      this.setState({ showManualPaymentMethodForm: formvalue });
    }
  };

  handleSuccess = () => {
    this.props.data.refetch();
    this.props.hideTopsection(false);
    this.setState({
      error: null,
      showManualPaymentMethodForm: false,
      submitting: false,
    });
  };

  updateBankDetails = async () => {
    if (!this.state.bankDetails) {
      this.setState({ error: null, showManualPaymentMethodForm: false, submitting: false });
      this.props.hideTopsection(false);
      return;
    }
    const { Collective } = this.props.data;
    const CollectiveInputType = { id: Collective.id, settings: Collective.settings || {} };
    set(CollectiveInputType, 'settings.paymentMethods.manual.instructions', this.state.bankDetails.instructions);
    this.setState({ submitting: true });
    try {
      await this.props.editCollective(CollectiveInputType);
      this.handleSuccess();
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ submitting: false });
    }
  };

  render() {
    const { Collective, loading } = this.props.data;
    const { showManualPaymentMethodForm, submitting } = this.state;
    const existingManualPaymentMethod = !!get(Collective, 'settings.paymentMethods.manual.instructions');
    const showEditManualPaymentMethod = !showManualPaymentMethodForm && get(Collective, 'isHost');
    return loading ? (
      <Loading />
    ) : (
      <Flex className="EditPaymentMethods" flexDirection="column">
        {showEditManualPaymentMethod && (
          <Fragment>
            <H4 mt={2}>
              <FormattedMessage id="editCollective.receivingMoney.bankTransfers" defaultMessage="Bank Transfers" />
            </H4>

            <Box>
              <Container fontSize="Caption" mt={2} color="black.600" textAlign="left">
                {Collective.plan.manualPayments ? (
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
                disabled={!Collective.plan.manualPayments}
                onClick={() => this.showManualPaymentMethod(true, false)}
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
        {showManualPaymentMethodForm && (
          <Fragment>
            <H3>
              <FormattedMessage id="paymentMethods.manual.HowDoesItWork" defaultMessage="How does it work?" />
            </H3>
            <Flex>
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
              <Link route={`/${Collective.slug}/edit/host-plan`}>
                <FormattedMessage
                  id="paymentMethods.manual.upgradePlan"
                  defaultMessage="Subscribe to our special plans for hosts"
                />
              </Link>
            </P>

            <H3>
              <FormattedMessage
                id="paymentMethods.manual.instructions.title"
                defaultMessage="Define the instructions to make a bank transfer to your account"
              />
            </H3>
            <Box mr={2} css={{ flexGrow: 1 }}>
              <UpdateBankDetailsForm
                value={get(Collective, 'settings.paymentMethods.manual')}
                onChange={bankDetails => this.setState({ bankDetails, error: null })}
              />
            </Box>
            <Box my={2}>
              <StyledButton
                mr={2}
                buttonStyle="standard"
                buttonSize="medium"
                onClick={() => this.showManualPaymentMethod(false, true)}
                disabled={submitting}
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
              <StyledButton
                buttonStyle="primary"
                buttonSize="medium"
                type="submit"
                onClick={this.updateBankDetails}
                disabled={submitting}
                loading={submitting}
              >
                <FormattedMessage id="save" defaultMessage="Save" />
              </StyledButton>
            </Box>
          </Fragment>
        )}
      </Flex>
    );
  }
}
const getPaymentMethods = graphql(gql`
  query Collective($collectiveSlug: String) {
    Collective(slug: $collectiveSlug) {
      id
      type
      slug
      name
      currency
      isHost
      settings
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
      paymentMethods(types: ["creditcard", "virtualcard", "prepaid"]) {
        id
        uuid
        name
        data
        monthlyLimitPerMember
        service
        type
        balance
        currency
        expiryDate
        subscriptions: orders(hasActiveSubscription: true) {
          id
        }
      }
    }
  }
`);

const addData = compose(getPaymentMethods, addEditCollectiveMutation);

export default injectIntl(addData(BankTransfer));
