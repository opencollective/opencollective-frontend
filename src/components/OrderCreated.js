import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import CollectiveCard from './CollectiveCard';
import TwitterLogo from './TwitterLogo';
import FacebookLogo from './FacebookLogo';
import { defineMessages, FormattedMessage } from 'react-intl';
import { formatCurrency } from '../lib/utils';
import { Button, Glyphicon } from 'react-bootstrap';

class OrderCreated extends React.Component {

  static propTypes = {
    order: PropTypes.object.isRequired, // { collective: {}, totalAmount, TierId }
    status: PropTypes.string // orderCreated | orderProcessing
  }

  constructor(props) {
    super(props);
    const { intl, order: { collective, fromCollective, totalAmount } } = props;
    this.messages = defineMessages({
      tweet: { id: 'order.created.tweet', defaultMessage: `I've just donated {amount} to {collective}. Consider donating too, every little helps!` }
    })
    if (collective) {
      const tweetText = intl.formatMessage(this.messages.tweet, {
        collective: collective.twitterHandle ? `@${collective.twitterHandle}` : collective.name,
        amount: formatCurrency(totalAmount, collective.currency, { precision: 0 })
      });
      const url = `https://opencollective.com/${collective.slug}?referral=${fromCollective.id}`;
      this.tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
      this.fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    }
  }

  open(url, w = 500, h = 300) {
    const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const left = ((width / 2) - (w / 2)) + dualScreenLeft;
    const top = ((height / 2) - (h / 2)) + dualScreenTop;
    const newWindow = window.open(url, "share", 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }    
  }

  render() {
    const { status, order: { collective, fromCollective, totalAmount } } = this.props;

    const membership = {
      role: 'BACKER',
      createdAt: new Date,
      stats: {
        totalDonations: totalAmount
      },
      collective
    };

    return (
      <div className="OrderCreated">
        <style jsx>{`
          .OrderCreated {
            display: flex;
            background: #f2f4f5;
            padding: 3rem;
            flex-direction: row;
            align-items: center;
          }
          .message {
            margin-left: 2rem;
          }
          .message h2 {
            font-size: 1.8rem;
            font-weight: bold;
          }
          .message .thankyou {
            font-weight: bold;
          }
          .message .editBtn {
            margin: 2rem;
          }
          .thankyou {
            font-weight: bold;
          }
          .error {
            color: red;
            font-size: 1.3rem;
            padding-left: 1rem;
          }
          @media (max-width: 600px) {
            .OrderCreated {
              flex-direction: column-reverse;
            }
          }
        `}</style>
        <style jsx global>{`
          .OrderCreated button {
            margin-right: 1rem;
          }
          .OrderCreated button img {
            margin-right: 1rem;
          }
        `}
        </style>

        { collective &&
          <CollectiveCard collective={collective} membership={membership} />
        }

        <div className="message">
          <p className="thankyou">
            <FormattedMessage id="collective.user.orderCreated.thankyou" defaultMessage="Thank you for your donation! 🙏" />
          </p>
          { collective &&
            <div>
              <p>
                { status === 'orderCreated' && collective &&
                  <FormattedMessage id="collective.user.orderCreated.message" defaultMessage="We have added {collective} to your profile" values={{ collective: collective.name }} />
                }
                { status === 'orderProcessing' && collective &&
                  <FormattedMessage id="collective.user.orderProcessing.message" defaultMessage="We are currently processing your donation to {collective}. We will add it to your profile and we will send you a confirmation email once the payment is confirmed." values={{ collective: collective.name }} />
                }
              </p>
              <h2>
                <FormattedMessage id="collective.user.orderCreated.helpUsRaise.title" defaultMessage="Help us raise more money!" />
              </h2>
              <p>
                <FormattedMessage id="collective.user.orderCreated.helpUsRaise.shareUrl" defaultMessage="Share this URL:" />
                <div>
                  <a href={`https://opencollective.com/${collective.slug}/donate?referral=${fromCollective.id}`}>{`https://opencollective.com/${collective.slug}/donate?referral=${fromCollective.id}`}</a>
                </div>
                <FormattedMessage id="collective.user.orderCreated.helpUsRaise.description" defaultMessage="The total amount that you will help us raise will be shown on your profile." />
              </p>
              <p>
                <Button onClick={() => this.open(this.tweetUrl)}>
                  <TwitterLogo />
                  <FormattedMessage id="collective.user.orderCreated.helpUsRaise.tweetUrl" defaultMessage="Share on Twitter" />
                </Button>
                <Button onClick={() => this.open(this.fbUrl, 550, 700)}>
                  <FacebookLogo />
                  <FormattedMessage id="collective.user.orderCreated.helpUsRaise.fbUrl" defaultMessage="Share on Facebook" />
                </Button>
              </p>
            </div>
          }
        </div>
      </div>
    );
  }

}

export default withIntl(OrderCreated);
