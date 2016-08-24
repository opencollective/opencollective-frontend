import config from 'config';
import request from 'request';
import Promise from 'bluebird';

export default {

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
