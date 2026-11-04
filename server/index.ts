import '../env.ts';

import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import isEmpty from 'lodash-es/isEmpty.js';
import next from 'next';
import { EventEmitter } from 'node:events';
import http from 'node:http';
import throng from 'throng';

import cloudflareIps from './cloudflare-ips.json' with { type: 'json' };
import duplicateHandler from './duplicate-handler.ts';
import hyperwatch from './hyperwatch.ts';
import logger from './logger.ts';
import loggerMiddleware from './logger-middleware.ts';
import rateLimiter from './rate-limiter.ts';
import routes from './routes.ts';
import { increaseServiceLevel, serviceLimiterMiddleware } from './service-limiter.ts';
import { parseToBooleanDefaultFalse } from './utils.ts';

const app = express();
const server = http.createServer(app);

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'].concat(cloudflareIps));

const dev = process.env.NODE_ENV === 'development';
const port = process.env.PORT;
const hostname = process.env.HOSTNAME;
// Next.js 16 defaults to Turbopack; keep webpack for our custom next.config.js plugins.
// Next.js gets its own channel for WebSocket upgrades (e.g. hot reload), so it
// never closes the Hyperwatch stream (workaround for Next.js 16.3)
// Next only needs an event emitter here; its type expects the http.Server instance.
const nextUpgrades = new EventEmitter() as Parameters<typeof next>[0]['httpServer'];
const forwardUpgradeToNext = (req, socket, head) => nextUpgrades.emit('upgrade', req, socket, head);
const nextApp = next({ dev, hostname, port: port ? Number(port) : undefined, webpack: true, httpServer: nextUpgrades });
const nextRequestHandler = nextApp.getRequestHandler();
// TODO(finding): Next 16's `getRequestHandler()` takes no arguments and returns the handler,
// so this call never responds to the request. Preserved behaviour-identically (see PLAN.md).
const nextHmrRequestHandler: (req, res) => void = nextApp.getRequestHandler.bind(nextApp);

const workers = Number(process.env.WEB_CONCURRENCY) || 1;

const desiredServiceLevel = Number(process.env.SERVICE_LEVEL) || 100;

const start = id =>
  nextApp.prepare().then(async () => {
    logger.info(
      `Starting with NODE_ENV=${process.env.NODE_ENV} OC_ENV=${process.env.OC_ENV} API_URL=${process.env.API_URL}`,
    );

    app.all('/_next/webpack-hmr', (req, res) => {
      nextHmrRequestHandler(req, res);
    });

    // Not much documentation on this,
    // but we should ensure this goes to the default Next.js handler
    app.get('/__nextjs_original-stack-frame', nextApp.getRequestHandler());

    const hyperwatchMounted = await hyperwatch(app, { server, fallback: forwardUpgradeToNext });
    if (!hyperwatchMounted) {
      server.on('upgrade', forwardUpgradeToNext);
    }

    await rateLimiter(app);

    if (parseToBooleanDefaultFalse(process.env.SERVICE_LIMITER)) {
      app.use(serviceLimiterMiddleware);
    }

    app.use(
      helmet({
        // Content security policy is generated from `_document` for compatibility with Vercel
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false, // This one turned off for loading Stripe js (at least)
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
      }),
    );

    app.use(cookieParser());

    if (parseToBooleanDefaultFalse(process.env.DUPLICATE_HANDLER)) {
      app.use(
        duplicateHandler({
          skip: req =>
            !isEmpty(req.cookies) ||
            req.headers.authorization ||
            req.headers.cookie ||
            req.url.match(/^\/_/) ||
            req.url.match(/^\/static/) ||
            req.url.match(/^\/dashboard/) ||
            req.url.match(/^\/api/) ||
            req.url.match(/^\/favicon\.ico/),
        }),
      );
    }

    routes(app);

    app.all('/{*splat}', (req, res) => {
      return nextRequestHandler(req, res);
    });

    app.use(loggerMiddleware.errorLogger);

    server.listen(port, () => {
      logger.info(`Ready on http://localhost:${port}, Worker #${id}`);

      // Wait 30 seconds before reaching service level 50 or desiredServiceLevel
      setTimeout(() => {
        increaseServiceLevel(Math.min(50, desiredServiceLevel));
      }, 30000);

      // Wait 3 minutes before reaching desiredServiceLevel
      setTimeout(() => {
        increaseServiceLevel(desiredServiceLevel);
      }, 180000);
    });
  });

if (workers > 1) {
  throng({ worker: start, count: workers });
} else {
  start(1);
}
