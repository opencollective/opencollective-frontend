import Promise from 'bluebird';
import {sequelize} from '../server/models';
import jsonData from './mocks/data';
import userlib from '../server/lib/userlib';
import config from 'config';
import { isArray, values } from 'lodash';
import path from 'path';
import { exec } from 'child_process';
import debugLib from 'debug';

const debug = debugLib('utils');

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

  const importDB = (cb) => {
    exec(`${path.join(__dirname, '../scripts/db_restore.sh')} -d ${config.database.database} -U ${config.database.username} -f ${path.join(__dirname,"dbdumps", `${dbname}.pgsql`)}`, cb);
  };

  return new Promise((resolve, reject) => {
    importDB((err, stdout) => {
      if (!err) {
        debug(`${dbname} imported successfully`, stdout);
        return resolve(stdout);
      }
      if (err) { // First try may fail due to foreign keys restrictions
        debug(`error importing ${dbname}`, err);
        importDB((err, stdout) => {
          if (err) {
            debug(`2nd attempt: error importing ${dbname}`, err);
            return reject(err);
          } else {
            return resolve(stdout);
          }
        });
      }
    })
  });
}