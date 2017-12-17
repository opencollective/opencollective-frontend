import models from '../models';
import * as constants from '../constants/transactions';
import roles from '../constants/roles';
import * as stripe from '../gateways/stripe';
import activities from '../constants/activities';
import config from 'config';
import jwt from 'jsonwebtoken';
import qs from 'querystring';
import axios from 'axios';
import errors from '../lib/errors';

/**
 * Calculates the 1st of next month
 * input: date
 * output: 1st of following month, needs to be in Unix time and in seconds (not ms)
 */
const getSubscriptionTrialEndDate = (originalDate, interval) => {
  const newDate = new Date(originalDate.getTime())
  newDate.setDate(1);
  if (interval === 'month') {
    return Math.floor(newDate.setMonth(newDate.getMonth() + 1) / 1000); // set to 1st of next month
  } else if (interval === 'year') {
    return Math.floor(newDate.setMonth(newDate.getMonth() + 12) / 1000); // set to 1st of next year's same month
  } else {
    return null;
  }
}

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

  features: {
    recurring: true,
  },

  oauth: {

    // Returns the redirectUrl to connect the Stripe Account to the Host Collective Id
    redirectUrl: (remoteUser, CollectiveId) => {
      // Since we pass the redirectUrl in clear to the frontend, we cannot pass the CollectiveId in the state query variable
      // It would be trivial to change that value and attach a Stripe Account to someone else's collective
      // That's why we encode the state in a JWT
      const state = jwt.sign({
        CollectiveId,
        CreatedByUserId: remoteUser.id
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
        .then(() => res.redirect(`${config.host.website}/${collective.slug}?message=StripeAccountConnected`))
        .catch(next);
    }
  },

  processOrder: (order) => {

    const {
      fromCollective,
      collective,
      paymentMethod,
      subscription,
      tier
    } = order;

    const user = order.createdByUser;

    let hostStripePlan, hostStripeCustomerId;

    /**
     * Get the customerId for the Stripe Account of the Host
     * Or create one using the Stripe token associated with the platform (paymentMethod.token)
     * and saves it under PaymentMethod.data[hostStripeAccount.username]
     * @param {*} hostStripeAccount
     */
    const getOrCreateCustomerIdForHost = (hostStripeAccount) => {
      const data = paymentMethod.data || {};
      data.customerIdForHost = data.customerIdForHost || {};
      return data.customerIdForHost[hostStripeAccount.username] || stripe.createToken(hostStripeAccount, paymentMethod.customerId)
      .then(token => stripe.createCustomer(hostStripeAccount, token.id, {
        email: user.email,
        collective: order.fromCollective.info
      }))
      .then(customer => customer.id)
      .tap(customerId => {
        data.customerIdForHost[hostStripeAccount.username] = customerId;
        paymentMethod.data = data;
        paymentMethod.save();
      })
    }

    const createSubscription = (hostStripeAccount) => {
      return stripe.getOrCreatePlan(
        hostStripeAccount,
        {
          interval: subscription.interval,
          amount: order.totalAmount,
          currency: order.currency
        })
        .tap(plan => hostStripePlan = plan)
        .then(() => stripe.createSubscription(
          hostStripeAccount,
          hostStripeCustomerId,
          {
            plan: hostStripePlan.id,
            application_fee_percent: constants.OC_FEE_PERCENT,
            trial_end: getSubscriptionTrialEndDate(order.createdAt, subscription.interval),
            metadata: {
              from: `${config.host.website}/${fromCollective.slug}`,
              to: `${config.host.website}/${collective.slug}`,
              PaymentMethodId: paymentMethod.id
            }
          }))
        .then(stripeSubscription => subscription.update({ stripeSubscriptionId: stripeSubscription.id }))
        .then(subscription => subscription.activate())
        .then(subscription => models.Activity.create({
          type: activities.SUBSCRIPTION_CONFIRMED,
          data: {
            collective: collective.minimal,
            user: user.minimal,
            tier,
            subscription
          }
        }));
    };

    /**
     * Returns a Promise with the transaction created
     * Note: we need to create a token for hostStripeAccount because paymentMethod.customerId is a customer of the platform
     * See: Shared Customers: https://stripe.com/docs/connect/shared-customers
     */
    const createChargeAndTransactions = (hostStripeAccount) => {
      let charge;
      return stripe.createCharge(
        hostStripeAccount,
        {
          amount: order.totalAmount,
          currency: order.currency,
          customer: hostStripeCustomerId,
          description: order.description,
          application_fee: parseInt(order.totalAmount * constants.OC_FEE_PERCENT / 100, 10),
          metadata: {
            from: `${config.host.website}/${order.fromCollective.slug}`,
            to: `${config.host.website}/${order.collective.slug}`,
            customerEmail: user.email,
            PaymentMethodId: paymentMethod.id
          }
        })
        .tap(c => charge = c)
        .then(charge => stripe.retrieveBalanceTransaction(
          hostStripeAccount,
          charge.balance_transaction))
        .then(balanceTransaction => {
          // create a transaction
          const fees = stripe.extractFees(balanceTransaction);
          const hostFeePercent = collective.hostFeePercent;
          const payload = {
            CreatedByUserId: user.id,
            FromCollectiveId: order.FromCollectiveId,
            CollectiveId: collective.id,
            PaymentMethodId: paymentMethod.id
          };
          payload.transaction = {
            type: constants.type.CREDIT,
            OrderId: order.id,
            amount: order.totalAmount,
            currency: order.currency,
            hostCurrency: balanceTransaction.currency,
            amountInHostCurrency: balanceTransaction.amount,
            hostCurrencyFxRate: order.totalAmount / balanceTransaction.amount,
            hostFeeInHostCurrency: parseInt(balanceTransaction.amount * hostFeePercent / 100, 10),
            platformFeeInHostCurrency: fees.applicationFee,
            paymentProcessorFeeInHostCurrency: fees.stripeFee,
            description: order.description,
            data: { charge, balanceTransaction },
          };
          return models.Transaction.createFromPayload(payload);
        });
    };

    let hostStripeAccount, transactions;
    return collective.getHostStripeAccount()
      .then(stripeAccount => hostStripeAccount = stripeAccount)

      // get or create a customer under the platform stripe account
      .then(() => paymentMethod.customerId || stripe.createCustomer(
        null,
        paymentMethod.token, {
          email: user.email,
          collective: order.fromCollective.info
        }).then(customer => customer.id))
      .tap(platformCustomerId => {
        if (!paymentMethod.customerId) {
          paymentMethod.customerId = platformCustomerId;
          paymentMethod.update({ customerId: platformCustomerId })
        }
      })

      // create a customer on the host stripe account
      .then(() => getOrCreateCustomerIdForHost(hostStripeAccount))
      .tap(customerId => hostStripeCustomerId = customerId)

      // both one-time and subscriptions get charged immediately
      .then(() => createChargeAndTransactions(hostStripeAccount))
      .tap(t => transactions = t)

      // if this is a subscription, we create it now on Stripe
      .tap(() => subscription ? createSubscription(hostStripeAccount, subscription, order, paymentMethod, collective) : null)

      // add user to the collective
      .tap(() => collective.findOrAddUserWithRole({ id: user.id, CollectiveId: fromCollective.id}, roles.BACKER, { CreatedByUserId: user.id, TierId: order.TierId }))

      // Mark paymentMethod as confirmed
      .tap(() => paymentMethod.update({ confirmedAt: new Date }))

      .then(() => transactions); // make sure we return the transactions created
  }
}