import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { CardElement } from '@stripe/react-stripe-js';
import { Add } from '@styled-icons/material/Add';
import { get, isEmpty, merge, pick, sortBy } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { PAYMENT_METHOD_TYPE } from '../../../lib/constants/payment-methods';
import { getErrorFromGraphqlException, i18nGraphqlException, isErrorType } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV1 } from '../../../lib/graphql/helpers';
import { paymentMethodLabel } from '../../../lib/payment_method_label';
import { getStripe, stripeTokenToPaymentMethod } from '../../../lib/stripe';
import { compose } from '../../../lib/utils';

import { confirmOrderMutation } from '../../../pages/confirmOrder';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import NewCreditCardForm from '../../NewCreditCardForm';
import {
  addCreditCardMutation,
  confirmCreditCardMutation,
} from '../../recurring-contributions/UpdatePaymentMethodPopUp';
import { withStripeLoader } from '../../StripeProvider';
import StyledButton from '../../StyledButton';
import { P, Span } from '../../Text';
import { toast } from '../../ui/useToast';
import EditPaymentMethod from '../EditPaymentMethod';

class EditPaymentMethods extends React.Component {
  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    /** From graphql query */
    data: PropTypes.object.isRequired,
    /** From intl */
    intl: PropTypes.object.isRequired,
    /** From graphql query */
    createCreditCardEditCollective: PropTypes.func.isRequired,
    /** From graphql query */
    confirmCreditCardEditCollective: PropTypes.func.isRequired,
    /** From graphql query */
    removePaymentMethod: PropTypes.func.isRequired,
    /** From graphql query */
    confirmOrder: PropTypes.func.isRequired,
    /** From stripeLoader */
    loadStripe: PropTypes.func.isRequired,
    /** from withToast */
    toast: PropTypes.func.isRequired,
    /** from withRouter */
    router: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      removeConfirm: {
        id: 'paymentMethods.removeConfirm',
        defaultMessage: 'Do you really want to remove this payment method?',
      },
    });
  }

  state = {
    showCreditCardForm: false,
    newCreditCardInfo: null,
    bankDetails: null,
    error: null,
    stripe: null,
    stripeElements: null,
    submitting: false,
    removedId: null,
    savingId: null,
  };

  componentDidMount() {
    this.props.loadStripe();
  }

  submitNewCreditCard = async () => {
    const data = get(this.state, 'newCreditCardInfo.value');
    if (!data || !this.state.stripe) {
      this.setState({ error: 'There was a problem initializing the payment form' });
    } else if (data.error) {
      this.setState({ error: data.error.message });
    } else {
      try {
        this.setState({ submitting: true });
        const cardElement = this.state.stripeElements.getElement(CardElement);
        const { token, error } = await this.state.stripe.createToken(cardElement);
        if (error) {
          throw error;
        }
        const newStripePaymentMethod = stripeTokenToPaymentMethod(token);
        const newCreditCardInfo = merge(newStripePaymentMethod.data, pick(newStripePaymentMethod, ['token']));
        const res = await this.props.createCreditCardEditCollective({
          variables: {
            creditCardInfo: newCreditCardInfo,
            name: get(newStripePaymentMethod, 'name'),
            account: { id: this.props.data.account.id },
          },
        });

        const { paymentMethod, stripeError } = res.data.addCreditCard;

        if (stripeError) {
          this.handleStripeError(paymentMethod, stripeError);
        } else {
          this.handleSuccess('setup');
        }
      } catch (e) {
        this.setState({ error: e.message, submitting: false });
      }
    }
  };

  confirmCreditCard = async paymentMethod => {
    try {
      this.setState({ savingId: paymentMethod.id });
      await this.props.confirmCreditCardEditCollective({
        variables: { paymentMethod: { id: paymentMethod.id } },
        refetchQueries: [
          {
            query: paymentMethodsQuery,
            variables: { collectiveSlug: this.props.collectiveSlug },
            context: API_V2_CONTEXT,
          },
        ],
      });
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(this.props.intl, error) });
    } finally {
      this.setState({ savingId: null });
    }
  };

  confirmOrderForPaymentMethod = async paymentMethod => {
    try {
      this.setState({ savingId: paymentMethod.id });
      const orderToConfirm = paymentMethod.orders.nodes.find(order => order.needsConfirmation);
      const res = await this.props.confirmOrder({
        variables: {
          order: { id: orderToConfirm.id },
          refetchQueries: [
            {
              query: paymentMethodsQuery,
              context: API_V2_CONTEXT,
            },
          ],
        },
      });

      const { stripeError } = res.data.confirmOrder;
      if (stripeError) {
        await this.handleStripeError(paymentMethod, stripeError);
      } else {
        this.handleSuccess('payment');
      }
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(this.props.intl, error) });
    } finally {
      this.setState({ savingId: null });
    }
  };

  handleSuccess = successType => {
    this.props.data.refetch();
    if (successType) {
      const pathname = this.props.router.asPath.split('?')[0];
      this.props.router.replace({ pathname, query: { successType } }, undefined, { shallow: true });
    }

    this.setState({
      showCreditCardForm: false,
      error: null,
      newCreditCardInfo: null,
      submitting: false,
    });
  };

  handleStripeError = async (paymentMethod, stripeError) => {
    const { message, response } = stripeError;
    let newError;

    if (!response) {
      newError = message;
    } else if (response.setupIntent) {
      const stripe = await getStripe();
      const result = await stripe.handleCardSetup(response.setupIntent.client_secret);
      if (result.error) {
        newError = result.error.message;
      } else {
        try {
          await this.props.confirmCreditCardEditCollective({ variables: { paymentMethod: { id: paymentMethod.id } } });
        } catch (error) {
          newError = result.error.message;
        }
      }
    } else if (response.paymentIntent) {
      const stripe = await getStripe(null, stripeError.account);
      const result = await stripe.handleCardAction(response.paymentIntent.client_secret);
      if (result.paymentIntent && result.paymentIntent.status === 'requires_confirmation') {
        return this.confirmOrderForPaymentMethod(paymentMethod);
      } else if (result.error) {
        newError = result.error.message;
      }
    }

    if (newError) {
      toast({ variant: 'error', message: i18nGraphqlException(this.props.intl, newError) });
    } else {
      this.handleSuccess(response.setupIntent ? 'setup' : response.paymentIntent ? 'payment' : null);
    }
  };

  removePaymentMethod = async paymentMethod => {
    const pmLabel = paymentMethodLabel(this.props.intl, paymentMethod, get(this.props.data, 'Collective.name'));
    const confirmQuestion = this.props.intl.formatMessage(this.messages['removeConfirm']);
    if (confirm(`${pmLabel} - ${confirmQuestion}`)) {
      try {
        this.setState({ removedId: paymentMethod.id });
        await this.props.removePaymentMethod({ variables: { id: paymentMethod.legacyId } });
        this.setState({ error: null });
        await this.props.data.refetch();
      } catch (e) {
        this.showError(getErrorFromGraphqlException(e));
      }
    }
    this.setState({ removedId: null });
  };

  showError = error => {
    this.setState({ error });
    window.scrollTo(0, 0);
  };

  getPaymentMethodsToDisplay() {
    const { data } = this.props;
    const paymentMethodsWithPendingConfirmation = get(data, 'account.paymentMethodsWithPendingConfirmation') || [];
    const paymentMethods = (get(data, 'account.paymentMethods') || []).filter(
      pm =>
        // Remove payment methods with no balance, unless it's a gift card with a monthly limit
        (pm.balance.valueInCents > 0 || (pm.type === PAYMENT_METHOD_TYPE.GIFTCARD && pm.monthlyLimit)) &&
        // Remove payment methods with pending confirmation, they'll be displayed at the top
        !paymentMethodsWithPendingConfirmation.some(p => p.id === pm.id),
    );

    return [
      ...sortBy(paymentMethodsWithPendingConfirmation, ['type', 'id']),
      ...sortBy(paymentMethods, ['type', 'id']),
    ];
  }

  hasOrdersThatNeedConfirmation = () => {
    return !isEmpty(get(this.props.data, 'account.paymentMethodsWithPendingConfirmation', []));
  };

  paymentMethodRequiresConfirmation = paymentMethod => {
    return paymentMethod.orders?.nodes?.some(order => order.needsConfirmation);
  };

  renderError(error) {
    if (typeof error === 'string') {
      return error;
    } else if (isErrorType(error, 'PM.Remove.HasActiveSubscriptions')) {
      return (
        <React.Fragment>
          <FormattedMessage
            id="errors.PM.Remove.HasActiveSubscriptions"
            defaultMessage="This payment method cannot be removed because it has active recurring financial contributions."
          />{' '}
          <Link href={`/${this.props.collectiveSlug}/manage-contributions`}>
            <Span textTransform="capitalize">
              <FormattedMessage
                id="paymentMethod.editSubscriptions"
                defaultMessage="Edit recurring financial contributions"
              />
            </Span>
          </Link>
        </React.Fragment>
      );
    } else {
      return error.message;
    }
  }

  dismissSuccess = () => {
    const { router } = this.props;
    if (this.props.router.query.successType) {
      const pathname = router.asPath.split('?')[0];
      this.props.router.replace({ pathname, query: null }, undefined, { shallow: true });
    }
  };

  render() {
    const { account, loading } = this.props.data;
    const { showCreditCardForm, error, submitting, removedId, savingId } = this.state;
    const successType = this.props.router.query.successType;
    const paymentMethods = this.getPaymentMethodsToDisplay();

    return loading ? (
      <Loading />
    ) : (
      <Flex className="EditPaymentMethods" flexDirection="column" pt={2}>
        {this.hasOrdersThatNeedConfirmation() && (
          <MessageBox type="warning" withIcon mb={3}>
            <FormattedMessage defaultMessage="You need to confirm at least one of your payment methods." />
          </MessageBox>
        )}
        {successType && (
          <MessageBox
            type="success"
            display="flex"
            alignItems="center"
            withIcon
            mb={3}
            onClick={() => this.setState({ successType: null })}
          >
            <Flex justifyContent="space-between" alignItems="center" flex="1 1">
              <span>
                {successType === 'payment' ? (
                  <FormattedMessage
                    id="Order.Confirm.Success"
                    defaultMessage="Your payment method has now been confirmed and the payment successfully went through."
                  />
                ) : (
                  <FormattedMessage defaultMessage="Your payment method has been successfully added." />
                )}
              </span>
              <StyledButton buttonSize="tiny" onClick={this.dismissSuccess}>
                <FormattedMessage defaultMessage="Dismiss" />
              </StyledButton>
            </Flex>
          </MessageBox>
        )}
        {error && (
          <MessageBox type="error" withIcon mb={4}>
            {this.renderError(error)}
          </MessageBox>
        )}
        {
          <Flex className="paymentMethods" flexDirection="column" my={2}>
            {paymentMethods.map(pm => (
              <Container
                className="paymentMethod"
                key={pm.id}
                my={3}
                p={3}
                border="1px solid #dedede"
                borderRadius={4}
                style={{ filter: pm.id === removedId ? 'blur(1px)' : 'none' }}
              >
                <EditPaymentMethod
                  collectiveSlug={account.slug}
                  isSaving={pm.id === savingId}
                  nbActiveSubscriptions={pm.orders?.totalCount || 0}
                  paymentMethod={pm}
                  onRemove={pm => this.removePaymentMethod(pm)}
                  needsConfirmation={this.paymentMethodRequiresConfirmation(pm)}
                  onConfirm={pm => this.confirmOrderForPaymentMethod(pm)}
                />
              </Container>
            ))}
          </Flex>
        }
        {!showCreditCardForm && (
          <Flex alignItems="center" mx={3} my={4} flexDirection="column">
            <StyledButton
              buttonStyle="standard"
              buttonSize="large"
              onClick={() => this.setState({ showCreditCardForm: true })}
            >
              <Add size="1em" />
              {'  '}
              <FormattedMessage id="paymentMethods.creditcard.add" defaultMessage="Add a credit card" />
            </StyledButton>
            <Span fontSize="12px" mt={2} color="black.600">
              <FormattedMessage
                id="paymentMethods.creditcard.add.info"
                defaultMessage="For making contributions as {contributeAs}"
                values={{ contributeAs: account.name }}
              />
            </Span>
          </Flex>
        )}
        {showCreditCardForm && (
          <Container
            display="flex"
            alignItems="center"
            flexWrap="wrap"
            my={4}
            px={3}
            py={1}
            borderRadius={4}
            border="1px solid #dedede"
          >
            <P fontSize="14px" fontWeight="bold" mr={4}>
              <FormattedMessage id="paymentMethod.add" defaultMessage="New Credit Card" />
            </P>
            <Box mr={2} css={{ flexGrow: 1 }}>
              <NewCreditCardForm
                hasSaveCheckBox={false}
                onChange={newCreditCardInfo => this.setState({ newCreditCardInfo, error: null })}
                onReady={({ stripe, stripeElements }) => this.setState({ stripe, stripeElements })}
              />
            </Box>
            <Box my={2}>
              <StyledButton
                mr={2}
                buttonStyle="standard"
                buttonSize="medium"
                onClick={() => this.setState({ showCreditCardForm: false, error: null })}
                disabled={submitting}
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
              <StyledButton
                buttonStyle="primary"
                buttonSize="medium"
                type="submit"
                onClick={this.submitNewCreditCard}
                disabled={submitting}
                loading={submitting}
              >
                <FormattedMessage id="save" defaultMessage="Save" />
              </StyledButton>
            </Box>
          </Container>
        )}
      </Flex>
    );
  }
}

