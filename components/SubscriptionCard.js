import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from '@apollo/react-hoc';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Currency from './Currency';
import { get, cloneDeep } from 'lodash';
import Link from './Link';
import { getErrorFromGraphqlException } from '../lib/errors';
import { firstSentence, getCurrencySymbol } from '../lib/utils';
import { imagePreview } from '../lib/image-utils';
import { getStripe } from '../lib/stripe';
import { defaultBackgroundImage } from '../lib/constants/collectives';
import colors from '../lib/constants/colors';
import CancelSubscriptionBtn from './CancelSubscriptionBtn';
import PaymentMethodChooser from './PaymentMethodChooser';
import { getSubscriptionsQuery } from '../lib/graphql/queries';
import Logo from './Logo';

import { Dropdown, MenuItem, Popover, OverlayTrigger } from 'react-bootstrap';
import { CustomToggle } from './CustomMenu';
import SmallButton from './SmallButton';

class SubscriptionCard extends React.Component {
  static propTypes = {
    subscription: PropTypes.object.isRequired,
    slug: PropTypes.string.isRequired,
    LoggedInUser: PropTypes.object,
    paymentMethods: PropTypes.arrayOf(PropTypes.object),
    intl: PropTypes.object.isRequired,
    updateSubscription: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.stateConstants = {
      normal: 'normal',
      editPaymentMethod: 'editPaymentMethod',
      editAmount: 'editAmount',
      cancelConf: 'cancelConf',
    };

    this.state = {
      showMenu: false,
      visibleState: this.stateConstants.normal,
      amountValue: this.props.subscription.totalAmount / 100,
      amountValueInteger: this.props.subscription.totalAmount,
      result: {},
    };

    this.messages = defineMessages({
      'subscription.amountToDate': {
        id: 'subscription.amountToDate',
        defaultMessage: 'contributed to date',
      },
      'subscription.pastDue': {
        id: 'subscription.pastDue',
        defaultMessage: 'Past due. Please update payment method.',
      },
      'subscription.pastDue.msg': {
        id: 'subscription.pastDue.msg',
        defaultMessage: 'Update payment info',
      },
      'subscription.whyPastDueText': {
        id: 'subscription.whyPastDueText',
        defaultMessage:
          'We were unable to charge your last payment. Please update your payment info to continue this recurring financial contribution.',
      },
      'subscription.updated': {
        id: 'subscription.updated',
        defaultMessage: 'Updated!',
      },
    });
  }

  update = async ({ paymentMethod, amount }) => {
    this.setState({ loading: true, result: {} });
    try {
      const res = await this.props.updateSubscription(this.props.subscription.id, paymentMethod, amount);
      const updatedOrder = res.data.updateSubscription;
      if (updatedOrder.stripeError) {
        this.handleStripeError(updatedOrder.stripeError);
      } else {
        this.handleSuccess();
      }
    } catch (e) {
      this.setState({
        loading: false,
        result: { error: getErrorFromGraphqlException(e).message },
      });
    }
  };

  handleSuccess = () => {
    const { intl } = this.props;

    this.setState({
      loading: false,
      visibleState: this.stateConstants.normal,
      result: {
        success: intl.formatMessage(this.messages['subscription.updated']),
      },
    });
  };

  handleStripeError = async ({ message, response }) => {
    if (!response) {
      this.setState({ loading: false, result: { error: message } });
      return;
    }

    if (response.setupIntent) {
      const stripe = await getStripe();
      const result = await stripe.handleCardSetup(response.setupIntent.client_secret);
      if (result.error) {
        this.setState({ loading: false, result: { error: result.error.message } });
      }
      if (result.setupIntent && result.setupIntent.status === 'succeeded') {
        this.handleSuccess();
      }
    }
  };

  updatePaymentMethod = async paymentMethod => {
    this.update({ paymentMethod });
  };

  updateAmount = async () => {
    this.update({ amount: this.state.amountValueInteger });
  };

  resetState = () => {
    this.setState({ visibleState: this.stateConstants.normal, result: {} });
  };

  handleAmountChange = event => {
    this.setState({
      amountValue: event.target.value,
      amountValueInteger: parseInt(event.target.value, 10) * 100,
    });
  };

  onError = error => {
    this.setState({ result: { error } });
  };

