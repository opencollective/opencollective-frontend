#!/usr/bin/env bash

if [ "$NODE_ENV" = "circleci" ]; then
  echo ${CIRCLE_TEST_REPORTS}
else
  echo "test/e2e/output"
fi