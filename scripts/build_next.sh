DIST=./dist

echo "> Cleaning dist (before build)"
npx rimraf $DIST
mkdir -p $DIST

echo "> Building next"
npx next build

echo "> Copying .next to dist folder"

cp -R .next $DIST