const editPaymentMethodFragment = gql`
  fragment EditPaymentMethodFragment on PaymentMethod {
    id
    legacyId
    name
    data
    service
    type
    balance {
      valueInCents
      currency
    }
    expiryDate
    monthlyLimit {
      valueInCents
    }
  }
`;

const paymentMethodsQuery = gql`
  query EditCollectivePaymentMethods($collectiveSlug: String) {
    account(slug: $collectiveSlug) {
      id
      legacyId
      type
      slug
      name
      currency
      isHost
      settings
      paymentMethods(type: [CREDITCARD, GIFTCARD, PREPAID]) {
        id
        ...EditPaymentMethodFragment
      }
      paymentMethodsWithPendingConfirmation {
        id
        ...EditPaymentMethodFragment
        orders(onlyActiveSubscriptions: true, status: [ACTIVE, ERROR, PENDING, REQUIRE_CLIENT_CONFIRMATION]) {
          totalCount
          nodes {
            id
            legacyId
            needsConfirmation
          }
        }
      }
    }
  }
  ${editPaymentMethodFragment}
`;

const addPaymentMethodsData = graphql(paymentMethodsQuery, {
  options: { context: API_V2_CONTEXT },
});

const addCreateCreditCardMutation = graphql(addCreditCardMutation, {
  name: 'createCreditCardEditCollective',
  options: { context: API_V2_CONTEXT },
});

const addConfirmCreditCardMutation = graphql(confirmCreditCardMutation, {
  name: 'confirmCreditCardEditCollective',
  options: { context: API_V2_CONTEXT },
});

const removePaymentMethodMutation = gqlV1/* GraphQL */ `
  mutation EditCollectiveRemovePaymentMethod($id: Int!) {
    removePaymentMethod(id: $id) {
      id
    }
  }
`;

const addRemovePaymentMethodMutation = graphql(removePaymentMethodMutation, {
  name: 'removePaymentMethod',
});

const addConfirmOrderMutation = graphql(confirmOrderMutation, {
  name: 'confirmOrder',
  options: { context: API_V2_CONTEXT },
});

const addGraphql = compose(
  addPaymentMethodsData,
  addRemovePaymentMethodMutation,
  addCreateCreditCardMutation,
  addConfirmCreditCardMutation,
  addConfirmOrderMutation,
);

export default injectIntl(withStripeLoader(addGraphql(withRouter(EditPaymentMethods))));
