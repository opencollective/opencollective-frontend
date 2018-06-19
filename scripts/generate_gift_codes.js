import { createGiftcards } from '../server/paymentProviders/opencollective/giftcard';
import { sequelize } from '../server/models';

const BATCHES = [
  // SF party
  {count: 350, expiryDate: new Date('2017-12-09 08:00:00')}, // date in UTC
  // NYC party
  {count: 150, expiryDate: new Date('2017-12-15 08:00:00')}  // date in UTC
];

const OPTS = {
  name: 'Bloomberg Beta Gift Card',
  CreatedByUserId: 30,
  CollectiveId: 9805,
  monthlyLimitPerMember: 5000,
  currency: 'USD',  
};

async function run() {
  const cards = await createGiftcards(BATCHES, OPTS);
  console.log("Done! Number of cards added: ", cards.length);
  sequelize.close();
}

if (!process.parent) run();
