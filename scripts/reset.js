var exec = require('child-process-promise').exec;

var seed = require('./create_user_and_group');

if (process.env.NODE_ENV !== 'development') {
  return console.error('Only run reset script in development');
}

exec('make dropdb && make database')
.then(function(result) {
  console.log('output', result.stdout);

  return exec('SEQUELIZE_ENV=development npm run db:migrate')
})
.then(function(result) {
  console.log('output', result.stdout);

  return exec('SEQUELIZE_ENV=development npm run db:seed')
})
.then(function(result) {
  console.log('output', result.stdout);

  return seed()
  .catch(function(err) {
    console.error('Script error');
    console.log('error', err);
    console.log('stack', err.stack);
    process.exit();
  });
})
.then(function() {
  console.log('Please login on development with `devuser@opencollective.com` and `password`');
  console.log('Script successful');
  process.exit();
})
.fail(function(err) {
  console.error('Script error');
  console.log('error', err);
  console.log('stack', err.stack);
});
