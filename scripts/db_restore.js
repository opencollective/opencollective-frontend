import * as libdb from '../server/lib/db';

/** Launcher that recreates a database & load a dump into it. */
async function main() {
  if (process.argv.length !== 3) {
    console.error(`Usage: ${process.argv.join(' ')} <filename>.pgsql`);
    process.exit(1);
  }

  const [client, clientApp] = await libdb.recreateDatabase();
  await Promise.all([client.end(), clientApp.end()]);

  const fileName = process.argv[2];
  await libdb.loadDB(fileName);
}

if (!module.parent) main();
