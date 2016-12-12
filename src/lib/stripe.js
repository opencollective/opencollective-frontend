const getStripeToken = (card) =>
new Promise((resolve, reject) => {
  Stripe.card.createToken(card, (status, { error, id }) => {
    if (error) {
      reject(error.message);
    } else {
      resolve(id);
    }
  });
});

export { getStripeToken };