import algoliasearch from 'algoliasearch';
import { request } from 'graphql-request'
import { Promise } from 'bluebird';

// TODO: put these keys in env
const ALGOLIA_APP_ID = 'LJZOBZL3H3';
const ALGOLIA_KEY = 'fdb906cadef997b985f04852ecea4f9b';
const ALGOLIA_INDEX = 'allCollectives';
const GRAPHQL_URL = 'https://opencollective-prod-api.herokuapp.com/graphql?api_key=30DV4OgF6jXO8WeaWy503AZnO1GF3gHv';

function fetchAllCollectives() {
	const query = `{
		allCollectives(limit: 50000, type: "COLLECTIVE", orderBy: "name") {
			id,
			name,
			description,
			image,
			isActive,
			slug,
		}
	}`;
	return request(GRAPHQL_URL, query).then((res) => {
		const { allCollectives = [] } = res;
		return allCollectives.map(el => Object.assign(el, { objectID: el.id }));
	});
}

function indexAllCollectives(data) {
	const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_KEY, { protocol: 'https:' });
	const index = client.initIndex(ALGOLIA_INDEX);
	return index.addObjects(data);
}

export default {
	start: () => {
		console.log('Starting cron...');
		fetchAllCollectives()
			.then(indexAllCollectives)
			.catch(err => console.error(err));
	}
}
