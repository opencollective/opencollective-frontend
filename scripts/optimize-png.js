import path from 'path';

/* eslint-disable import/no-unresolved */
import imagemin from 'imagemin';
import imageminOptipng from 'imagemin-optipng';

const filePaths = [
  'src/static/images/',
  'src/static/images/buttons/',
  'src/static/images/email/',
  'src/static/images/icons/',
];

const options = {};

options.use = [];

options.use.push(
  imageminOptipng({
    optimizationLevel: 7,
  }),
);

filePaths.forEach(filePath => {
<<<<<<< HEAD
  imagemin(
    [`${filePath}*.png`],
    path.dirname(`${filePath}*.png`),
    options,
  ).then(files => {
=======
  imagemin([`${filePath}*.png`], path.dirname(`${filePath}*.png`), options).then(files => {
>>>>>>> fix(collective): fix twitter card
    console.log(`${filePath}*.png was optimized, ${files.length} files`);
  });
});
