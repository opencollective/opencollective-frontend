import debug from 'debug';
import dotenv from 'dotenv';
import { has, get } from 'lodash';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

dotenv.config();
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

// Compute PG_URL based on PG_URL_ENVIRONMENT_VARIABLE, look in DATABASE_URL by default
const pgUrlEnvironmentVariable = get(process.env, 'PG_URL_ENVIRONMENT_VARIABLE', 'DATABASE_URL');
if (has(process.env, pgUrlEnvironmentVariable) && !has(process.env, 'PG_URL')) {
  process.env.PG_URL = get(process.env, pgUrlEnvironmentVariable);
}
