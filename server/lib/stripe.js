import Stripe from 'stripe';
import config from 'config';

export default Stripe(config.stripe.secret);
