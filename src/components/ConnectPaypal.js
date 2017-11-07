import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import Currency from '../components/Currency';
import SmallButton from '../components/SmallButton';
import { FormattedMessage } from 'react-intl';
import { connectAccount } from '../lib/api';

class ConnectPaypal extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    onChange: PropTypes.func
  }

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
      window.location.replace(json.redirectUrl);
    } catch (e) {
      this.setState({ connectingPaypal: false });
      console.error(e);
    }
  }

  render() {
    const { collective } = this.props;

    if (!collective || !collective.paymentMethods) {
      return (<div />);
    }
    const paypalPaymentMethod = collective.paymentMethods.find(pm => pm.service === 'paypal');

    return (
      <div className="CollectivesContainer">
        <style jsx>{`
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
            font-family: Rubik;
            font-size: 3.6rem;
            font-weight: 500;
            line-height: 1.11;
            text-align: right;
            color: #252729;
            margin: 0.5rem 0;
          }

          .connectedAt, label {
            font-family: Rubik;
            font-size: 1.4rem;
            line-height: 1.5;
            text-align: right;
            color: #aaaeb3;
            font-weight: normal;
          }

          .connectedAt {
            width: 20rem;
            margin: 0.5rem 0;
            font-size: 1.1rem;
          }
        `}</style>
        <div className="connectPaypal">
        { paypalPaymentMethod &&
          <div>
            <div className="balance">
              <label>
                <FormattedMessage id="collective.stats.balance.title" defaultMessage="Available balance:" />
              </label>
              <div className="amount">
                <Currency value={paypalPaymentMethod.balance} currency={paypalPaymentMethod.currency} />
              </div>
              <div>
                <SmallButton bsStyle="primary" bsSize="xsmall" onClick={this.connectPaypal} disabled={this.state.connectingPaypal}>
                  { this.state.connectingPaypal && "Processing..."}
                  { !this.state.connectingPaypal && "refill the payment balance"}
                </SmallButton>
              </div>
            </div>
            <div className="connectedAt">
              <FormattedMessage id="collective.connectedAccounts.paypal.connected" defaultMessage="Paypal account connected on {createdAt, date, short}" values={{ createdAt: new Date(paypalPaymentMethod.createdAt) }} />
            </div>
          </div>
        }
        { !paypalPaymentMethod &&
          <SmallButton className="primary" bsStyle="primary" onClick={this.connectPaypal} disabled={this.state.connectingPaypal}>
            { this.state.connectingPaypal && "Connecting..."}
            { !this.state.connectingPaypal && "Connect Paypal"}
          </SmallButton>
        }
        </div>
      </div>
    );
  }
}

export default withIntl(ConnectPaypal);