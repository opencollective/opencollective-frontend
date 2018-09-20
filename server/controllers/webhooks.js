import paymentProviders from '../paymentProviders';

export default function stripeWebhook(req, res, next) {
  return paymentProviders.stripe
    .webhook(req.body)
    .then(() => res.sendStatus(200))
    .catch(next);
}
