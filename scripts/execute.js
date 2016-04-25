const slack = require('../server/lib/slack');

/**
 * Executes a script by name
 * `npm run script populate_recurring_paypal_transactions`
 *
 * Used to test the script separately
 */

const name = process.argv[2];

if (!moduleExists(name)) {
  console.log(`Script ${name} not found`);
  return;
}

const script = require(`./${name}`);

console.log(`Running ${name}`);

script.run()
  .then(() => {
    console.log(`Script ${name} done`);
    process.exit();
  })
  .catch((err) => {
    if (process.env.NODE_ENV === 'production') {
      slack.postMessage(err.message, { channel: '#critical' });
    }

    console.log(err);
    process.exit();
  });

function moduleExists(name) {
  try { return require.resolve(`./${name}`); }
  catch( e ) { return false }
}
