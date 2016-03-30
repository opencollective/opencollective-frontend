const exec = require('child-process-promise').exec;

const app = require('../index');
const models = app.set('models');
const roles = require('../app/constants/roles');

var data = {};

if (process.env.NODE_ENV !== 'development') {
  return console.error('Only run reset script in development');
}

exec('make dropdb && make database')
.then((result) => {
  console.log('output', result.stdout);

  return exec('SEQUELIZE_ENV=development npm run db:migrate')
})
.then((result) => {
  console.log('output', result.stdout);

  return models.Application.create({
    api_key: '0ac43519edcf4421d80342403fb5985d',
    name: 'webapp',
    _access: 1
  })
  .then(() => {
    return models.User.create({
      email: 'user@opencollective.com',
      password: 'password'
    })
    .then((user) => data.user = user);
  })
  .then(() => {
    return models.Group.create({
      name: 'OpenCollective Demo',
      description: 'OpenCollective Demo group',
      isPublic: true,
      slug: 'opencollective'
    })
    .then((group) => group.addUserWithRole(data.user, roles.HOST))
  })
  .then(() => {
    return models.ConnectedAccount.create({
      provider: 'paypal',
      // Sandbox api keys
      clientId: 'AZaQpRstiyI1ymEOGUXXuLUzjwm3jJzt0qrI__txWlVM29f0pTIVFk5wM9hLY98w5pKCE7Rik9QYvdYA',
      secret: 'EILQQAMVCuCTyNDDOWTGtS7xBQmfzdMcgSVZJrCaPzRbpGjQFdd8sylTGE-8dutpcV0gJkGnfDE0PmD8'
    })
    .then((connectedAccount) => connectedAccount.setUser(data.user));
  })
  .then(() => {
    return models.User.create({
      email: 'stripeuser@opencollective.com',
      password: 'password'
    })
    .then((user) => data.user = user);
  })
  .then(() => {
    return models.Group.create({
      name: 'OpenCollective Demo with stripe',
      description: 'OpenCollective Demo group with stripe',
      isPublic: true,
      slug: 'oc-stripe'
    })
    .then((group) => group.addUserWithRole(data.user, roles.HOST))
  });
})
.then(function() {
  console.log('Please login on development with `user@opencollective.com` and `password` or ');
  console.log('Please login on development with `stripeuser@opencollective.com` and `password`');
  console.log('Script successful');
  process.exit();
})
.fail(function(err) {
  console.error('Script error');
  console.log('error', err);
  console.log('stack', err.stack);
});
