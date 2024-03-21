import React, { Component } from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { truncate } from 'lodash';
import { injectIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import INTERVALS, { getGQLV2FrequencyFromInterval } from '../lib/constants/intervals';
import { getEnvVar } from '../lib/env-utils';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import { getPaypal } from '../lib/paypal';

import LoadingPlaceholder from './LoadingPlaceholder';
import StyledButton from './StyledButton';

const PaypalButtonContainer = styled.div<{ isLoading?: boolean }>`
  ${props =>
    props.isLoading &&
    css`
      .paypal-buttons {
        display: none !important;
      }
    `}
`;

type PayWithPaypalButtonProps = {
  /** Total amount to pay in cents */
  totalAmount: number;
  /** The currency used for this order */
  currency: string;
  interval?: string;
  isSubmitting?: boolean;
  /** Called when user authorize the payment with a payment method generated from PayPal data */
  onSuccess: Function;
  /** Called when user cancel paypal flow */
  onCancel?: Function;
  /** Called when an error is thrown during paypal flow */
  onError?: Function;
  /** Called when the button is clicked */
  onClick?: Function;
  /** Styles to apply to the button. See https://developer.paypal.com/docs/checkout/how-to/customize-button/#button-styles */
  style?: {
    color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
    shape?: 'pill' | 'rect';
    size?: 'small' | 'medium' | 'large' | 'responsive';
    height?: number;
    label?: 'checkout' | 'credit' | 'pay' | 'buynow' | 'paypal' | 'installment';
    tagline?: boolean;
    layout?: 'horizontal' | 'vertical';
    funding?: { allowed: Array<any>; disallowed: Array<any> };
    fundingicons?: boolean;
  };
  host: {
    id: string;
    legacyId: number;
    paypalClientId: string;
  };
  collective: {
    id: string;
    name: string;
  };
  tier?: { id: string };
  data?: any;
  intl?: any;
  subscriptionStartDate?: string;
};

/**
 * Encapsulate Paypal button logic so we don't have to deal with refs in parent
 * components.
 */
class PayWithPaypalButton extends Component<PayWithPaypalButtonProps, { isLoading: boolean }> {
  constructor(props) {
    super(props);
    this.paypalTarget = React.createRef();
    this.state = { isLoading: true };
  }

  componentDidMount() {
    this.initialize();
  }

  componentDidUpdate(oldProps) {
    if (
      Boolean(this.props.interval) !== Boolean(oldProps.interval) ||
      Boolean(oldProps.data?.loading) !== Boolean(this.props.data?.loading) ||
      this.props.currency !== oldProps.currency
    ) {
      this.initialize();
    }
  }

  paypalTarget: any;
  static defaultStyle = {
    color: 'blue',
    tagline: false,
    label: 'pay',
    shape: 'pill',
    layout: 'horizontal',
  };

  isRecurring = () => {
    return [INTERVALS.month, INTERVALS.year].includes(this.props.interval);
  };

  async initialize() {
    if (!this.state.isLoading) {
      this.setState({ isLoading: true });
    }

    // If using subscriptions, wait for to plan to be loaded
    const isRecurring = this.isRecurring();
    if (isRecurring && (this.props.data?.loading || !this.props.data?.paypalPlan)) {
      return;
    }

    // Make sure we cleanup any pre-existing button
    this.paypalTarget.current.innerHTML = '';

    // Initialize button
    const { host, currency } = this.props;
    const clientId = host.paypalClientId;
    const intent = isRecurring ? 'subscription' : 'authorize';
    const paypal = await getPaypal({ clientId, currency, intent });
    const options = this.getOptions();
    paypal.Buttons(options).render(this.paypalTarget.current);
    this.setState({ isLoading: false });
  }

  getOptions() {
    const options = {
      env: getEnvVar('PAYPAL_ENVIRONMENT'),
      style: { ...PayWithPaypalButton.defaultStyle, ...this.props.style },
      onError: () =>
        this.props.onError?.({
          message: this.props.intl.formatMessage({
            defaultMessage: 'There was an error while initializing the PayPal checkout',
          }),
        }),
      intent: null,
      createSubscription: null,
      createOrder: null,
      onApprove: null,
    };

    /* eslint-disable camelcase */
    if (this.isRecurring()) {
      options.intent = 'subscription';
      options.createSubscription = (data, actions) => {
        return actions.subscription.create({
          plan_id: this.props.data.paypalPlan.id,
          start_time: this.props.subscriptionStartDate,
          application_context: {
            brand_name: `${truncate(this.props.collective.name, { length: 108 })} - Open Collective`,
            locale: this.props.intl.locale,
            shipping_preference: 'NO_SHIPPING',
            user_action: 'CONTINUE',
          },
        });
      };
      options.onApprove = data => {
        this.props.onSuccess({ subscriptionId: data.subscriptionID });
      };
    } else {
      options.intent = 'authorize';
      options.createOrder = (data, actions) => {
        return actions.order.create({
          intent: 'AUTHORIZE',
          application_context: {
            brand_name: `${truncate(this.props.collective.name, { length: 108 })} - Open Collective`,
            locale: this.props.intl.locale,
            shipping_preference: 'NO_SHIPPING',
            user_action: 'CONTINUE',
          },
          purchase_units: [
            {
              amount: {
                value: (this.props.totalAmount / 100).toString(),
                currency_code: this.props.currency,
              },
            },
          ],
        });
      };
      options.onApprove = result => {
        this.props.onSuccess({ orderId: result.orderID });
      };
    }
    /* eslint-enable camelcase */

    return options;
  }

  render() {
    return (
      <PaypalButtonContainer data-cy="paypal-container" isLoading={this.state.isLoading || this.props.isSubmitting}>
        <div data-cy="paypal-target" ref={this.paypalTarget} />
        {this.state.isLoading ? (
          <LoadingPlaceholder height={(this.props.style?.height || 47) + 3} minWidth="70px" borderRadius={100} />
        ) : this.props.isSubmitting ? (
          <StyledButton
            height={this.props.style?.height || 47}
            p={0}
            minWidth="70px"
            width="100%"
            buttonStyle="primary"
            background="#0070ba"
            loading
          />
        ) : null}
      </PaypalButtonContainer>
    );
  }
}

const paypalPlanQuery = gql`
  query PaypalPlan(
    $account: AccountReferenceInput!
    $tier: TierReferenceInput
    $amount: AmountInput!
    $frequency: ContributionFrequency!
    $order: OrderReferenceInput
  ) {
    paypalPlan(account: $account, tier: $tier, amount: $amount, frequency: $frequency, order: $order) {
      id
    }
  }
`;

const addPaypalPlan = graphql(paypalPlanQuery, {
  // We only need a plan if using an interval
  skip: props => !props.interval || props.interval === INTERVALS.oneTime,
  options: (props: any) => ({
    context: API_V2_CONTEXT,
    variables: {
      account: { id: props.collective.id },
      tier: props.tier ? { id: props.tier.id } : null,
      order: !props.order?.id
        ? null
        : typeof props.order.id === 'string'
          ? { id: props.order.id }
          : { legacyId: props.order.id },
      frequency: getGQLV2FrequencyFromInterval(props.interval),
      amount: {
        valueInCents: props.totalAmount,
        currency: props.currency,
      },
    },
  }),
});

export default addPaypalPlan(injectIntl(PayWithPaypalButton));
