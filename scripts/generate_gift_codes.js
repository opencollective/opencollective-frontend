/*
 * This script generates gift codes
 */

import models from '../server/models';
import Promise from 'bluebird';

const VERIFICATION_MODULO = 45790; // don't change

const NAME = 'Bloomberg Beta Gift Card';
const SERVICE = 'prepaid';
const CREATED_BY_USER_ID = 30; // user id of the creator or the admin of the collective funding gift cards
const COLLECTIVE_ID = 9805; // issuer's collective ID
const MONTHLY_LIMIT_PER_MEMBER = 5000 // in cents
const CURRENCY = 'USD';
const CODE_PREFIX = 'BB' // prepends all codes with prefix, ex: BBFTC9805

const BATCHES_TO_GENERATE = [
  // SF party
  {count: 350, expiryDate: new Date('2017-12-09 08:00:00')}, // date in UTC
  // NYC party
  {count: 150, expiryDate: new Date('2017-12-15 08:00:00')}  // date in UTC
]

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

const randomString = (length, chars) => {
    var result = '';
    for (var i = length; i > 0; --i) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

const getVerificationNumber = (str) => {
  return (Array.prototype.map.call(str, c => c.charCodeAt(0)).reduce((a,b) => a*b) % VERIFICATION_MODULO).toString().substr(-1);
}

const generateNewCode = (prefix) => {

  // generate three letters (ignoring confusing ones)
  const letters = randomString(3, 'ACEFHJKLMNPRSTUVWXY');

  // generate three digit number 
  const numbers = Math.floor(Math.random() * 900 + 100); // three random numbers between 100 and 1000;

  // generate verification number
  const code = `${prefix}${letters}${numbers}`;
  const verification = getVerificationNumber(code);

  if (letters.length !== 3 || numbers.toString().length != 3 || verification.toString().length !== 1) {
    throw new Error('Incorrect length found', letters, numbers, verification);
  }
  return `${code}${verification}`;
}

const generatePrepaidCards = (batches) => {
  const cardList = [];

  return new Promise((resolve) => {
    batches.forEach(batch => {
      for (var i = 0; i < batch.count; i++) {
        const newCode = generateNewCode(CODE_PREFIX);
        cardList.push({
          token: newCode,
          expiryDate: batch.expiryDate,
          name: NAME,
          service: SERVICE,
          CreatedByUserId: CREATED_BY_USER_ID,
          CollectiveId: COLLECTIVE_ID,
          monthlyLimitPerMember: MONTHLY_LIMIT_PER_MEMBER, // overloading to serve as prepaid amount
          currency: CURRENCY
        })
      }
    })
    return resolve(cardList);
  })
}

function run() {

  return generatePrepaidCards(BATCHES_TO_GENERATE)
    .then(cards => {
      console.log("Number of cards added: ", cards.length);
      return models.PaymentMethod.bulkCreate(cards);
    })
    .then(() => done())
    .catch(done)
}

run();