import Payment from 'payment';

const getStripeToken = (type = 'cc', data) => {

  // eslint-disable-next-line
  switch (type) {
    case 'cc': // credit card
      return stripe.createToken(data).then(res => {
        return { token: res.token.id, card: res.token.card };
      });
      break;

    case 'btc': // bitcoin
      return stripe.createSource({
        type: 'bitcoin',
        amount: data.amount,
        currency: 'usd',
        metadata: data.metadata,
        owner: {
          email: data.email,
          name: data.name
        }
      }).then(function(res) {
        return { token: res.source.id, data: res.source.bitcoin };
      });
  }
}

const isValidCard = (card) => {
  if (typeof card.cvc !== 'string') {
    card.cvc = `${card.cvc}`;
  }
  return (card && card.cvc && card.cvc.length >= 3 && card.exp_month && card.exp_year && Payment.fns.validateCardNumber(card.number));
}

export { getStripeToken, isValidCard };