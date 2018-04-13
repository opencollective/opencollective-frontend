import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { FormattedMessage } from 'react-intl';
import SmallButton from './SmallButton';
import QRCode from 'qrcode.react';
import { getStripeToken } from '../lib/stripe';
import { isValidEmail } from '../lib/utils';

class RequestBitcoin extends React.Component {

  static propTypes = {
    USDamount: PropTypes.number.isRequired,
    satoshis: PropTypes.number.isRequired,
    uri: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { USDamount, satoshis, email } = this.props;

    if (!isValidEmail(email)) {
      return (
        <div className="error">
          <FormattedMessage id="paymentMethod.bitcoin.error.invalidEmail" defaultMessage="We can't generate a bitcoin address without a valid email address." />
        </div>
      );
    }

    if (!this.props.uri) {
      return (
        <div className="loading">
          <FormattedMessage id="paymentMethod.bitcoin.loading" defaultMessage="Generating bitcoin address to receive the donation." />
        </div>
      );
    }

    const uri = this.props.uri.replace(/test_/,'');
    const btcAmount = satoshis / 100000000; // 1 BTC = 10^8 satoshis
    const btcAddress = uri.replace(/.*:/,'').replace(/\?.*/,'');
    return (
      <div className="RequestBitcoin">
        <style jsx>{`
          .QRCode {
            float: left;
            margin-right: 1rem;
            text-align: center;
          }
          .btcAmount {
            font-size: 3rem;
          }
          .instructions {
            font-size: 1.2rem;
          }
        `}</style>
        <div className="QRCode">
          <QRCode value={uri} />
          <SmallButton className="default" bsStyle="default" href={uri}><FormattedMessage id="paymentMethod.bitcoin.openApp" defaultMessage="open in app" /></SmallButton>
        </div>
        <div className="details">
          <FormattedMessage id="paymentMethod.bitcoin.send" defaultMessage="Please send" />
          <div className="btcAmount">{btcAmount} BTC</div>
          <div className="btcAddress">
            <FormattedMessage id="paymentMethod.bitcoin.toAddress" defaultMessage="to this BTC address: " />
            {btcAddress}
            <div className="instructions">
              <FormattedMessage id="paymentMethod.bitcoin.instructions" defaultMessage="You can then proceed with the donation. We will send you an email to {email} once the transaction is confirmed." values={{ email }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default withIntl(RequestBitcoin);
