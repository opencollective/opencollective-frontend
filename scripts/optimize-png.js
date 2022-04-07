/* eslint-disable import/no-unresolved,node/no-missing-import,node/no-extraneous-import */
import Path from 'path';

import imagemin from 'imagemin';
import imageminOptipng from 'imagemin-optipng';
import imageminPngquant from 'imagemin-pngquant';

const options = {};

if (process.argv.length < 3) {
  throw new Error(`
    Usage: babel-node ./scripts/optimize-png SOURCE_PATH [OUTPUT_PATH]

    If OUTPUT_PATH is not defined, the source files will be replaced.
  `);
}

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

imagemin([process.argv[2]], {
  ...options,
  destination: process.argv[3] || Path.dirname(process.argv[2]),
}).then(files => {
  console.log(
    `${files.length} optimized files:\n${files
      .map(file => `${file.sourcePath} => ${file.destinationPath}`)
      .join('\n')}`,
  );
});
