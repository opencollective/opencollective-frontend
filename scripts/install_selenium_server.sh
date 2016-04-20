#!/usr/bin/env bash

CACHE_DIR=~/cache/bin
SELENIUM_JAR=selenium-server-standalone-2.44.0.jar
LOCAL_SELENIUM=${CACHE_DIR}/${SELENIUM_JAR}

if [ ! -f ${CACHE_DIR} ]; then
  echo "Linking ./bin -> $CACHE_DIR"
  ln -s ${CACHE_DIR} ./bin
fi
if [ ! -f ${LOCAL_SELENIUM} ]; then
  echo "Installing $SELENIUM_JAR to $CACHE_DIR"
  mkdir -p ${CACHE_DIR}
  curl http://selenium-release.storage.googleapis.com/2.44/${SELENIUM_JAR} > ${LOCAL_SELENIUM}
else
  echo "$SELENIUM_JAR already available in $CACHE_DIR"
fi