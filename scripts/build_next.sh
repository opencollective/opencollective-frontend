STAGE=./stage
DIST=./dist

echo "> Cleaning stage (before build)"
npx rimraf $STAGE

echo "> Copying src to stage"
cp -R src $STAGE

echo "> Pruning __tests__"
npx rimraf $STAGE/pages/__tests__

echo "> Compiling env.js and next.config.js"
npx babel $STAGE/env.js -o $STAGE/env.js
npx babel $STAGE/next.config.js -o $STAGE/next.config.js

echo "> Building next"
npx next build $STAGE

echo "> Ensure dist folder exists"
mkdir -p $DIST

echo "> Copying .next to dist folder"
cp -R $STAGE/.next $DIST

echo "> Cleaning stage (after build)"
npx rimraf $STAGE
