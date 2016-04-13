#!/usr/bin/env bash

SUB_DIR=$1

if [ "$NODE_ENV" = "circleci" ]; then
  OUTPUT_DIR=${CIRCLE_TEST_REPORTS}/${SUB_DIR}
else
  OUTPUT_DIR="$PWD/test/output/$SUB_DIR"
fi
mkdir -p ${OUTPUT_DIR}
echo ${OUTPUT_DIR}