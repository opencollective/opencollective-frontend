import LRUCache from 'lru-cache';

import { hashCode } from '../lib/utils';
import { EventEmitter } from 'events';

const cache = LRUCache({
  max: 1000,
  maxAge: 1000 * 5 // in ms 
});

export default () => {
  /*
    use query and variables to identify a unique cache key
    Track active requests in process
    if incoming request matches an active request,
      wait for the active to finish and send the same response back to all 
      waiting requests that match cache key
  */

  // TODO: Need to write tests for this cache
  return (req, res, next) => {
    const temp = res.end;

    // only relevant for graphql queries, not mutations
    if (req.body && req.body.query && req.body.query.indexOf('mutation') === -1) {
      // important to include the user login token for checksum, so different users don't clash
      const token = req.headers && req.headers.authorization;
      const checksumString = `${req.body.query}${req.body.variables}${token}`;
      const checksum = hashCode(checksumString);
      req.checksum = checksum;

      let cached = cache.get(checksum);
      if (cached) {
        switch (cached.status) {
          case 'finished':
            return res.send(new Buffer(cached.response, "base64"));
          case 'running':
            return cached.once('finished', () => {
              return res.send(new Buffer(cached.response, "base64"));
            })
        }
      } else {
        cached = new EventEmitter();
        cached.status = 'running';
        cache.set(checksum, cached);
        req.cached = cached;
      }
    }

    res.end = function(data) {
      if (req.cached && req.checksum) {
        req.cached.status = 'finished';
        req.cached.response = data;
        req.cached.emit('finished');
        cache.set(req.checksum, req.cached)
      }
      temp.apply(this,arguments);
    }
    next();
  }
};