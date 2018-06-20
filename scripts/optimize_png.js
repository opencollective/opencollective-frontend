const path = require('path');
const imagemin = require('imagemin');
const imageminOptipng = require('imagemin-optipng');
const imageminZopfli = require('imagemin-zopfli');

const filePaths = [
  'src/public/images/',
  'src/public/images/icons/',
  'src/public/images/collectives/',
  'src/public/images/users/',
  'src/public/images/emails/',
  'src/static/images/',
  'src/static/images/buttons/',
  'src/static/images/email/',
  'src/static/images/icons/',
  // 'src/public/images/mime-pdf' // crash with transparent
  // 'src/public/images/icons/approved' // crash with transparent
];

const options = {};

options.use = [];

options.use.push(imageminOptipng({
  optimizationLevel: 7,
}));

options.use.push(imageminZopfli({
  more: true,
  transparent: true,
}));

filePaths.forEach(filePath => {
  imagemin([`${filePath}*.png`], path.dirname(`${filePath}*.png`), options)
    .then(files => {
      console.log(`${filePath}*.png was optimized, ${files.length} files`);
    });
});
