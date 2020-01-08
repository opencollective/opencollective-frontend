#!/usr/bin/env node
import '../server/env';

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

import format from 'pg-format';

import * as libdb from '../server/lib/db';
import { sequelize } from '../server/models';

/** Create a user in postgres if it doesn't exist.
 *
 * If the user already exists, creating is not attempted.
 *
 * @param {pg.Client} client of the postgres driver.
 * @param {string} name of the user to be created.
 * @param {string} password of the user.
 */
async function createUser(client, name, password) {
  const exists = await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [name]);
  if (!exists.rowCount) {
    await client.query(format("CREATE USER %s WITH PASSWORD '%s' SUPERUSER;", name, password));
    console.log(`user ${name} created`);
  } else {
    console.log('user already exists');
  }
}

/** Kick things off */
async function main() {
  /* Connect with maintainance account */
  const client = await libdb.getConnectedClient(libdb.getDBUrl('maintenancedb'));
  const { username, password } = libdb.getDBConf('database');
  await createUser(client, username, password);
  const destroy = process.env.DB_DESTROY ? true : false;
  const [clientMaint, clientApp] = await libdb.recreateDatabase(destroy);
  await sequelize.sync({ force: true });
  await sequelize.close();
  console.log('schema created or reseted');
  await Promise.all([client.end(), clientMaint.end(), clientApp.end()]);
}

if (!module.parent) {
  main();
}
