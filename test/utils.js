import Promise from 'bluebird';
import models, {sequelize} from '../server/models';
import jsonData from './mocks/data';
import userlib from '../server/lib/userlib';


export const data = (item) => Object.assign({}, jsonData[item]); // to avoid changing these data

export const clearbitStubBeforeEach = sandbox => {
  sandbox.stub(userlib.clearbit.Enrichment, 'find', () => {
    return Promise.reject(new userlib.clearbit.Enrichment.NotFoundError());
  });
};

export const clearbitStubAfterEach = (sandbox) => sandbox.restore();

export const cleanAllDb = () => sequelize.sync({force: true})
  .then(() => models.Application.create(data('applicationSuper')))
  .catch(e => {
    console.error("test/utils.js> Sequelize Error: Couldn't recreate the schema", e);
    process.exit(1);
  });
