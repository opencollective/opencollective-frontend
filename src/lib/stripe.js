import Payment from 'payment';

const getStripeToken = (type = 'cc', data) => {

  let stripe;
  if (typeof Stripe !== "undefined") {
    const stripePublishableKey = (typeof window !== "undefined" && (window.location.hostname === 'localhost' || window.location.hostname === 'staging.opencollective.com')) ? 'pk_test_5aBB887rPuzvWzbdRiSzV3QB' : 'pk_live_qZ0OnX69UlIL6pRODicRzsZy';
    // eslint-disable-next-line
    stripe = Stripe(stripePublishableKey);
  }

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line
    switch (type) {
      case 'cc': // credit card
        stripe.card.createToken(data, (status, res) => {
          if (res.error) {
            reject(res.error.message);
          } else {
            console.log(">>> stripe createToken result", res)
            resolve({token: res.id, card: res.card});
          }
        });
        break;

      case 'btc': // bitcoin
        stripe.createSource({
          type: 'bitcoin',
          amount: data.amount,
          currency: 'usd',
          metadata: data.metadata,
          owner: {
            email: data.email,
            name: data.name
          }
        }).then(function(res) {
          resolve({token: res.source.id, data: res.source.bitcoin});
        });
    }
  });
}

const isValidCard = (card) => {
  if (typeof card.cvc !== 'string') {
    card.cvc = `${card.cvc}`;
  }
  return (card && card.cvc && card.cvc.length >= 3 && card.exp_month && card.exp_year && Payment.fns.validateCardNumber(card.number));
}

export { getStripeToken, isValidCard };