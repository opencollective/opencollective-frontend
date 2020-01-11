import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { connectAccount } from '../lib/api';
import Currency from './Currency';
import SmallButton from './SmallButton';
import MessageBox from './MessageBox';
import { P } from './Text';

class ConnectPaypal extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    onClickRefillBalance: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = { CollectiveId: 0, connectingPaypal: false };
    this.onChange = this.onChange.bind(this);
    this.connectPaypal = this.connectPaypal.bind(this);
  }

  onChange(CollectiveId) {
    this.setState({ CollectiveId });
    this.props.onChange(CollectiveId);
  }

  async connectPaypal() {
    this.setState({ connectingPaypal: true });
    try {
      const json = await connectAccount(this.props.collective.id, 'paypal');
      this.props.onClickRefillBalance(); // save the current filter preferences before redirect
      window.location.replace(json.redirectUrl);
    } catch (e) {
      this.setState({ connectingPaypal: false });
      console.error(e);
    }
  }

  getTimeBeforeExpiry(paymentMethod) {
    const paypalExpiryDate = new Date(paymentMethod.expiryDate);
    return paypalExpiryDate - new Date();
  }

  renderPaypalKeyDetails(paymentMethod) {
    const timeBeforeExpiry = this.getTimeBeforeExpiry(paymentMethod);
    const twoWeeks = 1000 * 60 * 60 * 24 * 14;

    if (timeBeforeExpiry < 0) {
      return (
        <MessageBox type="error" withIcon my={3}>
          <FormattedMessage
            id="ConnectPaypal.expired"
            defaultMessage="Your PayPal pre-approval has expired, please reconnect your account by clicking on 'Refill Balance'."
          />
        </MessageBox>
      );
    } else if (timeBeforeExpiry < twoWeeks) {
      return (
        <MessageBox type="warning" withIcon my={3}>
          <FormattedMessage
            id="ConnectPaypal.expireSoon"
            defaultMessage="Your PayPal pre-approval will expire soon. Renew it by clicking on 'Refill Balance'."
          />
        </MessageBox>
      );
    } else {
      return (
        <P fontSize="Caption" color="black.500" mt={3}>
          <FormattedMessage
            id="collective.connectedAccounts.paypal.connected"
            defaultMessage="Paypal account {paypalEmail} connected on {createdAt, date, short}, token will expire on {expiryDate, date, short}"
            values={{
              createdAt: new Date(paymentMethod.createdAt),
              expiryDate: new Date(paymentMethod.expiryDate),
              paypalEmail: paymentMethod.name,
            }}
          />
        </P>
      );
    }
  }

  render() {
    const { collective } = this.props;

    if (!collective || !collective.paymentMethods) {
      return <div />;
    }
    const paypalPaymentMethod = collective.paymentMethods.find(pm => pm.service === 'paypal');

    return (
      <div className="CollectivesContainer">
        <style jsx>
          {`
            .collectivesFilter {
              display: flex;
              justify-content: center;
            }
            .collectiveBalance {
              text-align: center;
            }
            .collectiveBalance label {
              margin: 1rem 0.5rem 1rem 0;
            }
            .amount {
              font-size: 3.6rem;
              font-weight: 500;
              line-height: 1.11;
              color: #252729;
              margin: 0.5rem 0;
            }

            .description,
            label {
              font-size: 1.4rem;
              line-height: 1.5;
              text-align: right;
              color: #aaaeb3;
              font-weight: normal;
            }

            .description {
              width: 22rem;
              margin: 0.5rem 0;
              font-size: 1.1rem;
            }
          `}
        </style>
        <div className="connectPaypal">
          {paypalPaymentMethod && (
            <div style={{ textAlign: 'center' }}>
              <div className="balance">
                <FormattedMessage id="host.dashboard.paypal.balance" defaultMessage="PayPal pre-approval balance:" />
                <div className="amount">
                  {this.getTimeBeforeExpiry(paypalPaymentMethod) >= 0 && (
                    <Currency
                      value={paypalPaymentMethod.balance}
                      currency={paypalPaymentMethod.currency}
                      precision={2}
                    />
                  )}
                </div>

                <div>
                  <SmallButton onClick={this.connectPaypal} disabled={this.state.connectingPaypal}>
                    {this.state.connectingPaypal ? (
                      <FormattedMessage id="ConnectPaypal.processing" defaultMessage="Processing..." />
                    ) : (
                      <FormattedMessage id="ConnectPaypal.refill" defaultMessage="Refill balance" />
                    )}
                  </SmallButton>
                </div>
              </div>
              {this.renderPaypalKeyDetails(paypalPaymentMethod)}
            </div>
          )}
          {!paypalPaymentMethod && (
            <div>
              <SmallButton className="primary" onClick={this.connectPaypal} disabled={this.state.connectingPaypal}>
                {this.state.connectingPaypal && 'Connecting...'}
                {!this.state.connectingPaypal && 'Connect Paypal'}
              </SmallButton>
              <div className="description">
                <FormattedMessage
                  id="collective.connectedAccounts.paypal.description"
                  defaultMessage="Connect a PayPal account to reimburse approved expenses in one click"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ConnectPaypal;
