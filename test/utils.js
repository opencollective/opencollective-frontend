import Promise from 'bluebird';
import {sequelize} from '../server/models';
import jsonData from './mocks/data';
import userlib from '../server/lib/userlib';
import config from 'config';

jsonData.application = { name: 'client', api_key: config.keys.opencollective.api_key };

export const data = (item) => {
  // we make a copy of the data to avoid modifying original
  const data = jsonData[item];
  if (data.length > 0) return data.slice();
  else return Object.assign({}, data);
}

export const clearbitStubBeforeEach = sandbox => {
  sandbox.stub(userlib.clearbit.Enrichment, 'find', () => {
    return Promise.reject(new userlib.clearbit.Enrichment.NotFoundError());
  });
};

export const clearbitStubAfterEach = (sandbox) => sandbox.restore();

export const resetTestDB = () => sequelize.sync({force: true})
  .catch(e => {
    console.error("test/utils.js> Sequelize Error: Couldn't recreate the schema", e);
    process.exit(1);
  });
