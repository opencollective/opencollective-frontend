import axios from 'axios';
import qs from 'querystring';
import config from 'config';
import models from '../models';
import errors from '../lib/errors';
import jwt from 'jsonwebtoken';

const AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize';
const TOKEN_URI = 'https://connect.stripe.com/oauth/token';

const getToken = code => () => axios
  .post(TOKEN_URI, {
    grant_type: 'authorization_code',
    client_id: config.stripe.clientId,
    client_secret: config.stripe.secret,
    code
  })
  .then(res => res.data);

/**
 * Ask stripe for authorization OAuth
 */
export const authorize = (req, res, next) => {

  if (!req.remoteUser || !req.remoteUser.isAdmin(req.query.CollectiveId)) {
    return next(new errors.Unauthorized('You must be logged in as an admin of this collective to be able to connect it to a Stripe Account'));
  }

  return models.ConnectedAccount.findOne({ where: { service: 'stripe', CollectiveId: req.query.CollectiveId }})
    .then(ExistingStripeAccount => {
      if (ExistingStripeAccount) throw new errors.ValidationFailed(null, ['CollectiveId'], 'Collective already has a stripe account connected');
      return true;
    })
    .then(() => {

      // Since we pass the redirectUrl in clear to the frontend, we cannot pass the CollectiveId in the state query variable
      // It would be trivial to change that value and attach a Stripe Account to someone else's collective
      // That's why we encode the state in a JWT
      const state = jwt.sign({
        CollectiveId: req.query.CollectiveId,
        CreatedByUserId: req.remoteUser.id
      }, config.keys.opencollective.secret, {
        expiresIn: '45m' // People may need some time to set up their Stripe Account if they don't have one already
      });

      const params = qs.stringify({
        response_type: 'code',
        scope: 'read_write',
        client_id: config.stripe.clientId,
        redirect_uri: config.stripe.redirectUri,
        state
      });

      return res.send(200, { redirectUrl: `${AUTHORIZE_URI}?${params}` });
    })
    .catch(next)
};

/**
 * Callback for the stripe OAuth (webhook)
 */
export const callback = (req, res, next) => {
  let state, collective;

  try {
    state = jwt.verify(req.query.state, config.keys.opencollective.secret);
  } catch (e) {
    return next(new errors.BadRequest(`Invalid JWT: ${e.message}`));
  }

  const { CollectiveId, CreatedByUserId } = state;

  if (!CollectiveId) {
    return next(new errors.BadRequest('No state in the callback'));
  }

  const createStripeAccount = data => models.ConnectedAccount.create({
    service: 'stripe',
    CollectiveId,
    CreatedByUserId,
    username: data.stripe_user_id,
    token: data.access_token,
    refreshToken: data.refresh_token,
    data: {
      publishableKey: data.stripe_publishable_key,
      tokenType: data.token_type,
      scope: data.scope
    }
  });

  models.Collective.findById(CollectiveId)
    .then(c => collective = c)
    .then(getToken(req.query.code))
    .then(createStripeAccount)
    .then(() => res.redirect(`${config.host.website}/${collective.slug}?message=StripeAccountConnected`))
    .catch(next);
};
