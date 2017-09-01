import fs from 'fs';

fs.readdirSync(__dirname).forEach(file => {
  if (file === 'index.js') return;
  const name = file.substr(0, file.indexOf('.'));
  exports[name] = require(`./${file}`);
});