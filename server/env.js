import debug from 'debug';
import dotenv from 'dotenv';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (['production', 'circleci'].indexOf(process.env.NODE_ENV) === -1) {
  dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
}

debug.enable(process.env.DEBUG);

// Normalize Memcachier environment variables (production / heroku)
if (process.env.MEMCACHIER_SERVERS) {
  process.env.MEMCACHE_SERVERS = process.env.MEMCACHIER_SERVERS;
}
if (process.env.MEMCACHIER_USERNAME) {
  process.env.MEMCACHE_USERNAME = process.env.MEMCACHIER_USERNAME;
}
if (process.env.MEMCACHIER_PASSWORD) {
  process.env.MEMCACHE_PASSWORD = process.env.MEMCACHIER_PASSWORD;
}

// Only load newrelic when we explicitly want it
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}
