import Payment from 'payment';

const getStripeToken = (type = 'cc', data) => {

  // for testing only
  if (typeof window !== 'undefined' && window.location.search.match(/test=e2e/) && (window.location.hostname === 'staging.opencollective.com' || window.location.hostname === 'localhost')) {
    return Promise.resolve({ token: `tok_bypassPending`, card: {
      last4: 4242,
      exp_month: 11,
      exp_year: 23,
      brand: 'visa',
      country: 'us',
      funding: 'credit',
      address_zip: 10014
    }});
  }

  // eslint-disable-next-line
  switch (type) {
    case 'cc': // credit card
      return stripe.createToken(data).then(res => {
        if (res.error) {
          throw new Error(res.error.message);
        }
        return { token: res.token.id, card: res.token.card };
      });
      break;
  }
}

const isValidCard = (card) => {
  if (typeof card.cvc !== 'string') {
    card.cvc = `${card.cvc}`;
  }
  return (card && card.cvc && card.cvc.length >= 3 && card.exp_month && card.exp_year && Payment.fns.validateCardNumber(card.number));
}

export { getStripeToken, isValidCard };