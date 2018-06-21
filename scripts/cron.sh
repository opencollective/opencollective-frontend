#!/bin/bash
BIN_PATH=./node_modules/.bin
BIN=babel-node
FILE_PATH="./cron/$1/"
TZ=utc

for FILE in `ls $FILE_PATH`; do 
  echo "Running $BIN $FILE_PATH$FILE";
  "$BIN_PATH/$BIN" "$FILE_PATH$FILE";
done;