import fs from 'fs';

const paymentProviders = {};
fs.readdirSync(__dirname).forEach(file => {
  if (file === 'index.js') return;
  const name = file.substr(0, file.indexOf('.'));
  paymentProviders[name] = require(`./${file}`);
});

export default paymentProviders;