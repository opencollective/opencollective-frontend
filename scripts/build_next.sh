echo "> Cleaning stage (before build)"
rm -rf stage

echo "> Copying src to stage"
cp -R src stage

echo "> Prunning __tests__"
rm -rf stage/pages/__tests__

echo "> Compiling next.config.js"
npx babel stage/next.config.js -o stage/next.config.js

echo "> Building next"
npx next build stage

echo "> Creating dist folder"
mkdir -p dist

echo "> Copying .next to dist folder"
cp -R stage/.next dist

echo "> Cleaning stage (after build)"
rm -rf stage
