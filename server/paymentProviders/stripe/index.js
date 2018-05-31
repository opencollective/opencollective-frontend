import config from 'config';
import jwt from 'jsonwebtoken';
import qs from 'querystring';
import axios from 'axios';

import models from '../../models';
import errors from '../../lib/errors';
import { retrieveEvent } from './gateway';
import creditcard from './creditcard';


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
      const state = jwt.sign({
        CollectiveId,
        CreatedByUserId: remoteUser.id,
        redirect: query.redirect,
        postAction: query.postAction
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
      return Promise.resolve(`${AUTHORIZE_URI}?${params}`);
    },

    // callback called by Stripe after the user approves the connection
    callback: (req, res, next) => {
      let state, collective;

      try {
        state = jwt.verify(req.query.state, config.keys.opencollective.secret);
      } catch (e) {
        return next(new errors.BadRequest(`Invalid JWT: ${e.message}`));
      }

      const { CollectiveId, CreatedByUserId, redirect, postAction } = state;

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
        .then(c => {
          collective = c;
          if (collective.type === 'COLLECTIVE') {
            collective.becomeHost();
            collective.save();
            models.Member.create({
              CreatedByUserId,
              CollectiveId: collective.id,
              MemberCollectiveId: collective.id,
              role: 'HOST'
            })
          }
        })
        .then(getToken(req.query.code))
        .then(createStripeAccount)
        .then(() => {
          if (typeof postAction === 'string' && postAction.match(/hostCollective/)) {
            const collectiveIdToHost = Number(postAction.substr(postAction.indexOf(':')+1));
            models.Collective.findById(collectiveIdToHost)
              .then(collectiveToHost => collectiveToHost.addHost(collective, { id: CreatedByUserId }))
          }
        })
        .then(() => res.redirect(redirect || `${config.host.website}/${collective.slug}?message=StripeAccountConnected`))
        .catch(next);
    }
  },

  processOrder: (order) => {
    switch (order.paymentMethod.type) {
      case 'bitcoin':
        throw new errors.BadRequest('Stripe-Bitcoin not supported anymore :(');
      case 'creditcard':        /* Fallthrough */
      default:
        return creditcard.processOrder(order);
    }
  },

  webhook: (requestBody) => {

    // Stripe sends test events to production as well
    // don't do anything if the event is not livemode
    if (process.env.NODE_ENV === 'production' && !requestBody.livemode) {
      return Promise.resolve();
    }
    /**
     * We check the event on stripe directly to be sure we don't get a fake event from
     * someone else
     */
    return retrieveEvent({ username: requestBody.user_id }, requestBody.id)
      .then(event => {
        if (!event || (event && !event.type)) {
          throw new errors.BadRequest('Event not found');
        }
        if (event.type === 'invoice.payment_succeeded') {
          return creditcard.webhook(requestBody, event)
        } else if (event.type === 'source.chargeable') {
          /* This will cause stripe to send us email alerts, saying
           * that our stuff is broken. But that should never happen
           * since they discontinued the support. */
          throw new errors.BadRequest('Stripe-Bitcoin not supported anymore :(');
        } else {
          throw new errors.BadRequest('Wrong event type received')
        }
      })
  }

}
