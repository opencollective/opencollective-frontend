#!/usr/bin/env bash


set -e

# Only run migrations automatically on staging and production
if [ "$SEQUELIZE_ENV" = "staging" ] || [ "$SEQUELIZE_ENV" = "production" ]; then
  npm run db:migrate
fi

# pre-install website and app to attempt to get their node_modules cached by circleci
if [ "$NODE_ENV" = "circleci" ]; then
  npm run test:e2e:exec website:install app:install
fi