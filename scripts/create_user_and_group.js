var axios = require('axios');
var roles = require('../app/constants/roles');

var URL = 'http://localhost:3060';

if (process.env.NODE_ENV !== 'development') {
  return console.error('Only run seed script in development');
}

var user = {
  email: 'devuser@opencollective.com',
  password: 'password'
};

// Create mock user
module.exports = function() {
  console.log('start seeding db');

  return axios.post(URL + '/users', {
    api_key: '0ac43519edcf4421d80342403fb5985d',
    user: user
  })
  .then(function(response) {
    console.log('user created');

    return axios.post(URL + '/authenticate', {
      api_key: '0ac43519edcf4421d80342403fb5985d',
      username: user.email,
      password: user.password
    });
  })
  .then(function(response) {
    console.log('authenticate successful');

    var accessToken = response.data.access_token;
    var data = {
      group: {
        name: 'OpenCollective Demo',
        description: 'OpenCollective Demo group',
      },
      stripeEmail: user.email,
      role: roles.HOST
    };

    return axios.post(URL + '/groups', data, {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
  })
  .then(function(response) {
    console.log('group created');
  })
  .catch(function(err) {
    console.log('err', err);
    process.exit();
  });
};
