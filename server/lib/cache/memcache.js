import memjs from 'memjs';
import debug from 'debug';

const debugCache = debug('cache');

const makeMemcacheProvider = ({ servers, username, password }) => {
  const client = memjs.Client.create(servers, { username, password });
  return {
    clear: async () => client.flush(),
    del: async key => client.delete(key),
    get: async (key, { unserialize = JSON.parse } = {}) => {
      const data = await client.get(key);
      if (data.value) {
        const value = data.value.toString();
        try {
          return unserialize(value);
        } catch (err) {
          debugCache(`Invalid JSON (${value}): ${err}`);
        }
      }
    },
    has: async key => {
      const value = await client.get(key);
      return value !== undefined;
    },
    set: async (key, value, expirationInSeconds, { serialize = JSON.stringify } = {}) => {
      if (value !== undefined) {
        return client.set(key, serialize(value), { expires: expirationInSeconds });
      }
    },
  };
};

export default makeMemcacheProvider;
