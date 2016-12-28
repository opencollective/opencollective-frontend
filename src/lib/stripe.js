import Payment from 'payment';

const getStripeToken = (card) =>
new Promise((resolve, reject) => {
  // eslint-disable-next-line
  Stripe.card.createToken(card, (status, { error, id }) => {
    if (error) {
      reject(error.message);
    } else {
      resolve(id);
    }
  });
});

const isValidCard = (card) => {
  return (card && card.cvc && card.cvc.length >= 3 && card.exp_month && card.exp_year && Payment.fns.validateCardNumber(card.number));
}

export { getStripeToken, isValidCard };