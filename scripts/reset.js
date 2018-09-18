import '../server/lib/load-dot-env'; // important to load first for environment config
import models from '../server/models';

const exec = require('child-process-promise').exec;
const roles = require('../server/constants/roles');

const data = {};

if (process.env.NODE_ENV !== 'development') {
  console.error('Only run reset script in development');
  process.exit(0);
}

exec('make dropdb && make database')
  .tap(result => console.log('Output', result.stdout))
  .then(() => exec('SEQUELIZE_ENV=development npm run db:migrate'))
  .tap(result => console.log('Output', result.stdout))
  .then(() =>
    models.User.create({
      email: 'user@opencollective.com',
      password: 'password',
    }),
  )
  .tap(user => (data.user = user))
  .then(() =>
    models.Collective.create({
      name: 'OpenCollective Demo',
      description: 'OpenCollective Demo collective',
      isActive: true,
      slug: 'opencollective',
      mission: 'demo open collective',
    }),
  )
  .then(collective => collective.addUserWithRole(data.user, roles.HOST))
  .then(() =>
    models.ConnectedAccount.create({
      provider: 'paypal',
      // Sandbox api keys
      clientId:
        'AZaQpRstiyI1ymEOGUXXuLUzjwm3jJzt0qrI__txWlVM29f0pTIVFk5wM9hLY98w5pKCE7Rik9QYvdYA',
      secret:
        'EILQQAMVCuCTyNDDOWTGtS7xBQmfzdMcgSVZJrCaPzRbpGjQFdd8sylTGE-8dutpcV0gJkGnfDE0PmD8',
    }),
  )
  .then(connectedAccount => connectedAccount.setUser(data.user))
  .then(() =>
    models.User.create({
      email: 'stripeuser@opencollective.com',
      password: 'password',
    }),
  )
  .then(user => (data.user = user))
  .then(() =>
    models.Collective.create({
      name: 'OpenCollective Demo with stripe',
      description: 'OpenCollective Demo collective with stripe',
      isActive: true,
      slug: 'oc-stripe',
      mission: 'oc with stripe',
    }),
  )
  .then(collective => collective.addUserWithRole(data.user, roles.HOST))
  .then(() => {
    console.log(
      'Please login on development with `user@opencollective.com` and `password` or ',
    );
    console.log(
      'Please login on development with `stripeuser@opencollective.com` and `password`',
    );
    console.log('Script successful');
    process.exit();
  })
  .fail(err => {
    console.error('Script error');
    console.log('error', err);
    console.log('stack', err.stack);
  });
