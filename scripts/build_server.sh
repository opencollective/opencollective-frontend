SRC=./src
DIST=./dist

echo "> Compiling server"
npx babel $SRC --only "src/env.js,src/server/*,src/lib/utils.js" --out-dir $DIST

echo "> Copying lang"
cp -R $SRC/lang $DIST

echo "> Copying templates"
cp -R $SRC/templates $DIST

echo "> Copying static"
mkdir -p $DIST/static
cp -R $SRC/static/fonts $DIST/static
cp -R $SRC/static/icons $DIST/static
cp -R $SRC/static/images $DIST/static
