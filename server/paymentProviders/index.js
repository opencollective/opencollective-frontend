import fs from 'fs';

const paymentProviders = {};
fs.readdirSync(__dirname).forEach(file => {
  if (file === 'index.js') {
    return;
  }
  paymentProviders[file] = require(`./${file}`);
});

export default paymentProviders;