  render() {
    const { intl, LoggedInUser, subscription } = this.props;
    const { collective } = subscription;

    const backgroundImage = imagePreview(
      collective.backgroundImage,
      collective.type === 'COLLECTIVE' && defaultBackgroundImage[collective.type],
      { width: 400 },
    );
    const coverStyle = {};
    if (backgroundImage) {
      coverStyle.backgroundImage = `url('${backgroundImage}')`;
      coverStyle.backgroundSize = 'cover';
      coverStyle.backgroundPosition = 'center center';
    }

    const description =
      (collective.description && firstSentence(collective.description, 64)) ||
      (collective.longDescription && firstSentence(collective.longDescription, 64));

    let frequency = 'mo.';
    if (subscription.interval === 'year') {
      frequency = 'yr.';
    }

    const canEditSubscription = LoggedInUser && LoggedInUser.canEditSubscription(subscription);

    const menuItemStyle = { margin: '0rem', fontSize: '12px' };

    const popover = (
      <Popover id="popover-positioned-bottom" title={intl.formatMessage(this.messages['subscription.pastDue.msg'])}>
        {intl.formatMessage(this.messages['subscription.whyPastDueText'])}
      </Popover>
    );

    return (
      <div className={`SubscriptionCard ${subscription.isPastDue ? 'past-due' : ''}`}>
        <style jsx>
          {`
            .SubscriptionCard {
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              vertical-align: top;
              position: relative;
              box-sizing: border-box;
              width: 250px;
              min-width: 250px;
              border-radius: 15px;
              background-color: #ffffff;
              box-shadow: 0 1px 3px 0 rgba(45, 77, 97, 0.2);
              overflow: visible;
              text-decoration: none !important;
              margin: 2rem 2rem 2rem 0;
            }
            .polygon {
              position: absolute;
              top: -21px;
              left: 20px;
            }

            .head {
              position: relative;
              overflow: visible;
              width: 100%;
              height: 14rem;
              border-bottom: 5px solid #46b0ed;
            }

            .background {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-size: cover;
              background-position: center;
              border-radius: 13px 13px 0px 0px;
            }

            .logo {
              display: flex;
              height: 100%;
              align-items: center;
              justify-content: center;
              position: absolute;
              left: 0;
              right: 0;
              top: 0;
              bottom: 0;
            }

            .actions {
              position: absolute;
              top: 14px;
              left: 213px;
              background: #fff;
              width: 23px;
              height: 23px;
              border-radius: 9px;
              align-items: center;
              text-align: center;
              vertical-align: center;
              z-index: 1200;
              cursor: pointer;
            }

            .actions.selected {
              background: ${colors.bgBlue};
            }

            .actions-image {
              height: 9px;
              width: 13px;
              padding-bottom: 6px;
            }

            .dropdown-toggle {
              width: 100%;
            }

            .body {
              padding: 1rem;
              min-height: 11rem;
            }

            .name {
              cursor: pointer;
            }

            .name,
            .description {
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .name {
              min-height: 20px;
              font-size: 14px;
              margin: 5px;
              font-weight: 700;
              text-align: center;
              color: #303233;
              white-space: nowrap;
            }

            .description {
              font-weight: normal;
              text-align: center;
              color: #787d80;
              font-size: 1.2rem;
              line-height: 1.3;
              margin: 0 5px;
            }

            .footer {
              font-size: 1.1rem;
              width: 100%;
              min-height: 6rem;
              text-align: center;
              padding-bottom: 20px;
              border-top: 2px solid #f2f2f2;
            }

            .amount-frequency {
              margin: auto;
              height: 32px;
              display: table;
              border-radius: 100px;
              border: solid 2px #f2f2f2;
              font-size: 12px;
              line-height: 1.5;
              text-align: center;
              color: #797c80;
              background: white;
              padding: 0 2rem;
              margin-top: -16px;
              padding-top: 3px;
            }

            .border-red {
              border-color: #f2f2f2;
            }

            .amount {
              font-weight: 700;
              color: #303233;
              font-size: 14px;
              padding-right: 2px;
            }

            .frequency {
            }

            .contribution {
              margin-top: 2rem;
              font-size: 12px;
            }

            .totalAmount {
              font-weight: 700;
            }

            .editAmount {
              margin-top: -16px;
              padding: 0 1rem;
            }

            .inputAmount {
              padding-bottom: 1em;
            }

            .inputAmount .currency,
            .inputAmount .frequency,
            .inputAmount input {
              font-size: 14px;
              line-height: 14px;

              border: 1px solid #d4dae1;
              padding: 0.5em;
              background: white;
            }

            .inputAmount span.currency {
              color: #d4dae1;
              border-radius: 9px 0 0 9px;
              border-right: 0;
            }

            .inputAmount span.frequency {
              border-radius: 9px;
              margin-left: 1em;
              padding: 0.5em 1em;
            }

            .inputAmount input {
              width: 6em;
              border-radius: 0 9px 9px 0;
            }

            .paymentMethod {
              padding-top: 0.5rem;
            }

            .cancel {
              text-align: center;
              align-items: center;
              margin-top: 1rem;
            }

            .cancel-buttons,
            .update-buttons {
              display: flex;
              flex-direction: row;
              justify-content: space-evenly;
              margin: auto;
              margin-top: 4px;
            }

            .past-due {
              border: 2px solid #e63956;
            }

            .past-due-msg {
              margin-top: 4px;
              color: ${colors.blue};
              cursor: pointer;
            }

            .result div {
              width: 100%;
            }
            .error {
              margin-top: 1rem;
              color: red;
              font-weight: bold;
            }
          `}
        </style>
        <style jsx global>
          {`
            .StripeElement {
              background-color: white;
              height: 20px;
              padding: 0px 0px;
              border-radius: 9px;
              border: 1px solid transparent;
              box-shadow: 0 1px 3px 0 #e6ebf1;
              -webkit-transition: box-shadow 150ms ease;
              transition: box-shadow 150ms ease;
              font-size: 10px;
            }

            .menu-item li a {
              padding: 5px 10px;
            }
          `}
        </style>

        <div className="head">
          <div className="background" style={coverStyle} />

          {subscription.isPastDue && (
            <div className="polygon">
              <img
                title={intl.formatMessage(this.messages['subscription.pastDue'])}
                src="/static/images/attention-badge.svg"
              />
            </div>
          )}

          {canEditSubscription && (subscription.isSubscriptionActive || subscription.status === 'PENDING') && (
            <div
              className={`actions ${this.state.showMenu ? 'selected' : ''}`}
              onClick={() => this.setState({ showMenu: !this.state.showMenu })}
            >
              <Dropdown
                id="dropdown-custom"
                className="dropdown-toggle"
                style={{ width: '100%' }}
                open={this.state.showMenu}
                onToggle={() => this.setState({ showMenu: !this.state.showMenu })}
                onSelect={eventKey => this.setState({ visibleState: eventKey, result: {} })}
                pullRight
              >
                <CustomToggle bsRole="toggle">
                  <img className="actions-image" src={'/static/images/glyph-more.svg'} />
                </CustomToggle>
                <Dropdown.Menu className="menu-item">
                  {subscription.status !== 'PENDING' && [
                    <MenuItem key="pm" style={menuItemStyle} eventKey={this.stateConstants.editPaymentMethod}>
                      <FormattedMessage
                        id="subscription.menu.editPaymentMethod"
                        defaultMessage="Update payment method"
                      />
                    </MenuItem>,
                    <MenuItem key="amount" style={menuItemStyle} eventKey={this.stateConstants.editAmount}>
                      <FormattedMessage id="subscription.menu.editAmount" defaultMessage="Update amount" />
                    </MenuItem>,
                    <MenuItem key="divider" style={{ margin: '2px' }} divider />,
                  ]}
                  <MenuItem style={menuItemStyle} eventKey={this.stateConstants.cancelConf}>
                    <FormattedMessage id="subscription.menu.cancel" defaultMessage="Cancel subscription" />
                  </MenuItem>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
          <div className="logo">
            <Logo collective={collective} height={65} />
          </div>
        </div>

        <div className="body">
          <Link route={'collective'} params={{ slug: collective.slug }}>
            <div className="name">{collective.name}</div>
          </Link>
          <div className="description">{description}</div>
        </div>

        <div className="footer">
          <div className="subscription">
            {this.state.visibleState === this.stateConstants.editAmount && (
              <div className="editAmount">
                <div className="inputAmount">
                  <span className="currency">{getCurrencySymbol(subscription.currency)}</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    name="amount"
                    value={this.state.amountValue}
                    onChange={this.handleAmountChange}
                  />
                  <span className="frequency">{subscription.interval === 'year' ? 'Yearly' : 'Monthly'}</span>
                </div>
                <div className="update-buttons">
                  <SmallButton className="no" onClick={this.resetState}>
                    <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                  </SmallButton>
                  <SmallButton
                    className="yes"
                    disabled={
                      !this.state.amountValueInteger || this.state.amountValueInteger == subscription.totalAmount
                    }
                    onClick={this.updateAmount}
                  >
                    <FormattedMessage id="subscription.updateAmount.update.btn" defaultMessage="Update" />
                  </SmallButton>
                </div>
              </div>
            )}
            {this.state.visibleState !== this.stateConstants.editAmount && (
              <div className={`amount-frequency ${subscription.isPastDue ? 'past-due' : ''}`}>
                <span className="amount">
                  <Currency value={subscription.totalAmount} currency={subscription.currency} />
                </span>
                <span className="currency-frequency">
                  {' '}
                  {subscription.currency.toLowerCase()}/{frequency}{' '}
                </span>
              </div>
            )}
          </div>

          {this.state.visibleState === this.stateConstants.normal &&
            subscription.stats &&
            Object.keys(subscription.stats).length > 0 && (
              <div className="contribution">
                <span className="totalAmount">
                  <Currency value={get(subscription, 'stats.totalDonations')} currency={subscription.currency} />
                  &nbsp;
                </span>
                <span className="total-amount-text">
                  {intl.formatMessage(this.messages['subscription.amountToDate'])}
                </span>
              </div>
            )}

          {(this.state.visibleState === this.stateConstants.normal ||
            this.state.visibleState === this.stateConstants.editPaymentMethod) &&
            canEditSubscription && (
              <div className="paymentMethod">
                <PaymentMethodChooser
                  paymentMethodInUse={subscription.paymentMethod}
                  paymentMethodsList={this.props.paymentMethods}
                  editMode={this.state.visibleState === this.stateConstants.editPaymentMethod}
                  onCancel={this.resetState}
                  onSubmit={this.updatePaymentMethod}
                />
              </div>
            )}

          {this.state.visibleState === this.stateConstants.normal && subscription.isPastDue && (
            <div className="past-due-msg">
              <span
                onClick={() =>
                  this.setState({
                    visibleState: this.stateConstants.editPaymentMethod,
                  })
                }
              >
                {' '}
                {intl.formatMessage(this.messages['subscription.pastDue.msg'])}
                &nbsp;&nbsp;
              </span>
              <OverlayTrigger trigger="click" placement={'bottom'} overlay={popover} rootClose>
                <img className="help-image" src="/static/images/help-icon.svg" />
              </OverlayTrigger>
            </div>
          )}

          {this.state.visibleState === this.stateConstants.cancelConf && (
            <div className="cancel">
              Cancel this subscription?
              <div className="cancel-buttons">
                <SmallButton className="no" onClick={this.resetState}>
                  <FormattedMessage id="no" defaultMessage="No" />
                </SmallButton>
                <CancelSubscriptionBtn id={subscription.id} onError={this.onError} />
              </div>
            </div>
          )}

          <div className="result">
            {this.state.loading && <div className="loading">Processing...</div>}
            {this.state.result.success && <div className="success">{this.state.result.success}</div>}
            {this.state.result.error && <div className="error">{this.state.result.error}</div>}
          </div>
        </div>
      </div>
    );
  }
}

const updateSubscriptionQuery = gql`
  mutation updateSubscription($id: Int!, $paymentMethod: PaymentMethodInputType, $amount: Int) {
    updateSubscription(id: $id, paymentMethod: $paymentMethod, amount: $amount) {
      id
      currency
      totalAmount
      interval
      createdAt
      isSubscriptionActive
      isPastDue
      collective {
        id
        name
        currency
        slug
        type
        description
        longDescription
        imageUrl
        backgroundImage
      }
      fromCollective {
        id
        slug
        createdByUser {
          id
        }
      }
      paymentMethod {
        id
        uuid
        currency
        name
        service
        type
        data
        balance
        expiryDate
      }
      stripeError {
        message
        response
      }
    }
  }
`;

const addMutation = graphql(updateSubscriptionQuery, {
  props: ({ ownProps, mutate }) => ({
    updateSubscription: async (id, paymentMethod, amount) => {
      return await mutate({
        variables: { id, paymentMethod, amount },

        // this inserts a newly added credit card in one subscription to the list
        // of all subscriptions, so it can be immediately selected.
        update: (proxy, { data: { updateSubscription } }) => {
          const data = proxy.readQuery({
            query: getSubscriptionsQuery,
            variables: { slug: ownProps.slug },
          });

          if (paymentMethod !== undefined) {
            // a new card was added and we need to add that back in our cache
            if (!paymentMethod.uuid || paymentMethod.uuid.length !== 36) {
              // find the original list of payment methods fetched
              const origPaymentMethodList = data.Collective.paymentMethods;
              // insert it to the end
              origPaymentMethodList.push(updateSubscription.paymentMethod);
            }
          }

          if (amount !== undefined) {
            const originalOrder = data.Collective.ordersFromCollective.find(order => order.id === id);
            // copy it and mark it as unactive (will be in the canceled list)
            const canceledOrder = cloneDeep(originalOrder);
            canceledOrder.isSubscriptionActive = false;
            data.Collective.ordersFromCollective.push(canceledOrder);
            // now, update the originalOrder (edit in place)
            originalOrder.id = updateSubscription.id;
            originalOrder.totalAmount = amount;
          }

          // write data back for the query
          proxy.writeQuery({ query: getSubscriptionsQuery, data });
        },
      });
    },
  }),
});

export default addMutation(injectIntl(SubscriptionCard));
