import serverStatus from 'express-server-status';
import GraphHTTP from 'express-graphql'
import curlify from 'request-as-curl';

import schema from './graphql/schema';
import * as connectedAccounts from './controllers/connectedAccounts';
import getDiscoverPage from './controllers/discover';
import * as transactions from './controllers/transactions';
import * as expenses from './controllers/expenses';
import * as collectives from './controllers/collectives';
import getHomePage from './controllers/homepage';
import uploadImage from './controllers/images';
import * as mw from './controllers/middlewares';
import * as notifications from './controllers/notifications';
import getPaymentMethods from './controllers/paymentMethods';
import * as subscriptions from './controllers/subscriptions';
import * as test from './controllers/test';
import * as users from './controllers/users';
import stripeWebhook from './controllers/webhooks';

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

  if (process.env.NODE_ENV !== 'development') {
    app.use('*', auth.authorizeApiKey);
  }

  if (process.env.DEBUG) {
    app.use('*', (req, res, next) => {
      const body = Object.assign({}, req.body);
      if (body.query) {
        const query = body.query;
        debug('params')(query);
        delete body.query;
      }
      debug('params')("req.query", req.query);
      debug('params')("req.body", JSON.stringify(body, null, '  '));
      debug('params')("req.params", req.params);
      debug('headers')("req.headers", req.headers);
      debug('curl')("curl", curlify(req, req.body))
      next();
    });
  }

  /**
   * User reset password or new token flow (no jwt verification)
   */
  app.post('/users/signin', required('user'), users.signin);
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
   * Webhooks that should bypass api key check
   */
  app.post('/webhooks/stripe', stripeWebhook); // when it gets a new subscription invoice
  app.post('/webhooks/mailgun', email.webhook); // when receiving an email
  app.get('/connected-accounts/:service/callback', aN.authenticateServiceCallback); // oauth callback
  
  app.use(sanitizer()); // note: this break /webhooks/mailgun /graphiql

  /**
   * Homepage
   */
  app.get('/homepage', getHomePage); // This query takes 5s to execute!!!


  /**
   * Discover
   */
  app.get('/discover', getDiscoverPage);

  app.get('/fxrate/:fromCurrency/:toCurrency/:date?', transactions.getFxRateController);

  /**
   * Users.
   */
  app.post('/users', required('user'), users.create); // Create a user.
  app.get('/users/exists', required('email'), users.exists); // Checks the existence of a user based on email.
  app.get('/users/:userid', users.show); // Get a user.  
  app.put('/users/:userid/paypalemail', auth.mustBeLoggedInAsUser, required('paypalEmail'), users.updatePaypalEmail); // Update a user paypal email.
  app.get('/users/:userid/email', NotImplemented); // Confirm a user's email.

  // TODO: Why is this a PUT and not a GET?
  app.put('/users/:userid/images', required('userData'), users.getSocialMediaAvatars); // Return possible images for a user.
  
  
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
   * Collectives.
   */
  app.post('/groups', ifParam('flow', 'github'), aN.parseJwtNoExpiryCheck, aN.checkJwtExpiry, required('payload'), collectives.createFromGithub); // Create a collective from a github repo
  app.post('/groups', required('group'), collectives.create); // Create a collective, optionally include `users` with `role` to add them. No need to be authenticated.
  app.get('/groups/tags', collectives.getCollectiveTags); // List all unique tags on all collectives
  app.get('/groups/:collectiveid', collectives.getOne);
  app.get('/groups/:collectiveid/:tierSlug(backers|users)', cache(60), collectives.getUsers); // Get collective backers
  app.get('/groups/:collectiveid/:tierSlug(backers|users).csv', cache(60), mw.format('csv'), collectives.getUsers);
  app.put('/groups/:collectiveid', auth.canEditCollective, required('group'), collectives.update); // Update a collective.
  app.put('/groups/:collectiveid/settings', auth.canEditCollective, required('group'), collectives.updateSettings); // Update collective settings
  app.delete('/groups/:collectiveid', NotImplemented); // Delete a collective.

  app.get('/groups/:collectiveid/services/meetup/sync', mw.fetchUsers, syncMeetup);

  /**
   * Member.
   *
   *  Relations between a collective and a user.
   */
  app.post('/groups/:collectiveid/users/:userid', auth.canEditCollective, collectives.addUser); // Add a user to a collective.

  /**
   * Transactions (financial).
   */
  app.get('/transactions/:transactionuuid', transactions.getOne); // Get the transaction details
  app.get('/groups/:collectiveid/transactions', mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), collectives.getTransactions); // Get a group's transactions.
  
  /**
   * Expenses
   */
   // TODO: Built a better frontend and remove hack 
   // mw.paginate({default: 50}) is a hack to unblock hosts from finding expenses that have more than 20 expenses
  app.get('/groups/:collectiveid/expenses', mw.paginate({default: 50}), mw.sorting({key: 'incurredAt', dir: 'DESC'}), expenses.list); // Get expenses.
  app.get('/groups/:collectiveid/expenses/:expenseid', expenses.getOne); // Get an expense.
  app.post('/groups/:collectiveid/expenses', required('expense'), mw.getOrCreateUser, expenses.create); // Create an expense as visitor or logged in user
  app.put('/groups/:collectiveid/expenses/:expenseid', auth.canEditExpense, required('expense'), expenses.update); // Update an expense.
  app.delete('/groups/:collectiveid/expenses/:expenseid', auth.canEditExpense, expenses.deleteExpense); // Delete an expense.
  app.post('/groups/:collectiveid/expenses/:expenseid/approve', auth.canEditCollective, required('approved'), expenses.setApprovalStatus); // Approve an expense.
  app.post('/groups/:collectiveid/expenses/:expenseid/pay', auth.mustHaveRole(roles.HOST), expenses.pay); // Pay an expense.


  /**
   * Notifications.
   *
   *  A user can subscribe by email to any type of activity of a Collective.
   */
  app.post('/groups/:collectiveid/activities/:activityType/subscribe', auth.mustBePartOfTheCollective, notifications.subscribe); // Subscribe to a collective's activities
  app.post('/groups/:collectiveid/activities/:activityType/unsubscribe', notifications.unsubscribe); // Unsubscribe to a collective's activities

  /**
   * Separate route for uploading images to S3
   * TODO: User should be logged in
   */
  app.post('/images', uploadImage);

  /**
   * Generic OAuth (ConnectedAccounts)
   */
  app.get('/:slug/connected-accounts', connectedAccounts.list);
  app.get('/connected-accounts/:service(github)', aN.authenticateService); // backward compatibility
  app.get('/connected-accounts/:service(github|twitter|meetup|stripe|paypal)/oauthUrl', aN.authenticateService);
  app.get('/connected-accounts/:service/verify', aN.parseJwtNoExpiryCheck, connectedAccounts.verify);


  // /**
  //  * Paypal Preapproval.
  //  */
  // app.get('/users/:userid/paypal/preapproval', auth.mustBeLoggedInAsUser, paypal.getPreapprovalKey); // Get a user's preapproval key.
  // app.post('/users/:userid/paypal/preapproval/:preapprovalkey', auth.mustBeLoggedInAsUser, paypal.confirmPreapproval); // Confirm a preapproval key.
  // app.get('/users/:userid/paypal/preapproval/:preapprovalkey', auth.mustBeLoggedInAsUser, paypal.getDetails); // Get a preapproval key details.


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
