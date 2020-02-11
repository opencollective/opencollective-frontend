import serverStatus from 'express-server-status';
import GraphHTTP from 'express-graphql';
import curlify from 'request-as-curl';
import multer from 'multer';
import debug from 'debug';
import config from 'config';

import redis from 'redis';
import expressLimiter from 'express-limiter';
import { ApolloServer } from 'apollo-server-express';
import { formatError } from 'apollo-errors';
import { get } from 'lodash';

import * as connectedAccounts from './controllers/connectedAccounts';
import getHomePage from './controllers/homepage';
import uploadImage from './controllers/images';
import { createPaymentMethod } from './controllers/paymentMethods';
import * as users from './controllers/users';
import stripeWebhook from './controllers/webhooks';
import * as email from './controllers/services/email';

import required from './middleware/required_param';
import * as aN from './middleware/security/authentication';
import * as auth from './middleware/security/auth';
import errorHandler from './middleware/error_handler';
import * as params from './middleware/params';
import sanitizer from './middleware/sanitizer';

import * as paypal from './paymentProviders/paypal/payment';

import logger from './lib/logger';
import { sanitizeForLogs } from './lib/utils';

import graphqlSchemaV1 from './graphql/v1/schema';
import graphqlSchemaV2 from './graphql/v2/schema';

import helloworks from './controllers/helloworks';

const upload = multer();

