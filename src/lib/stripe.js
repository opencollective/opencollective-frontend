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

export { getStripeToken };