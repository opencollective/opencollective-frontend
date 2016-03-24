const serverStatus = require('express-server-status');

const roles = require('./constants/roles');
const jwt = require('./middlewares/jwt');
const required = require('./middleware/required_param');

/**
 * NotImplemented response.
 */

const NotImplemented = (req, res, next) => next(new errors.NotImplemented('Not implemented yet.'));

module.exports = (app) => {

  const aN = require('./middleware/security/authentication')(app);
  const aZ = require('./middleware/security/authorization')(app);
  const errorHandler = require('./middleware/error_handler');

  /**
   * Controllers
   */

  const Controllers = app.set('controllers');
  const mw = Controllers.middlewares;
  const users = Controllers.users;
  const params = Controllers.params;
  const groups = Controllers.groups;
  const activities = Controllers.activities;
  const notifications = Controllers.notifications;
  const transactions = Controllers.transactions;
  const payments = Controllers.payments;
  const paypal = Controllers.paypal;
  const images = Controllers.images;
  const paymentMethods = Controllers.paymentmethods;
  const webhooks = Controllers.webhooks;
  const stripe = Controllers.stripe;
  const test = Controllers.test;
  const subscriptions = Controllers.subscriptions;

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
  app.put('/users/:userid', aN.authenticateAppByApiKey, required('user'), users.updateUserWithoutLoggedIn); // Update a user.
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
  app.get('/groups/:groupid/users', aZ.authorizeAccessToGroup({authIfPublic: true}),  mw.cache(60), groups.getUsers); // Get group users
  app.put('/groups/:groupid', aZ.authorizeAccessToGroup({userRoles: [HOST, MEMBER], bypassUserRolesCheckIfAuthenticatedAsAppAndNotUser: true}), required('group'), groups.update); // Update a group.
  app.delete('/groups/:groupid', NotImplemented); // Delete a group.
  app.post('/groups/:groupid/payments', aN.authenticateUserOrApp(), required('payment'), mw.getOrCreateUser, payments.post); // Make a payment/donation.
  app.post('/groups/:groupid/payments/paypal', aN.authenticateUserOrApp(), required('payment'), payments.paypal); // Make a payment/donation.

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

  app.use(mw.apiKey, jwt, mw.identifyFromToken, mw.checkJWTExpiration);

  // xdamman: having two times the same route is a mess (hard to read and error prone if we forget to return)
  // This is caused by mw.authorizeIfGroupPublic that is doing a next('route')
  // We should refactor this.
  app.post('/groups/:groupid/transactions', mw.authorizeIfGroupPublic, mw.authorizeAuthUserOrApp, mw.authorizeGroup, required('transaction'), mw.getOrCreateUser, groups.createTransaction); // Create a transaction for a group.
  app.post('/groups/:groupid/transactions', required('transaction'), mw.getOrCreateUser, groups.createTransaction); // Create a transaction for a group.

  app.get('/groups/:groupid/transactions/:transactionid', mw.authorizeIfGroupPublic, mw.authorizeAuthUserOrApp, mw.authorizeGroup, mw.authorizeTransaction, groups.getTransaction); // Get a transaction.
  app.get('/groups/:groupid/transactions/:transactionid', groups.getTransaction); // Get a transaction.
  app.put('/groups/:groupid/transactions/:transactionid', mw.authorizeAuthUserOrApp, mw.authorizeGroup, mw.authorizeTransaction, required('transaction'), groups.updateTransaction); // Update a transaction.
  app.delete('/groups/:groupid/transactions/:transactionid', mw.authorizeAuthUserOrApp, mw.authorizeGroup, mw.authorizeGroupRoles(roles.HOST), mw.authorizeTransaction, groups.deleteTransaction); // Delete a transaction.

  app.post('/groups/:groupid/transactions/:transactionid/approve', mw.authorizeAuthUserOrApp, mw.authorizeGroup, mw.authorizeTransaction, required('approved'), transactions.approve); // Approve a transaction.
  app.post('/groups/:groupid/transactions/:transactionid/pay', mw.authorizeAuthUser, mw.authorizeGroup, mw.authorizeGroupRoles([roles.HOST, roles.MEMBER]), mw.authorizeTransaction, required('service'), transactions.pay); // Pay a transaction.
  app.post('/groups/:groupid/transactions/:transactionid/attribution/:userid', mw.authorizeAuthUserOrApp, mw.authorizeGroup, mw.authorizeTransaction, mw.authorizeGroupRoles([roles.HOST, roles.MEMBER]), transactions.attributeUser); // Attribute a transaction to a user.
  app.get('/groups/:groupid/transactions/:paranoidtransactionid/callback', payments.paypalCallback); // Callback after a payment

  /**
   * Activities.
   *
   *  An activity is any action linked to a User or a Group.
   */
  app.get('/groups/:groupid/activities', mw.authorizeAuthUserOrApp, mw.authorizeGroup, mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), activities.group); // Get a group's activities.
  app.get('/users/:userid/activities', mw.authorizeAuthUser, mw.authorizeUser, mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), activities.user); // Get a user's activities.

  /**
   * Notifications.
   *
   *  A user can subscribe by email to any type of activity of a Group.
   */
  app.post('/groups/:groupid/activities/:activityType/subscribe', mw.authorizeAuthUser, mw.authorizeGroup, notifications.subscribe); // Subscribe to a group's activities
  app.post('/groups/:groupid/activities/:activityType/unsubscribe', mw.authorizeAuthUser, mw.authorizeGroup, notifications.unsubscribe); // Unsubscribe to a group's activities

  /**
   * Separate route for uploading images to S3
   */
  app.post('/images', mw.authorizeAuthUser, images.upload);

  /**
   * Webhook for stripe when it gets a new subscription invoice
   */
  app.post('/webhooks/stripe', webhooks.stripe);

  /**
   * Stripe oAuth
   */

  app.get('/stripe/authorize', mw.authorizeAuthUser, stripe.authorize);
  app.get('/stripe/oauth/callback', stripe.callback);

  /**
   * Reset test-api database
   */
  app.get('/database/reset', test.resetTestDatabase);

  /**
   * Stripe subscriptions (recurring payments)
   */
  app.get('/subscriptions', mw.jwtScope('subscriptions'), subscriptions.getAll);
  app.post('/subscriptions/:subscriptionid/cancel', mw.jwtScope('subscriptions'), subscriptions.cancel);

  /**
   * Leaderboard
   */
  app.get('/leaderboard', required('api_key'), mw.authorizeApp, groups.getLeaderboard); // Create a user.

  /**
   * Error handler.
   */
  app.use(errorHandler);

};
