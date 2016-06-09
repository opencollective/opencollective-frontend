const config = require('config');
const request = require('request');
const Promise = require('bluebird');

module.exports = {

  fetchUser(username) {
    const options = {
      url: `https://api.github.com/users/${username}?client_id=${config.github.clientID}&client_secret=${config.github.clientSecret}`,
      headers: {
        'User-Agent': 'OpenCollective'
      },
      json: true
    };
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error)
        } else {
          resolve(body);
        }
      });
    });
  },

};