export default app => {
  /**
   * Status.
   */
  app.use('/status', serverStatus(app));

  /**
   * Extract GraphQL API Key
   */
  app.use('/graphql/:version/:apiKey?', (req, res, next) => {
    req.apiKey = req.params.apiKey;
    next();
  });

  app.use('*', auth.checkClientApp);

  app.use('*', auth.authorizeClientApp);

  // Setup rate limiter
  if (get(config, 'redis.serverUrl')) {
    const client = redis.createClient(get(config, 'redis.serverUrl'));
    const rateLimiter = expressLimiter(
      app,
      client,
    )({
      lookup: function(req, res, opts, next) {
        if (req.clientApp) {
          opts.lookup = 'clientApp.id';
          // 100 requests / minute for registered API Key
          opts.total = 100;
          opts.expire = 1000 * 60;
        } else {
          opts.lookup = 'ip';
          // 10 requests / minute / ip for anonymous requests
          opts.total = 10;
          opts.expire = 1000 * 60;
        }
        return next();
      },
      whitelist: function(req) {
        const apiKey = req.query.api_key || req.body.api_key;
        // No limit with internal API Key
        return apiKey === config.keys.opencollective.apiKey;
      },
      onRateLimited: function(req, res) {
        let message;
        if (req.clientApp) {
          message = 'Rate limit exceeded. Contact-us to get higher limits.';
        } else {
          message = 'Rate limit exceeded. Create an API Key to get higher limits.';
        }
        res.status(429).send({ error: { message } });
      },
    });
    app.use('/graphql', rateLimiter);
  }
  if (process.env.DEBUG) {
    const debugOperation = debug('operation');
    const debugParams = debug('params');
    const debugHeaders = debug('headers');
    const debugCurl = debug('curl');

    app.use('*', (req, res, next) => {
      const body = sanitizeForLogs(req.body || {});
      debugOperation(body.operationName, JSON.stringify(body.variables, null));
      if (body.query) {
        const query = body.query;
        debugParams(query);
        delete body.query;
      }
      debugParams('req.query', req.query);
      debugParams('req.body', JSON.stringify(body, null, '  '));
      debugParams('req.params', req.params);
      debugHeaders('req.headers', req.headers);
      debugCurl('curl', curlify(req, req.body));
      next();
    });
  }

  /**
   * User reset password or new token flow (no jwt verification)
   */
  app.post('/users/signin', required('user'), users.signin);
  app.post('/users/update-token', auth.mustBeLoggedIn, users.updateToken);

  /**
   * Moving forward, all requests will try to authenticate the user if there is a JWT token provided
   * (an error will be returned if the JWT token is invalid, if not present it will simply continue)
   */
  app.use('*', aN.authenticateUser); // populate req.remoteUser if JWT token provided in the request

  /**
   * Parameters.
   */
  app.param('uuid', params.uuid);
  app.param('userid', params.userid);
  app.param('collectiveid', params.collectiveid);
  app.param('transactionuuid', params.transactionuuid);
  app.param('paranoidtransactionid', params.paranoidtransactionid);
  app.param('expenseid', params.expenseid);

  const isDevelopment = config.env === 'development';

  /**
   * GraphQL v1
   */
  const graphqlServerV1 = GraphHTTP({
    customFormatErrorFn: error => {
      logger.error(`GraphQL v1 error: ${error.message}`);
      logger.debug(error);
      return formatError(error);
    },
    schema: graphqlSchemaV1,
    pretty: isDevelopment,
    graphiql: isDevelopment,
  });

  app.use('/graphql/v1', graphqlServerV1);

  /**
   * GraphQL v2
   */
  const graphqlServerV2 = new ApolloServer({
    schema: graphqlSchemaV2,
    introspection: true,
    playground: isDevelopment,
    // Align with behavior from express-graphql
    context: ({ req }) => {
      return req;
    },
  });

  graphqlServerV2.applyMiddleware({ app, path: '/graphql/v2' });

  /**
   * GraphQL default (v1)
   */
  app.use('/graphql', graphqlServerV1);

  /**
   * Webhooks that should bypass api key check
   */
  app.post('/webhooks/stripe', stripeWebhook); // when it gets a new subscription invoice
  app.post('/webhooks/mailgun', email.webhook); // when receiving an email
  app.get('/connected-accounts/:service/callback', aN.authenticateServiceCallback); // oauth callback
  app.delete('/connected-accounts/:service/disconnect/:collectiveId', aN.authenticateServiceDisconnect);

  app.use(sanitizer()); // note: this break /webhooks/mailgun /graphiql

  /**
   * Homepage
   */
  app.get('/homepage', getHomePage); // This query takes 5s to execute!!!

  /**
   * Users.
   */
  app.get('/users/exists', required('email'), users.exists); // Checks the existence of a user based on email.

  /**
   * Create a payment method.
   *
   *  Let's assume for now a paymentMethod is linked to a user.
   */
  app.post('/v1/payment-methods', createPaymentMethod);

  /**
   * Separate route for uploading images to S3
   */
  app.post('/images', upload.single('file'), uploadImage);

  /**
   * Generic OAuth (ConnectedAccounts)
   */
  app.get('/connected-accounts/:service(github)', aN.authenticateService); // backward compatibility
  app.get('/connected-accounts/:service(github|twitter|meetup|stripe|paypal)/oauthUrl', aN.authenticateService);
  app.get('/connected-accounts/:service/verify', aN.parseJwtNoExpiryCheck, connectedAccounts.verify);

  /* PayPal Payment Method Helpers */
  app.post('/services/paypal/create-payment', paypal.createPayment);

  /**
   * External services
   */
  app.get('/services/email/approve', email.approve);
  app.get('/services/email/unsubscribe/:email/:slug/:type/:token', email.unsubscribe);

  /**
   * Github API - fetch all repositories using the user's access_token
   */
  app.get('/github-repositories', connectedAccounts.fetchAllRepositories);
  app.get('/github/repo', connectedAccounts.getRepo);
  app.get('/github/orgMemberships', connectedAccounts.getOrgMemberships);

  /**
   * Hello Works API - Helloworks hits this endpoint when a document has been completed.
   */
  app.post('/helloworks/callback', helloworks.callback);

  /**
   * Override default 404 handler to make sure to obfuscate api_key visible in URL
   */
  app.use((req, res) => res.sendStatus(404));

  /**
   * Error handler.
   */
  app.use(errorHandler);
};
