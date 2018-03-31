/**
 * Script for setting up user & database.
 *
 * It's mostly used for setting up the development environment.
 *
 * The commands CREATE {USER,DATABASE} don't accept the regular
 * parameter binding. For that reason, the pg-format package is being
 * used to properly escape the name and password passed to the
 * command.
 *
 * More info here https://github.com/brianc/node-postgres/issues/1337
 */

import config from 'config';
import format from 'pg-format';
import pg from 'pg';
import { URL } from 'url';

/** Assemble an URL from database connection options.
 *
 * @param {string} section of the configuration file that will be read
 *  to assemble the URL. The configuration section MUST have the
 *  following fields: `database`, `username`, `password`
 *  `options.host` and optionally `options.port`.
 */
function getDBUrl(section) {
  if (!config[section]) throw new Error(`Configuration missing key "${section}"`);
  const { database, username, password } = config[section];
  const { host, port } = config[section]['options'];
  return `postgresql://${username}:${password}@${host}:${port || 5432}/${database}`;
}

/** Get an instance of a connected client */
async function getConnectedClient(url) {
  const client = new pg.Client(url);
  await client.connect();
  return client;
}

/** Create a user in postgres if it doesn't exist */
async function createUser(client, name, password) {
  const exists = await client.query(
    'SELECT 1 FROM pg_roles WHERE rolname=$1', [name]);
  if (!exists.rowCount) {
    await client.query(format(
      "CREATE USER %s WITH PASSWORD '%s';",
      name, password));
    console.log(`user ${name} created`);
  } else {
    console.log('user already exists');
  }
}

/** Create a database and set its owner */
async function createDatabase(client, database, owner) {
  const exists = await client.query(
    'SELECT 1 FROM pg_database WHERE datname=$1', [database]);
  if (!exists.rowCount) {
    await client.query(format(
      'CREATE DATABASE %s OWNER %s;', database, owner));
    console.log(`database ${database} created`);
  } else {
    console.log('database already exists');
  }
}

/** Create postgres extensions */
async function createExtensions(client) {
  await client.query('CREATE EXTENSION IF NOT EXISTS POSTGIS;');
}

function replaceDatabase(url, newDatabase) {
  const obj = new URL(url);
  obj.pathname = `/${newDatabase}`;
  return obj.toString();
}

/** Kick things off */
async function main() {
  const url = new URL(getDBUrl('database'));
  const database = url.pathname.slice(1);

  /* Connect with maintainance account */
  const client = await getConnectedClient(getDBUrl('maintenancedb'));
  await createUser(client, url.username, url.password);
  await createDatabase(client, database, url.username);
  await client.end();

  /* Connect with maintainance to the recently created database */
  const newUrl = replaceDatabase(getDBUrl('maintenancedb'), database);
  const clientOtherDb = await getConnectedClient(newUrl);
  await createExtensions(clientOtherDb);
  await clientOtherDb.end();
}

if (!module.parent) main();
