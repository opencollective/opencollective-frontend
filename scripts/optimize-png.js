import path from 'path';

/* eslint-disable import/no-unresolved,node/no-missing-import */
import imagemin from 'imagemin';
import imageminOptipng from 'imagemin-optipng';

const filePaths = ['static/images/', 'static/images/buttons/', 'static/images/email/', 'static/images/icons/'];

const options = {};

options.use = [];

options.use.push(
  imageminOptipng({
    optimizationLevel: 7,
  }),
);

filePaths.forEach(filePath => {
  imagemin([`${filePath}*.png`], path.dirname(`${filePath}*.png`), options).then(files => {
    console.log(`${filePath}*.png was optimized, ${files.length} files`);
  });
});
