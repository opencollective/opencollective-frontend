const serverStatus = require('express-server-status');

const roles = require('./constants/roles');
const jwt = require('./middleware/jwt');
const required = require('./middleware/required_param');
const ifParam = require('./middleware/if_param');

/**
 * NotImplemented response.
 */
const NotImplemented = (req, res, next) => next(new errors.NotImplemented('Not implemented yet.'));

module.exports = (app) => {

  const aN = require('./middleware/security/authentication')(app);
  const aZ = require('./middleware/security/authorization')(app);
  const errorHandler = require('./middleware/error_handler');
  const cache = require('./middleware/cache');
  const params = require('./middleware/params')(app);

  /**
   * controllers
   */
  const controllers = app.set('controllers');
  const mw = controllers.middlewares;
  const users = controllers.users;
  const groups = controllers.groups;
  const activities = controllers.activities;
  const notifications = controllers.notifications;
  const donations = controllers.donations;
  const expenses = controllers.expenses;
  const paypal = controllers.paypal;
  const images = controllers.images;
  const paymentMethods = controllers.paymentmethods;
  const webhooks = controllers.webhooks;
  const stripe = controllers.stripe;
  const test = controllers.test;
  const subscriptions = controllers.subscriptions;
  const connectedAccounts = controllers.connectedAccounts;

  const HOST = roles.HOST;
  const MEMBER = roles.MEMBER;

  /**
   * Status.
   */
  app.use('/status', serverStatus(app));

  /**
   * Parameters.
   */
  app.param('userid', params.userid);
  app.param('groupid', params.groupid);
  app.param('transactionid', params.transactionid);
  app.param('paranoidtransactionid', params.paranoidtransactionid);
  app.param('expenseid', params.expenseid);

  /**
   * User reset password flow (no jwt verification)
   */
  app.post('/users/password/forgot', aN.authenticateAppByApiKey, required('email'), users.forgotPassword); // Send forgot password email
  app.post('/users/password/reset/:userid_enc/:reset_token', aN.authenticateAppByApiKey, required('password', 'passwordConfirmation'), users.resetPassword); // Reset password

  app.post('/users/new_login_token', aN.authenticateAppByApiKey, required('email'), users.sendNewTokenByEmail);

  /**
   * Routes without expiration validation
   */
  app.post('/users/refresh_login_token', aN.authenticateUserAndAppByJwtNoExpiry(), users.refreshTokenByEmail);

  /**
   * For testing the email templates
   */
  app.get('/templates/email/:template', test.generateTestEmail);

  /**
   * Homepage
   */
  app.get('/homepage', controllers.homepage);

  /**
   * Profile
   */
  app.get('/profile/:slug', controllers.profile);

  /**
   * Discover
   */
  app.get('/discover', controllers.discover);

  /**
   * Users.
   */
  app.post('/users', aN.authenticateAppByApiKey, aZ.appAccess(0.5), required('user'), users.create); // Create a user.
  app.get('/users/:userid', aN.authenticateUserOrApp(), users.show); // Get a user.
  app.put('/users/:userid', aN.authenticateAppByApiKey, required('user'), aZ.authorizeAccessToUserWithRecentDonation, users.updateUserWithoutLoggedIn); // Update a user.
  app.put('/users/:userid/avatars', aN.authenticateAppByApiKey, required('userData'), users.getSocialMediaAvatars); // Return possible avatars for a user.
  app.put('/users/:userid/password', aZ.authorizeUserToAccessUser(), required('password', 'passwordConfirmation'), users.updatePassword); // Update a user password.
  app.put('/users/:userid/paypalemail', required('paypalEmail'), aZ.authorizeUserToAccessUser(), users.updatePaypalEmail); // Update a user paypal email.
  app.put('/users/:userid/avatar', required('avatar'), aZ.authorizeUserToAccessUser(), users.updateAvatar); // Update a user's avatar
  app.get('/users/:userid/email', NotImplemented); // Confirm a user's email.
  // TODO why is this route duplicated?
  app.post('/users', aN.authenticateAppByApiKey, aZ.appAccess(0.5), required('user'), users.create); // Create a user.

  /**
   * Authentication.
   */
  app.post('/authenticate', aN.authenticateAppByApiKey, aN.authenticateUserByPassword, users.getToken); // Authenticate user to get a token.
  app.post('/authenticate/refresh', NotImplemented); // Refresh the token (using a valid token OR a expired token + refresh_token).
  app.post('/authenticate/reset', NotImplemented); // Reset the refresh_token.

  /**
   * Credit paymentMethod.
   *
   *  Let's assume for now a paymentMethod is linked to a user.
   */

  // delete this route #postmigration, once frontend is updated
  app.get('/users/:userid/cards', aZ.authorizeUserToAccessUser(), paymentMethods.getPaymentMethods); // Get a user's paymentMethods.

  app.get('/users/:userid/payment-methods', aZ.authorizeUserToAccessUser(), paymentMethods.getPaymentMethods); // Get a user's paymentMethods.
  app.post('/users/:userid/payment-methods', NotImplemented); // Create a user's paymentMethod.
  app.put('/users/:userid/payment-methods/:paymentMethodid', NotImplemented); // Update a user's paymentMethod.
  app.delete('/users/:userid/payment-methods/:paymentMethodid', NotImplemented); // Delete a user's paymentMethod.

  /**
   * Paypal Preapproval.
   */
  app.get('/users/:userid/paypal/preapproval', aZ.authorizeUserToAccessUser(), paypal.getPreapprovalKey); // Get a user's preapproval key.
  app.post('/users/:userid/paypal/preapproval/:preapprovalkey', aZ.authorizeUserToAccessUser(), paypal.confirmPreapproval); // Confirm a preapproval key.
  app.get('/users/:userid/paypal/preapproval/:preapprovalkey', aZ.authorizeUserToAccessUser(), paypal.getDetails); // Get a preapproval key details.

  /**
   * Groups.
   */
  app.post('/groups', ifParam('flow', 'github'), aN.authenticateAppByApiKey, aN.parseJwtNoExpiryCheck, aN.checkJwtExpiry, required('payload'), groups.createFromGithub); // Create a group from a github repo
  app.post('/groups', aN.authenticateUserByJwt(), required('group'), groups.create); // Create a group. Option `role` to assign the caller directly (default to null).
  app.get('/groups/tags', groups.getGroupTags); // List all unique tags on all groups
  app.get('/groups/:groupid', aZ.authorizeAccessToGroup({authIfPublic: true}), groups.getOne);
  app.get('/groups/:groupid/users', aZ.authorizeAccessToGroup({authIfPublic: true}), cache(60), groups.getUsers); // Get group users
  app.get('/groups/:groupid/users.csv', aZ.authorizeAccessToGroup({authIfPublic: true}), cache(60), mw.format('csv'), groups.getUsers); // Get group users
  app.put('/groups/:groupid', aZ.authorizeAccessToGroup({userRoles: [HOST, MEMBER], bypassUserRolesCheckIfAuthenticatedAsAppAndNotUser: true}), required('group'), groups.update); // Update a group.
  app.delete('/groups/:groupid', NotImplemented); // Delete a group.

  // TODO: Remove #postmigration after frontend migrates to POST /groups/:groupid/donations/*
  app.post('/groups/:groupid/payments', aN.authenticateUserOrApp(), required('payment'), mw.getOrCreateUser, donations.post); // Make a payment/donation.
  app.post('/groups/:groupid/payments/paypal', aN.authenticateUserOrApp(), required('payment'), donations.paypal); // Make a payment/donation.

  app.get('/groups/:groupid/services/meetup/sync', mw.fetchUsers, controllers.services.meetup.sync);

  /**
   * UserGroup.
   *
   *  Relations between a group and a user.
   */
  app.get('/users/:userid/groups', aZ.authorizeUserToAccessUser(), users.getGroups); // Get user's groups.
  app.post('/groups/:groupid/users/:userid', aZ.authorizeAccessToGroup({userRoles: [HOST]}), groups.addUser); // Add a user to a group.
  app.put('/groups/:groupid/users/:userid', aZ.authorizeAccessToGroup({userRoles: [HOST]}), groups.updateUser); // Update a user's role in a group.
  app.delete('/groups/:groupid/users/:userid', aZ.authorizeAccessToGroup({userRoles: [HOST]}), groups.deleteUser); // Remove a user from a group.

  /**
   * Transactions (financial).
   */
  app.get('/groups/:groupid/transactions', aZ.authorizeAccessToGroup({authIfPublic: true}), mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), groups.getTransactions); // Get a group's transactions.

  // TODO remove #postmigration, replaced by POST /groups/:groupid/expenses
  const commonLegacySecurityMw = [mw.apiKey, jwt, mw.identifyFromToken, mw.checkJWTExpiration];
  app.post('/groups/:groupid/transactions', commonLegacySecurityMw, mw.authorizeIfGroupPublic, mw.authorizeAuthUserOrApp, mw.authorizeGroup, required('transaction'), mw.getOrCreateUser, groups.createTransaction); // Create a transaction for a group.
  app.post('/groups/:groupid/transactions', commonLegacySecurityMw, required('transaction'), mw.getOrCreateUser, groups.createTransaction); // Create a transaction for a group.

  // TODO remove #postmigration, replaced by GET /groups/:groupid/expenses/:expenseid
  app.get('/groups/:groupid/transactions/:transactionid', aZ.authorizeAccessToGroup({authIfPublic: true}), aZ.authorizeGroupAccessToTransaction({authIfPublic: true}), groups.getTransaction); // Get a transaction.
  // TODO remove #postmigration, replaced by PUT /groups/:groupid/expenses/:expenseid
  app.put('/groups/:groupid/transactions/:transactionid', aZ.authorizeAccessToGroup(), aZ.authorizeGroupAccessToTransaction(), required('transaction'), groups.updateTransaction); // Update a transaction.
  // TODO remove #postmigration, replaced by DEL /groups/:groupid/expenses/:expenseid
  app.delete('/groups/:groupid/transactions/:transactionid', aZ.authorizeAccessToGroup({userRoles: [HOST], bypassUserRolesCheckIfAuthenticatedAsAppAndNotUser: true}), aZ.authorizeGroupAccessToTransaction(), groups.deleteTransaction); // Delete a transaction.

  /**
   * Expenses
   */

  app.get('/groups/:groupid/expenses', aZ.authorizeAccessToGroup({authIfPublic: true}), mw.paginate(), mw.sorting({key: 'incurredAt', dir: 'DESC'}), expenses.list); // Get expenses.
  app.get('/groups/:groupid/expenses/:expenseid', aZ.authorizeAccessToGroup({authIfPublic: true}), aZ.authorizeGroupAccessTo('expense', {authIfPublic: true}), expenses.getOne); // Get an expense.
  // xdamman: having two times the same route is a mess (hard to read and error prone if we forget to return)
  // This is caused by mw.authorizeIfGroupPublic that is doing a next('route')
  // TODO refactor with single route using authentication.js and authorization.js middleware
  app.post('/groups/:groupid/expenses', commonLegacySecurityMw, mw.authorizeIfGroupPublic, mw.authorizeAuthUserOrApp, mw.authorizeGroup, required('expense'), mw.getOrCreateUser, expenses.create); // Create an expense.
  app.post('/groups/:groupid/expenses', commonLegacySecurityMw, required('expense'), mw.getOrCreateUser, expenses.create); // Create an expense.
  app.put('/groups/:groupid/expenses/:expenseid', aZ.authorizeAccessToGroup(), aZ.authorizeGroupAccessTo('expense'), required('expense'), expenses.update); // Update an expense.
  app.delete('/groups/:groupid/expenses/:expenseid', aZ.authorizeAccessToGroup({userRoles: [HOST]}), aZ.authorizeGroupAccessTo('expense'), expenses.deleteExpense); // Delete an expense.
  app.post('/groups/:groupid/expenses/:expenseid/approve', aZ.authorizeAccessToGroup({userRoles: [HOST, MEMBER]}), aZ.authorizeGroupAccessTo('expense'), required('approved'), expenses.setApprovalStatus); // Approve an expense.
  app.post('/groups/:groupid/expenses/:expenseid/pay', aZ.authorizeAccessToGroup({userRoles: [HOST]}), aZ.authorizeGroupAccessTo('expense'), expenses.pay); // Pay an expense.

  /**
   * Donations
   */

  app.post('/groups/:groupid/donations', aN.authenticateUserOrApp(), required('payment'), mw.getOrCreateUser, donations.post); // Make a stripe donation.
  app.post('/groups/:groupid/donations/paypal', aN.authenticateUserOrApp(), required('payment'), donations.paypal); // Make a paypal donation.
  app.get('/groups/:groupid/transactions/:paranoidtransactionid/callback', donations.paypalCallback); // Callback after a payment

  /**
   * Activities.
   *
   *  An activity is any action linked to a User or a Group.
   */
  app.get('/groups/:groupid/activities', aZ.authorizeAccessToGroup(), mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), activities.group); // Get a group's activities.
  app.get('/users/:userid/activities', aZ.authorizeUserToAccessUser(), mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), activities.user); // Get a user's activities.

  /**
   * Notifications.
   *
   *  A user can subscribe by email to any type of activity of a Group.
   */
  app.post('/groups/:groupid/activities/:activityType/subscribe', aN.authenticateUserByJwt(), aZ.authorizeAccessToGroup(), notifications.subscribe); // Subscribe to a group's activities
  app.post('/groups/:groupid/activities/:activityType/unsubscribe', aN.authenticateUserByJwt(), aZ.authorizeAccessToGroup(), notifications.unsubscribe); // Unsubscribe to a group's activities

  /**
   * Separate route for uploading images to S3
   */
  app.post('/images', images.upload);

  /**
   * Webhook for stripe when it gets a new subscription invoice
   */
  app.post('/webhooks/stripe', webhooks.stripe);
  app.post('/webhooks/mailgun', controllers.services.email.webhook);

  /**
   * Stripe oAuth
   */

  app.get('/stripe/authorize', aN.authenticateUserByJwt(), stripe.authorize);
  app.get('/stripe/oauth/callback', stripe.callback);

  /**
   * Generic OAuth (ConnectedAccounts)
   */
  app.get('/:slug/connected-accounts', aN.authenticateUserAndAppByJwt(), connectedAccounts.list);
  app.get('/connected-accounts/:service(github|twitter|meetup)', aN.authenticateAppByApiKey, aN.authenticateService);
  app.get('/connected-accounts/:service/callback', aN.authenticateAppByApiKey, aN.authenticateServiceCallback);
  app.get('/connected-accounts/:service/verify', aN.authenticateAppByApiKey, aN.parseJwtNoExpiryCheck, connectedAccounts.get);

  /**
   * External services
   * TODO: we need to consolidate all 3rd party services within the /services/* routes
   */
  app.get('/services/email/approve', controllers.services.email.approve);
  app.get('/services/email/unsubscribe/:email/:slug/:type/:token', controllers.services.email.unsubscribe);

  /**
   * Github API - fetch all repositories using the user's access_token
   */
  app.get('/github-repositories', aN.authenticateUserByJwt(), connectedAccounts.fetchAllRepositories);

  /**
   * Reset test-api database
   */
  app.get('/database/reset', test.resetTestDatabase);

  /**
   * Stripe subscriptions (recurring payments)
   */
  app.get('/subscriptions', aN.authenticateUserByJwt(), subscriptions.getAll);
  app.post('/subscriptions/:subscriptionid/cancel', aN.authenticateUserByJwt(), subscriptions.cancel);

  /**
   * Leaderboard
   */
  app.get('/leaderboard', aN.authenticateAppByApiKey, groups.getLeaderboard); // Create a user.

  /**
   * Override default 404 handler to make sure to obfuscate api_key visible in URL
   */
  app.use((req, res) => res.send(404));

  /**
   * Error handler.
   */
  app.use(errorHandler);

};
