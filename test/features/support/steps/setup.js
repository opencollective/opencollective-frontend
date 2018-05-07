import { AfterAll, Before } from 'cucumber';
import { resetTestDB } from '../../../utils';
import { sequelize } from '../../../../server/models';
import { sleep } from '../../../../server/lib/utils';

/* This will happen before each scenario */
Before(async () => {
  await sleep(100);
  await resetTestDB();
});

/* Close sequelize after all tests are over */
AfterAll(async () => {
  await sleep(100);
  await sequelize.close();
});
