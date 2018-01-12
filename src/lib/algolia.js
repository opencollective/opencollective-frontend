import algoliasearch from 'algoliasearch';

// TODO: put these keys in env
const ALGOLIA_APP_ID = 'LJZOBZL3H3';
const ALGOLIA_KEY = '3bc7285b51e6caaf67928ba3955951e3';
const ALGOLIA_INDEX = 'allCollectives';

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_KEY);
const index = client.initIndex(ALGOLIA_INDEX);

export function search(query) {
  return new Promise((resolve, reject) => {
    index.search(query, (err, res) => {
      if (err) return reject(err);
      resolve(res.hits || []);
    });
  });
}
