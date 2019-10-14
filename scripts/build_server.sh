SRC=./
DIST=./dist

echo "> Copying server"
cp env.js $DIST
cp -R server $DIST

echo "> Copying lang"
cp -R $SRC/lang $DIST

echo "> Copying static"
shx mkdir -p $DIST/static
cp -R $SRC/static/fonts $DIST/static
cp -R $SRC/static/icons $DIST/static
cp -R $SRC/static/images $DIST/static
cp -R $SRC/static/styles $DIST/static
cp -R $SRC/static/scripts $DIST/static
cp -R $SRC/static/.well-known $DIST/static
