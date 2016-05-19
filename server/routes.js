const serverStatus = require('express-server-status');

const roles = require('./constants/roles');
const jwt = require('./middleware/jwt');
const required = require('./middleware/required_param');

/**
 * NotImplemented response.
 */

const NotImplemented = (req, res, next) => next(new errors.NotImplemented('Not implemented yet.'));

module.exports = (app) => {

  const aN = require('./middleware/security/authentication')(app);
  const aZ = require('./middleware/security/authorization')(app);
  const errorHandler = require('./middleware/error_handler');
  const cache = require('./middleware/cache');
  const params = require('./params')(app);

  /**
   * Controllers
   */

  const Controllers = app.set('controllers');
  const mw = Controllers.middlewares;
  const users = Controllers.users;
  const groups = Controllers.groups;
  const activities = Controllers.activities;
  const notifications = Controllers.notifications;
  const transactions = Controllers.transactions;
  const donations = Controllers.donations;
  const expenses = Controllers.expenses;
  const paypal = Controllers.paypal;
  const images = Controllers.images;
  const paymentMethods = Controllers.paymentmethods;
  const webhooks = Controllers.webhooks;
  const stripe = Controllers.stripe;
  const test = Controllers.test;
  const subscriptions = Controllers.subscriptions;
  const connectedAccounts = Controllers.connectedAccounts;
  
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

  app.post('/subscriptions/new_token', aN.authenticateAppByApiKey, required('email'), subscriptions.sendNewTokenByEmail);

  /**
   * Routes without expiration validation
   */
  app.post('/subscriptions/refresh_token', aN.authenticateUserAndAppByJwtNoExpiry(), subscriptions.refreshTokenByEmail);

  /**
   * For testing the email templates
   */
  app.get('/email/:template', test.generateTestEmail);

  /**
   * Users.
   */
  app.post('/users', aN.authenticateAppByApiKey, aZ.appAccess(0.5), required('user'), users.create); // Create a user.
  app.get('/users/:userid', aN.authenticateUserByJwt(), users.show); // Get a user.
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
  app.post('/groups', aN.authenticateUserByJwt(), required('group'), groups.create); // Create a group. Option `role` to assign the caller directly (default to null).
  app.get('/groups/:groupid', aZ.authorizeAccessToGroup({authIfPublic: true}), groups.getOne);
  app.get('/groups/:groupid/users', aZ.authorizeAccessToGroup({authIfPublic: true}), cache(60), groups.getUsers); // Get group users
  app.put('/groups/:groupid', aZ.authorizeAccessToGroup({userRoles: [HOST, MEMBER], bypassUserRolesCheckIfAuthenticatedAsAppAndNotUser: true}), required('group'), groups.update); // Update a group.
  app.delete('/groups/:groupid', NotImplemented); // Delete a group.
  app.post('/groups/:groupid/donations', aN.authenticateUserOrApp(), required('payment'), mw.getOrCreateUser, donations.post); // Make a payment/donation.
  app.post('/groups/:groupid/donations/paypal', aN.authenticateUserOrApp(), required('payment'), donations.paypal); // Make a payment/donation.

  // TODO: Remove #postmigration after frontend migrates to POST /groups/:groupid/donations/*
  app.post('/groups/:groupid/payments', aN.authenticateUserOrApp(), required('payment'), mw.getOrCreateUser, donations.post); // Make a payment/donation.
  app.post('/groups/:groupid/payments/paypal', aN.authenticateUserOrApp(), required('payment'), donations.paypal); // Make a payment/donation.

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

  app.get('/groups/:groupid/transactions/:transactionid', aZ.authorizeAccessToGroup({authIfPublic: true}), aZ.authorizeGroupAccessToTransaction({authIfPublic: true}), groups.getTransaction); // Get a transaction.
  app.put('/groups/:groupid/transactions/:transactionid', aZ.authorizeAccessToGroup(), aZ.authorizeGroupAccessToTransaction(), required('transaction'), groups.updateTransaction); // Update a transaction.
  app.delete('/groups/:groupid/transactions/:transactionid', aZ.authorizeAccessToGroup({userRoles: [HOST], bypassUserRolesCheckIfAuthenticatedAsAppAndNotUser: true}), aZ.authorizeGroupAccessToTransaction(), groups.deleteTransaction); // Delete a transaction.
  // TODO remove #postmigration, replaced by POST /groups/:groupid/expenses/:expenseid/approve
  app.post('/groups/:groupid/transactions/:transactionid/approve', aZ.authorizeAccessToGroup(), aZ.authorizeGroupAccessToTransaction(), required('approved'), transactions.setApprovedState); // Approve a transaction.
  app.post('/groups/:groupid/transactions/:transactionid/pay', aZ.authorizeAccessToGroup({userRoles: [HOST, MEMBER]}), aZ.authorizeGroupAccessToTransaction(), required('service'), transactions.pay); // Pay a transaction.
  app.post('/groups/:groupid/transactions/:transactionid/attribution/:userid', aZ.authorizeAccessToGroup({userRoles: [HOST, MEMBER], bypassUserRolesCheckIfAuthenticatedAsAppAndNotUser: true}), aZ.authorizeGroupAccessToTransaction(), transactions.attributeUser); // Attribute a transaction to a user.
  app.get('/groups/:groupid/transactions/:paranoidtransactionid/callback', donations.paypalCallback); // Callback after a payment

  /**
   * Expenses
   */

  // xdamman: having two times the same route is a mess (hard to read and error prone if we forget to return)
  // This is caused by mw.authorizeIfGroupPublic that is doing a next('route')
  // TODO refactor with single route using authentication.js and authorization.js middleware
  app.post('/groups/:groupid/expenses', commonLegacySecurityMw, mw.authorizeIfGroupPublic, mw.authorizeAuthUserOrApp, mw.authorizeGroup, required('expense'), mw.getOrCreateUser, expenses.create); // Create an expense for a group.
  app.post('/groups/:groupid/expenses', commonLegacySecurityMw, required('expense'), mw.getOrCreateUser, expenses.create); // Create an expense for a group.
  app.post('/groups/:groupid/expenses/:expenseid/approve', aZ.authorizeAccessToGroup(), aZ.authorizeGroupAccessTo('expense'), required('approved'), expenses.setApprovalStatus); // Approve an expense.


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

  /**
   * Stripe oAuth
   */

  app.get('/stripe/authorize', aN.authenticateUserByJwt(), stripe.authorize);
  app.get('/stripe/oauth/callback', stripe.callback);

  /**
   * Generic OAuth2 (ConnectedAccounts)
   */
  app.get('/connected-accounts/:service(github)', aN.authenticateAppByApiKey, aN.authenticateService);
  app.get('/connected-accounts/:service/callback', aN.authenticateAppByEncryptedApiKey, aN.authenticateServiceCallback);
  app.get('/connected-accounts/:service/verify', aN.authenticateAppByApiKey, aN.parseJwtNoExpiryCheck, connectedAccounts.get);

  /**
   * Reset test-api database
   */
  app.get('/database/reset', test.resetTestDatabase);

  /**
   * Stripe subscriptions (recurring payments)
   */
  app.get('/subscriptions', aZ.authorizeUserToAccessScope('subscriptions'), subscriptions.getAll);
  app.post('/subscriptions/:subscriptionid/cancel', aZ.authorizeUserToAccessScope('subscriptions'), subscriptions.cancel);

  /**
   * Leaderboard
   */
  app.get('/leaderboard', aN.authenticateAppByApiKey, groups.getLeaderboard); // Create a user.

  /**
   * Error handler.
   */
  app.use(errorHandler);

};
