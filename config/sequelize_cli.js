import '../server/env';

import config from 'config';

export default {
  development: {
    database: 'opencollective_dvl',
    username: 'opencollective',
    password: '',
    host: '127.0.0.1',
    dialect: 'postgres',
    ...config.database.override,
  },
  circleci: {
    database: 'circle_test',
    username: 'ubuntu',
    password: '',
    host: 'localhost',
    protocol: 'postgres',
    dialect: 'postgres',
    ...config.database.override,
  },
  docker: {
    database: 'opencollective_dvl',
    username: 'opencollective',
    password: '',
    host: 'postgres',
    protocol: 'postgres',
    dialect: 'postgres',
    ...config.database.override,
  },
  staging: {
    use_env_variable: 'PG_URL',
  },
  production: {
    use_env_variable: 'PG_URL',
  },
};
