/** db.js -- Provide utilities to manage postgres databases
 *
 * This library provides features that are out of the scope of our
 * ORM. There are functions for creating databases, loading databases
 * and things that have to be done before the database exists.
 */
import config from 'config';
import path from 'path';
import pg from 'pg';
import pgConnectionString from 'pg-connection-string';
import format from 'pg-format';
import { promisify } from 'util';
import { exec } from 'child_process';
import { has, get } from 'lodash';

/** Load a dump file into the current database.
 *
 * This operation is very useful for at least two situations: 1) setup
 * scripts to provide a development environment with some data already
 * loaded. 2) tests if the database needs to be reset into a certain
 * state saved in a file.
 *
 * @param {string} name of the file under the `/dumps` directory.
 */
export async function loadDB(name) {
  const fullPath = path.join(__dirname, '..', '..', 'test', 'dbdumps', `${name}.pgsql`);
  const { database, username, password, host, port } = getDBConf('database');
  const cmd = format(
    '/usr/bin/pg_restore --no-acl --no-owner --clean --schema=public --if-exists --role=%I --host=%I --port=%s --username=%I -w --dbname=%I %s',
    username,
    host,
    port,
    username,
    database,
    fullPath,
  );
  const pexec = promisify(exec);
  await pexec(cmd, { env: { PGPASSWORD: password } });
}

/** Retrieve configuration paratemters of a given database.
 *
 * @param {string} name of the key in the configuration that contains
 *  the database parameters. An error is thrown if there's no section
 *  with such name.
 * @return an object with the keys `database`, `username`, `password`,
 *  `host`, and `port`. The key `port` is the only optional one and
 *  defaults to 5432.
 */
export function getDBConf(name) {
  if (!has(config, [name, 'url'])) {
    throw new Error(`Configuration missing key "${name}.url"`);
  }
  let dbConfig = parseDBUrl(get(config, [name, 'url']));
  if (name === 'database') {
    const dbConfigOverride = get(config, [name, 'override'], {});
    dbConfig = { ...dbConfig, ...dbConfigOverride };
  }
  return dbConfig;
}

/** Get a config object from an URL
 *
 * @param {string} url of a database
 */
export function parseDBUrl(url) {
  const { database, user, password, host, port, dialect } = pgConnectionString.parse(url);
  return { database, username: user, password, host, port: port || 5432, dialect: dialect || 'postgres' };
}

/** Assemble an URL from database connection options.
 *
 * @param {string} section of the configuration file that will be read
 *  to assemble the URL. The configuration section MUST have the
 *  following fields: `database`, `username`, `password`
 *  `options.host` and optionally `options.port`.
 */
export function getDBUrl(section) {
  const { database, username, password, host, port } = getDBConf(section);
  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
}

/** Get an instance of a connected client.
 *
 * @param {string} url of the database to connect to.
 */
export async function getConnectedClient(url) {
  const client = new pg.Client(url);
  await client.connect();
  return client;
}

/** Create a database and set its owner.
 *
 * @param {pg.Client} client of the postgres connection.
 * @param {string} database name to be created.
 * @param {string} owner of the database.
 */
export async function createDatabaseQuery(client, database, owner) {
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [database]);
  if (!exists.rowCount) {
    await client.query(format('CREATE DATABASE %s OWNER %s;', database, owner));
    console.log(`database ${database} created`);
  } else {
    console.log('database already exists');
  }
}

/** Create a database and set its owner.
 *
 * @param {pg.Client} client of the postgres connection.
 * @param {string} database name to be destroyed.
 */
export async function dropDatabaseQuery(client, database) {
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [database]);
  if (exists.rowCount) {
    await client.query(
      `UPDATE pg_database SET datallowconn = 'false'
       WHERE datname = '${database}';
       ALTER DATABASE ${database} CONNECTION LIMIT 1;`,
    );
    await client.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
       WHERE datname = '${database}';`,
    );
    await client.query(format('DROP DATABASE %s;', database));
    console.log(`database ${database} dropped`);
  } else {
    console.log('database did not exist');
  }
}

/** Create postgres extension POSTGIS. */
export async function createExtensionsQuery(client) {
  await client.query('CREATE EXTENSION IF NOT EXISTS POSTGIS;');
}

/** Optionally Destroy & Create the application database.
 *
 * This function opens two connections to postgres. One executes
 * functions that need the client to be connected to a maintenance
 * database ({drop,create} database) and another other executes
 * operations in the application database (create extension).
 *
 * @param {boolean} destroy defines if the database should be
 *  destroyed.
 * @return {Array<pg.Client>} both clients connected that must be
 *  closed. The 0th item is the connection to the maintenance database
 *  and the 1st item is the connection to the application database.
 */
export async function recreateDatabase(destroy = true) {
  /* Parameters from the application database */
  const { database, username } = getDBConf('database');

  /* Operations that require connecting to a maintenance database. */
  const client = await getConnectedClient(getDBUrl('maintenancedb'));
  if (destroy) {
    await dropDatabaseQuery(client, database);
  }
  await createDatabaseQuery(client, database, username);

  /* Operations that require connecting to the application
   * database. */
  const clientApp = await getConnectedClient(getDBUrl('database'));
  await createExtensionsQuery(clientApp);
  return [client, clientApp];
}
