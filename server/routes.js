import serverStatus from 'express-server-status';
import GraphHTTP from 'express-graphql'

import schema from './graphql/schema';
import * as activities from './controllers/activities';
import * as connectedAccounts from './controllers/connectedAccounts';
import getDiscoverPage from './controllers/discover';
import * as donations from './controllers/donations';
import * as transactions from './controllers/transactions';
import * as expenses from './controllers/expenses';
import * as comments from './controllers/comments';
import * as groups from './controllers/groups';
import getHomePage from './controllers/homepage';
import uploadImage from './controllers/images';
import * as mw from './controllers/middlewares';
import * as notifications from './controllers/notifications';
import getPaymentMethods from './controllers/paymentMethods';
import * as paypal from './controllers/paypal';
import getProfilePage from './controllers/profile';
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

/**
 * NotImplemented response.
 */
const NotImplemented = (req, res, next) => next(new errors.NotImplemented('Not implemented yet.'));

export default (app) => {
  /**
   * Status.
   */
  app.use('/status', serverStatus(app));

  /**
   * For testing the email templates
   */
  app.get('/templates/email/:template', test.generateTestEmail);

  app.use('*', auth.authorizeApiKey);

  /**
   * User reset password or new token flow (no jwt verification)
   */
  app.post('/users/password/forgot', required('email'), users.forgotPassword); // Send forgot password email
  app.post('/users/password/reset/:userid_enc/:reset_token', required('password', 'passwordConfirmation'), users.resetPassword); // Reset password`
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
  app.param('groupid', params.groupid);
  app.param('transactionuuid', params.transactionuuid);
  app.param('paranoidtransactionid', params.paranoidtransactionid);
  app.param('expenseid', params.expenseid);
  app.param('commentid', params.commentid);

  /**
   * GraphQL
   */
  app.use('/graphql', GraphHTTP({
    schema: schema,
    rootValue: { remoteUser: (args, request) => request.remoteUser }, // passes in logged in user
    pretty: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging',
    graphiql: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging'
  }));

  /**
   * Homepage
   */
  app.get('/homepage', getHomePage);

  /**
   * Profile page of a user, organization or collective
   */
  app.get('/profile/:slug', getProfilePage);

  /**
   * Discover
   */
  app.get('/discover', getDiscoverPage);

  /**
   * Users.
   */
  app.post('/users', required('user'), users.create); // Create a user.
  app.get('/users/:userid', users.show); // Get a user.
  app.put('/users/:userid', required('user'), users.updateUser); // Update a user (needs to be logged as user or user must not have a password and made recent donation)
  app.put('/users/:userid/password', auth.mustBeLoggedInAsUser, required('password', 'passwordConfirmation'), users.updatePassword); // Update a user password.
  app.put('/users/:userid/paypalemail', auth.mustBeLoggedInAsUser, required('paypalEmail'), users.updatePaypalEmail); // Update a user paypal email.
  app.put('/users/:userid/avatar', required('avatar'), auth.mustBeLoggedInAsUser, users.updateAvatar); // Update a user's avatar
  app.get('/users/:userid/email', NotImplemented); // Confirm a user's email.

  // TODO: Why is this a PUT and not a GET?
  app.put('/users/:userid/avatars', required('userData'), users.getSocialMediaAvatars); // Return possible avatars for a user.
  
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
   * Groups.
   */
  app.post('/groups', ifParam('flow', 'github'), aN.parseJwtNoExpiryCheck, aN.checkJwtExpiry, required('payload'), groups.createFromGithub); // Create a group from a github repo
  app.post('/groups', required('group'), groups.create); // Create a group, optionally include `users` with `role` to add them. No need to be authenticated.
  app.get('/groups/tags', groups.getGroupTags); // List all unique tags on all groups
  app.get('/groups/:groupid', groups.getOne);
  app.get('/groups/:groupid/users', cache(60), groups.getUsers); // Get group users
  app.get('/groups/:groupid/users.csv', cache(60), mw.format('csv'), groups.getUsers);
  app.put('/groups/:groupid', auth.canEditGroup, required('group'), groups.update); // Update a group.
  app.put('/groups/:groupid/settings', auth.canEditGroup, required('group'), groups.updateSettings); // Update group settings
  app.delete('/groups/:groupid', NotImplemented); // Delete a group.

  app.get('/groups/:groupid/services/meetup/sync', mw.fetchUsers, syncMeetup);

  /**
   * UserGroup.
   *
   *  Relations between a group and a user.
   */
  app.get('/users/:userid/groups', users.getGroups); // Get user's groups.
  app.post('/groups/:groupid/users/:userid', auth.canEditGroup, groups.addUser); // Add a user to a group.
  app.put('/groups/:groupid/users/:userid', auth.canEditGroup, groups.updateUser); // Update a user's role in a group.
  app.delete('/groups/:groupid/users/:userid', auth.canEditGroup, groups.deleteUser); // Remove a user from a group.

  /**
   * Transactions (financial).
   */
  app.get('/groups/:groupid/transactions', mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), groups.getTransactions); // Get a group's transactions.
  app.get('/transactions/:transactionuuid', transactions.getOne); // Get the transaction details

  // TODO remove once app is deprecated, replaced by POST /groups/:groupid/expenses and POST /groups/:groupid/donations/manual
  app.post('/groups/:groupid/transactions', required('transaction'), auth.canEditGroup, groups.createTransaction); // Create a transaction for a group.


  /**
   * Expenses
   */
   // TODO: Built a better frontend and remove hack 
   // mw.paginate({default: 50}) is a hack to unblock hosts from finding expenses that have more than 20 expenses
  app.get('/groups/:groupid/expenses', mw.paginate({default: 50}), mw.sorting({key: 'incurredAt', dir: 'DESC'}), expenses.list); // Get expenses.
  app.get('/groups/:groupid/expenses/:expenseid', expenses.getOne); // Get an expense.
  app.post('/groups/:groupid/expenses', required('expense'), mw.getOrCreateUser, expenses.create); // Create an expense as visitor or logged in user
  app.put('/groups/:groupid/expenses/:expenseid', auth.canEditExpense, required('expense'), expenses.update); // Update an expense.
  app.delete('/groups/:groupid/expenses/:expenseid', auth.canEditExpense, expenses.deleteExpense); // Delete an expense.
  app.post('/groups/:groupid/expenses/:expenseid/approve', auth.canEditGroup, required('approved'), expenses.setApprovalStatus); // Approve an expense.
  app.post('/groups/:groupid/expenses/:expenseid/pay', auth.mustHaveRole(roles.HOST), expenses.pay); // Pay an expense.

  /**
   * Comments
   */
  app.get('/groups/:groupid/comments', mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), comments.list); // Get latest comments for a collective
  app.get('/groups/:groupid/expenses/:expenseid/comments', mw.paginate(), mw.sorting({key: 'createdAt', dir: 'ASC'}), comments.list); // Get latest comments for an expense
  app.put('/groups/:groupid/expenses/:expenseid/comments/:commentid/approve', auth.canEditComment, comments.approve); // Approve comment
  app.post('/groups/:groupid/expenses/:expenseid/comments', required('comment'), mw.getOrCreateUser, comments.create); // Create a comment as a new user
  app.delete('/groups/:groupid/expenses/:expenseid/comments/:commentid', auth.canEditComment, comments.deleteComment); // Delete a comment

  /**
   * Donations
   */
  app.get('/groups/:groupid/donations', mw.paginate(), mw.sorting({key: 'processedAt', dir: 'DESC'}), donations.list); // Callback after a payment
  app.post('/groups/:groupid/donations/stripe', required('payment'), mw.getOrCreateUser, donations.stripe); // Make a stripe donation.
  app.post('/groups/:groupid/donations/manual', required('donation'), auth.mustHaveRole(roles.HOST), donations.manual); // Create a manual donation.
  // app.post('/groups/:groupid/donations/paypal', required('payment'), donations.paypal); // Make a paypal donation.
  // app.get('/groups/:groupid/transactions/:paranoidtransactionid/callback', donations.paypalCallback); // Callback after a payment

  /**
   * Activities.
   *
   *  An activity is any action linked to a User or a Group.
   */
  app.get('/groups/:groupid/activities', auth.mustBePartOfTheGroup, mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), activities.group); // Get a group's activities.
  app.get('/users/:userid/activities', mw.paginate(), mw.sorting({key: 'createdAt', dir: 'DESC'}), activities.user); // Get a user's activities.

  /**
   * Notifications.
   *
   *  A user can subscribe by email to any type of activity of a Group.
   */
  app.post('/groups/:groupid/activities/:activityType/subscribe', auth.mustBePartOfTheGroup, notifications.subscribe); // Subscribe to a group's activities
  app.post('/groups/:groupid/activities/:activityType/unsubscribe', notifications.unsubscribe); // Unsubscribe to a group's activities

  /**
   * Separate route for uploading images to S3
   * TODO: User should be logged in
   */
  app.post('/images', uploadImage);

  /**
   * Webhook for stripe when it gets a new subscription invoice
   */
  app.post('/webhooks/stripe', stripeWebhook);
  app.post('/webhooks/mailgun', email.webhook);

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
