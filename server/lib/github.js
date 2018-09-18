import config from 'config';
import request from 'request-promise';

export default function fetchUser(username) {
  return request({
    uri: `https://api.github.com/users/${username}`,
    qs: {
      client_id: config.github.clientID,
      client_secret: config.github.clientSecret,
    },
    headers: { 'User-Agent': 'OpenCollective' },
    json: true,
  });
}
