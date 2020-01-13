import config from 'config';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import debugLib from 'debug';
import { get } from 'lodash';
import { URLSearchParams } from 'url';

import models from '../../models';
import errors from '../../lib/errors';
import creditcard from './creditcard';
import { addParamsToUrl } from '../../lib/utils';
import stripe from '../../lib/stripe';

const debug = debugLib('stripe');

const AUTHORIZE_URI = 'https://connect.stripe.com/oauth/authorize';
const TOKEN_URI = 'https://connect.stripe.com/oauth/token';

const getToken = code => () =>
  axios
    .post(TOKEN_URI, {
      grant_type: 'authorization_code',
      client_id: config.stripe.clientId,
      client_secret: config.stripe.secret,
      code,
    })
    .then(res => res.data);

const getAccountInformation = data => {
  return new Promise((resolve, reject) => {
    return stripe.accounts.retrieve(data.stripe_user_id, (err, account) => {
      if (err) {
        return reject(err);
      }
      data.account = account;
      return resolve(data);
    });
  });
};

export default {
  // payment method types
  // like cc, btc, etc.
  types: {
    default: creditcard,
    creditcard,
  },

  oauth: {
    // Returns the redirectUrl to connect the Stripe Account to the Host Collective Id
    redirectUrl: (remoteUser, CollectiveId, query) => {
      // Since we pass the redirectUrl in clear to the frontend, we cannot pass the CollectiveId in the state query variable
      // It would be trivial to change that value and attach a Stripe Account to someone else's collective
      // That's why we encode the state in a JWT
      const state = jwt.sign(
        {
          CollectiveId,
          CreatedByUserId: remoteUser.id,
          redirect: query.redirect,
        },
        config.keys.opencollective.jwtSecret,
        {
          expiresIn: '45m', // People may need some time to set up their Stripe Account if they don't have one already
        },
      );

      const params = new URLSearchParams({
        response_type: 'code',
        scope: 'read_write',
        client_id: config.stripe.clientId,
        redirect_uri: config.stripe.redirectUri,
        state,
      });
      return Promise.resolve(`${AUTHORIZE_URI}?${params.toString()}`);
    },

    // callback called by Stripe after the user approves the connection
    callback: (req, res, next) => {
      let state, collective;
      debug('req.query', JSON.stringify(req.query, null, '  '));
      try {
        state = jwt.verify(req.query.state, config.keys.opencollective.jwtSecret);
      } catch (e) {
        return next(new errors.BadRequest(`Invalid JWT: ${e.message}`));
      }
      debug('state', state);
      const { CollectiveId, CreatedByUserId, redirect } = state;

      if (!CollectiveId) {
        return next(new errors.BadRequest('No state in the callback'));
      }

      let redirectUrl = redirect;

      const createStripeAccount = data =>
        models.ConnectedAccount.create({
          service: 'stripe',
          CollectiveId,
          CreatedByUserId,
          username: data.stripe_user_id,
          token: data.access_token,
          refreshToken: data.refresh_token,
          data: {
            publishableKey: data.stripe_publishable_key,
            tokenType: data.token_type,
            scope: data.scope,
            account: data.account,
          },
        });

      /**
       * Update the Host Collective
       * with the default currency of the bank account connected to the stripe account and legal address
       * @param {*} connectedAccount
       */
      const updateHost = connectedAccount => {
        if (!connectedAccount) {
          console.error('>>> updateHost: error: no connectedAccount');
        }
        const { account } = connectedAccount.data;
        if (!collective.address && account.legal_entity) {
          const { address } = account.legal_entity;
          const addressLines = [address.line1];
          if (address.line2) {
            addressLines.push(address.line2);
          }
          if (address.country === 'US') {
            addressLines.push(`${address.city} ${address.state} ${address.postal_code}`);
          } else if (address.country === 'UK') {
            addressLines.push(`${address.city} ${address.postal_code}`);
          } else {
            addressLines.push(`${address.postal_code} ${address.city}`);
          }

          addressLines.push(address.country);
          collective.address = addressLines.join('\n');
        }
        collective.currency = account.default_currency.toUpperCase();
        collective.timezone = collective.timezone || account.timezone;
        collective.becomeHost(); // adds the opencollective payment method to enable the host to allocate funds to collectives
        return collective.save();
      };

      return models.Collective.findByPk(CollectiveId)
        .then(c => {
          collective = c;
          redirectUrl = redirectUrl || `${config.host.website}/${collective.slug}`;
        })
        .then(getToken(req.query.code))
        .then(getAccountInformation)
        .then(createStripeAccount)
        .then(updateHost)
        .then(() => {
          redirectUrl = addParamsToUrl(redirectUrl, {
            message: 'StripeAccountConnected',
            CollectiveId: collective.id,
          });
          debug('redirectUrl', redirectUrl);
          return res.redirect(redirectUrl);
        })
        .catch(e => {
          if (get(e, 'data.error_description')) {
            return next(new errors.BadRequest(e.data.error_description));
          } else {
            return next(e);
          }
        });
    },
  },

  processOrder: order => {
    switch (order.paymentMethod.type) {
      case 'bitcoin':
        throw new errors.BadRequest('Stripe-Bitcoin not supported anymore :(');
      case 'creditcard': /* Fallthrough */
      default:
        return creditcard.processOrder(order);
    }
  },

  webhook: requestBody => {
    // Stripe sends test events to production as well
    // don't do anything if the event is not livemode
    if (process.env.NODE_ENV === 'production' && !requestBody.livemode) {
      return Promise.resolve();
    }
    /**
     * We check the event on stripe directly to be sure we don't get a fake event from
     * someone else
     */
    return stripe.events.retrieve(requestBody.id, { stripeAccount: requestBody.user_id }).then(event => {
      if (!event || (event && !event.type)) {
        throw new errors.BadRequest('Event not found');
      }
      if (event.type === 'invoice.payment_succeeded') {
        return creditcard.webhook(requestBody, event);
      } else if (event.type === 'source.chargeable') {
        /* This will cause stripe to send us email alerts, saying
         * that our stuff is broken. But that should never happen
         * since they discontinued the support. */
        throw new errors.BadRequest('Stripe-Bitcoin not supported anymore :(');
      } else {
        throw new errors.BadRequest('Wrong event type received');
      }
    });
  },
};
