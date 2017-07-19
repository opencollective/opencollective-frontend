import Payment from 'payment';

const getStripeToken = (card) =>
new Promise((resolve, reject) => {
  // eslint-disable-next-line
  Stripe.card.createToken(card, (status, res) => {
    if (res.error) {
      reject(res.error.message);
    } else {
      console.log(">>> Stripe createToken result", res)
      resolve({token: res.id, card: res.card});
    }
  });
});

const isValidCard = (card) => {
  return (card && card.cvc && card.cvc.length >= 3 && card.exp_month && card.exp_year && Payment.fns.validateCardNumber(card.number));
}

export { getStripeToken, isValidCard };