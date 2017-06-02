import Promise from 'bluebird';
import {sequelize} from '../server/models';
import jsonData from './mocks/data';
import userlib from '../server/lib/userlib';
import config from 'config';
import { isArray, values } from 'lodash';
import path from 'path';
import { exec } from 'child_process';

jsonData.application = { name: 'client', api_key: config.keys.opencollective.api_key };

export const data = (item) => {
  const copy = Object.assign({}, jsonData[item]); // to avoid changing these data
  return (isArray(jsonData[item])) ? values(copy) : copy;
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

export function loadDB(dbname) {
  return new Promise((resolve, reject) => {
    exec(`${path.join(__dirname, '../scripts/db_restore.sh')} opencollective_test ${path.join(__dirname,"dbdumps", `${dbname}.pgsql`)}`, (err, stdout, stderr) => {
      if (err) return reject(err);
      console.log("stdout", stdout);
      return resolve(stdout);
    })
  });
}