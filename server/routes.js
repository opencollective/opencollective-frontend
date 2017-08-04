import serverStatus from 'express-server-status';
import GraphHTTP from 'express-graphql'

import schema from './graphql/schema';
import * as connectedAccounts from './controllers/connectedAccounts';
import getDiscoverPage from './controllers/discover';
import * as orders from './controllers/orders';
import * as transactions from './controllers/transactions';
import * as expenses from './controllers/expenses';
import * as collectives from './controllers/collectives';
import getHomePage from './controllers/homepage';
import uploadImage from './controllers/images';
import * as mw from './controllers/middlewares';
import * as notifications from './controllers/notifications';
import getPaymentMethods from './controllers/paymentMethods';
import * as paypal from './controllers/paypal';
import * as stripe from './controllers/stripe';
import * as subscriptions from './controllers/subscriptions';
import * as test from './controllers/test';
import * as users from './controllers/users';
import stripeWebhook from './controllers/stripeWebhook';

import * as email from './controllers/services/email';
import syncMeetup from './controllers/services/meetup';

import roles from './constants/roles';
import required from './middleware/required_param';
import ifParam from './middleware/if_param';
import * as aN from './middleware/security/authentication';
import * as auth from './middleware/security/auth';
import errorHandler from './middleware/error_handler';
import cache from './middleware/cache';
import * as params from './middleware/params';
import errors from './lib/errors';

import sanitizer from './middleware/sanitizer';

import debug from 'debug';

/**
 * NotImplemented response.
 */
const NotImplemented = (req, res, next) => next(new errors.NotImplemented('Not implemented yet.'));

