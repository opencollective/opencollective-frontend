DIST=./dist

echo "> Cleaning dist (before build)"
shx rm -rf $DIST
shx mkdir -p $DIST

echo "> Building next"
next build || exit 1

echo "> Copying .next to dist folder"

cp -R .next $DIST
