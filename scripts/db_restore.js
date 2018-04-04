import { ArgumentParser } from 'argparse';
import * as libdb from '../server/lib/db';

/** Help on how to use this script */
function usage() {
  console.error(`Usage: ${process.argv.join(' ')} <filename>.pgsql`);
  process.exit(1);
}

/** Return true if there's any data within the Collectives table */
async function hasData(client) {
  try {
    const exists = await client.query('SELECT 1 FROM "Collectives"');
    return Boolean(exists.rowCount);
  } catch (error) {
    return false;
  }
}

/** Launcher that recreates a database & load a dump into it. */
async function main(args) {
  if (!args.file) {
    return usage();
  }

  const [client, clientApp] = await libdb.recreateDatabase(args.force);

  if (await hasData(clientApp) && args.force) {
    await libdb.loadDB(args.file);
  }

  await Promise.all([client.end(), clientApp.end()]);
}

/** Return the options passed by the user to run the script */
function parseCommandLineArguments() {
  const parser = new ArgumentParser({
    addHelp: true,
    description: 'Restore dump file into a Database'
  });
  parser.addArgument(['-q', '--quiet'], {
    help: 'Silence output',
    defaultValue: true,
    action: 'storeConst',
    constant: false,
  });
  parser.addArgument(['-f', '--force'], {
    help: "Overwrite existing database",
    defaultValue: false,
    action: 'storeConst',
    constant: true,
  });
  parser.addArgument(['file'], {
    help: "Path for the dump file",
    action: 'store',
  });
  return parser.parseArgs();
}

if (!module.parent) main(parseCommandLineArguments());