export default (app) => {
  /**
   * Status.
   */
  app.use('/status', serverStatus(app));

  app.use('*', auth.authorizeApiKey);

  if (process.env.DEBUG) {
    app.use('*', (req, res, next) => {
      const body = Object.assign({}, req.body);
      if (body.query) {
        const query = body.query;
        debug('params')(query);
        delete body.query;
      }
      debug('params')("req.query", req.query);
      debug('params')("req.body", body);
      debug('params')("req.params", req.params);
      debug('headers')("req.headers", req.headers);
      next();
    });
  }

  /**
   * User reset password or new token flow (no jwt verification)
   */
  app.post('/users/new_login_token', required('email'), mw.getOrCreateUser, users.sendNewTokenByEmail);
  app.post('/users/refresh_login_token', aN.authenticateUserByJwtNoExpiry(), users.refreshTokenByEmail);

  /**
   * Moving forward, all requests will try to authenticate the user if there is a JWT token provided
   * (an error will be returned if the JWT token is invalid, if not present it will simply continue)
   */
  app.use('*', aN.authenticateUser); // populate req.remoteUser if JWT token provided in the request

  /**
   * Parameters.
   */
  app.param('userid', params.userid);
  app.param('collectiveid', params.collectiveid);
  app.param('transactionuuid', params.transactionuuid);
  app.param('paranoidtransactionid', params.paranoidtransactionid);
  app.param('expenseid', params.expenseid);

  /**
   * GraphQL
   */
  app.use('/graphql', GraphHTTP({
    schema: schema,
    pretty: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging',
    graphiql: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging'
  }));

  /**
   * Webhook for stripe when it gets a new subscription invoice
   */
  app.post('/webhooks/stripe', stripeWebhook);
  app.post('/webhooks/mailgun', email.webhook);

  app.use(sanitizer()); // note: this break /webhooks/mailgun /graphiql

  /**
   * Homepage
   */
  app.get('/homepage', getHomePage);


  /**
   * Discover
   */
  app.get('/discover', getDiscoverPage);

  /**
   * Users.
   */
  app.post('/users', required('user'), users.create); // Create a user.
  app.put('/users/:userid/paypalemail', auth.mustBeLoggedInAsUser, required('paypalEmail'), users.updatePaypalEmail); // Update a user paypal email.
  app.get('/users/:userid/email', NotImplemented); // Confirm a user's email.

  // TODO: Why is this a PUT and not a GET?
  app.put('/users/:userid/images', required('userData'), users.getSocialMediaAvatars); // Return possible images for a user.
  
  /**
   * Authentication.
   */
  app.post('/authenticate', aN.authenticateUserByPassword, users.getToken); // Authenticate user to get a token.
  app.post('/authenticate/refresh', NotImplemented); // Refresh the token (using a valid token OR a expired token + refresh_token).
  app.post('/authenticate/reset', NotImplemented); // Reset the refresh_token.

  /**
   * Credit paymentMethod.
   *
   *  Let's assume for now a paymentMethod is linked to a user.
   */
  // delete this route #postmigration, once frontend is updated
  app.get('/users/:userid/cards', auth.mustBeLoggedInAsUser, getPaymentMethods); // Get a user's paymentMethods.

  app.get('/users/:userid/payment-methods', auth.mustBeLoggedInAsUser, getPaymentMethods); // Get a user's paymentMethods.
  app.post('/users/:userid/payment-methods', NotImplemented); // Create a user's paymentMethod.
  app.put('/users/:userid/payment-methods/:paymentMethodid', NotImplemented); // Update a user's paymentMethod.
  app.delete('/users/:userid/payment-methods/:paymentMethodid', NotImplemented); // Delete a user's paymentMethod.

  /**
   * Paypal Preapproval.
   */
  app.get('/users/:userid/paypal/preapproval', auth.mustBeLoggedInAsUser, paypal.getPreapprovalKey); // Get a user's preapproval key.
  app.post('/users/:userid/paypal/preapproval/:preapprovalkey', auth.mustBeLoggedInAsUser, paypal.confirmPreapproval); // Confirm a preapproval key.
  app.get('/users/:userid/paypal/preapproval/:preapprovalkey', auth.mustBeLoggedInAsUser, paypal.getDetails); // Get a preapproval key details.

  /**
   * Collectives.
   */
  app.post('/collectives', ifParam('flow', 'github'), aN.parseJwtNoExpiryCheck, aN.checkJwtExpiry, required('payload'), collectives.createFromGithub); // Create a collective from a github repo
  app.post('/collectives', required('collective'), collectives.create); // Create a collective, optionally include `users` with `role` to add them. No need to be authenticated.
  app.get('/collectives/tags', collectives.getCollectiveTags); // List all unique tags on all collectives
  app.get('/collectives/:collectiveid', collectives.getOne);
  app.get('/collectives/:collectiveid/:tierSlug(backers|users)', cache(60), collectives.getUsers); // Get collective backers
  app.get('/collectives/:collectiveid/:tierSlug(backers|users).csv', cache(60), mw.format('csv'), collectives.getUsers);
  app.put('/collectives/:collectiveid', auth.canEditCollective, required('collective'), collectives.update); // Update a collective.
  app.put('/collectives/:collectiveid/settings', auth.canEditCollective, required('collective'), collectives.updateSettings); // Update collective settings
  app.delete('/collectives/:collectiveid', NotImplemented); // Delete a collective.

  app.get('/collectives/:collectiveid/services/meetup/sync', mw.fetchUsers, syncMeetup);

  /**
   * Member.
   *
   *  Relations between a collective and a user.
   */
  app.post('/collectives/:collectiveid/users/:userid', auth.canEditCollective, collectives.addUser); // Add a user to a collective.

  /**
   * Transactions (financial).
   */
  app.get('/collectives/:collectiveid/transactions', mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), collectives.getTransactions); // Get a collective's transactions.
  app.get('/transactions/:transactionuuid', transactions.getOne); // Get the transaction details

  // TODO remove once app is deprecated, replaced by POST /collectives/:collectiveid/expenses and POST /collectives/:collectiveid/donations/manual
  app.post('/collectives/:collectiveid/transactions', required('transaction'), auth.canEditCollective, collectives.createTransaction); // Create a transaction for a collective.


  /**
   * Expenses
   */
   // TODO: Built a better frontend and remove hack 
   // mw.paginate({default: 50}) is a hack to unblock hosts from finding expenses that have more than 20 expenses
  app.get('/collectives/:collectiveid/expenses', mw.paginate({default: 50}), mw.sorting({key: 'incurredAt', dir: 'DESC'}), expenses.list); // Get expenses.
  app.get('/collectives/:collectiveid/expenses/:expenseid', expenses.getOne); // Get an expense.
  app.post('/collectives/:collectiveid/expenses', required('expense'), mw.getOrCreateUser, expenses.create); // Create an expense as visitor or logged in user
  app.put('/collectives/:collectiveid/expenses/:expenseid', auth.canEditExpense, required('expense'), expenses.update); // Update an expense.
  app.delete('/collectives/:collectiveid/expenses/:expenseid', auth.canEditExpense, expenses.deleteExpense); // Delete an expense.
  app.post('/collectives/:collectiveid/expenses/:expenseid/approve', auth.canEditCollective, required('approved'), expenses.setApprovalStatus); // Approve an expense.
  app.post('/collectives/:collectiveid/expenses/:expenseid/pay', auth.mustHaveRole(roles.HOST), expenses.pay); // Pay an expense.

  
  /**
   * Orders
   */
  app.post('/collectives/:collectiveid/orders/manual', required('order'), auth.mustHaveRole(roles.HOST), orders.manual); // Create a manual order.
  // app.post('/collectives/:collectiveid/donations/paypal', required('payment'), orders.paypal); // Make a paypal order.
  // app.get('/collectives/:collectiveid/transactions/:paranoidtransactionid/callback', orders.paypalCallback); // Callback after a payment

  /**
   * Notifications.
   *
   *  A user can subscribe by email to any type of activity of a Collective.
   */
  app.post('/collectives/:collectiveid/activities/:activityType/subscribe', auth.mustBePartOfTheCollective, notifications.subscribe); // Subscribe to a collective's activities
  app.post('/collectives/:collectiveid/activities/:activityType/unsubscribe', notifications.unsubscribe); // Unsubscribe to a collective's activities

  /**
   * Separate route for uploading images to S3
   * TODO: User should be logged in
   */
  app.post('/images', uploadImage);

  /**
   * Stripe oAuth
   */
  app.get('/stripe/authorize', auth.mustBeLoggedIn, stripe.authorize);
  app.get('/stripe/oauth/callback', stripe.callback);

  /**
   * Generic OAuth (ConnectedAccounts)
   */
  app.get('/:slug/connected-accounts', connectedAccounts.list);
  app.get('/connected-accounts/:service(github|twitter|meetup)', aN.authenticateService);
  app.get('/connected-accounts/:service/callback', aN.authenticateServiceCallback);
  app.get('/connected-accounts/:service/verify', aN.parseJwtNoExpiryCheck, connectedAccounts.get);

  /**
   * External services
   * TODO: we need to consolidate all 3rd party services within the /services/* routes
   */
  app.get('/services/email/approve', email.approve);
  app.get('/services/email/unsubscribe/:email/:slug/:type/:token', email.unsubscribe);

  /**
   * Github API - fetch all repositories using the user's access_token
   */
  app.get('/github-repositories', connectedAccounts.fetchAllRepositories);

  /**
   * test-api routes
   */
  app.get('/database/reset', test.resetTestDatabase);
  app.get('/test/loginlink', test.getTestUserLoginUrl);
  app.get('/test/pdf', test.exportPDF);

  /**
   * Stripe subscriptions (recurring payments)
   */
  app.get('/subscriptions', auth.mustBeLoggedIn, subscriptions.getAll);
  app.post('/subscriptions/:subscriptionid/cancel', auth.mustBeLoggedIn, subscriptions.cancel);

  /**
   * Override default 404 handler to make sure to obfuscate api_key visible in URL
   */
  app.use((req, res) => res.sendStatus(404));

  /**
   * Error handler.
   */
  app.use(errorHandler);

};
