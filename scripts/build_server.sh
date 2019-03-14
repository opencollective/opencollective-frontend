FROM=./src
TO=./dist

echo "> Compiling server"
babel $FROM --only "src/env.js,src/server/*,src/lib/utils.js" --out-dir $TO

echo "> Copying lang"
cp -R $FROM/lang $TO

echo "> Copying templates"
cp -R $FROM/templates $TO

echo "> Copying static"
mkdir -p $TO/static
cp -R $FROM/static/fonts $TO/static
cp -R $FROM/static/icons $TO/static
cp -R $FROM/static/images $TO/static
