SRC=./
DIST=./dist

echo "> Copying server"
cp env.js $DIST
cp -R server $DIST

echo "> Copying lang"
cp -R $SRC/lang $DIST

echo "> Copying static"
shx mkdir -p $DIST/public/static
cp -R $SRC/public/.well-known $DIST/public
cp -R $SRC/public/static/fonts $DIST/public/static
cp -R $SRC/public/static/icons $DIST/public/static
cp -R $SRC/public/static/images $DIST/public/static
cp -R $SRC/public/static/styles $DIST/public/static
cp -R $SRC/public/static/scripts $DIST/public/static
cp -R $SRC/public/robots.txt $DIST/public
