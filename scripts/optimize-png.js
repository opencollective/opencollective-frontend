/* eslint-disable import/no-unresolved,node/no-missing-import,node/no-extraneous-import */
import imagemin from 'imagemin';
import imageminOptipng from 'imagemin-optipng';
import imageminPngquant from 'imagemin-pngquant';

const options = {};

options.plugins = [];

options.plugins.push(
  imageminPngquant({
    speed: 2,
    quality: [0.1, 0.2],
    verbose: true,
  }),
  imageminOptipng({
    optimizationLevel: 7,
  }),
);

const baseDirectory = `public/static/images`;

const directories = [
  'home',
  // 'create-collective',
  // 'become-a-sponsor',
  // 'become-a-host',
];

for (const directory of directories) {
  imagemin([`${baseDirectory}/${directory}/original/joinus-green**.png`], {
    ...options,
    destination: `${baseDirectory}/${directory}`,
  }).then(files => {
    console.log(`${baseDirectory}/${directory}/original/*.png was optimized, ${files.length} files`);
  });
}
