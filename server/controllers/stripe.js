import axios from 'axios';
import qs from 'querystring';
import config from 'config';
import models from '../models';
import errors from '../lib/errors';
import roles from '../constants/roles';

const AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize';
const TOKEN_URI = 'https://connect.stripe.com/oauth/token';

const getHostCollective = UserId =>
  models.Member.find({
    where: {
      CreatedByUserId: UserId,
      role: roles.HOST
    },
    include: [ { model: models.Collective, as: 'collective' }]
  })
  .then(member => {
    if (!member) throw new errors.BadRequest(`User (id: ${UserId}) is not a host`);
    return member.collective;
  });

const getToken = code => () => axios
  .post(TOKEN_URI, {
    grant_type: 'authorization_code',
    client_id: config.stripe.clientId,
    client_secret: config.stripe.secret,
    code
  })
  .then(res => res.data);

const createStripeAccount = data => models.StripeAccount.create({
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  tokenType: data.token_type,
  stripePublishableKey: data.stripe_publishable_key,
  stripeUserId: data.stripe_user_id,
  scope: data.scope
});

/**
 * Ask stripe for authorization OAuth
 */
export const authorize = (req, res, next) => {
  getHostCollective(req.remoteUser.id)
    .then(() => {
      const params = qs.stringify({
        response_type: 'code',
        scope: 'read_write',
        client_id: config.stripe.clientId,
        redirect_uri: config.stripe.redirectUri,
        state: req.remoteUser.id
      });

      res.send({
        redirectUrl: `${AUTHORIZE_URI}?${params}`
      });
    })
    .catch(next);
};

/**
 * Callback for the stripe OAuth
 */
export const callback = (req, res, next) => {
  let host;
  const userId = req.query.state;

  if (!userId) {
    return next(new errors.BadRequest('No state in the callback'));
  }

  getHostCollective(userId)
    .tap(h => host = h)
    .then(getToken(req.query.code))
    .then(createStripeAccount)
    .then(stripeAccount => host.setStripeAccount(stripeAccount))
    .then(() => res.redirect(`${config.host.website}/${host.username}/settings?stripeStatus=success`))
    .catch(next);
};
