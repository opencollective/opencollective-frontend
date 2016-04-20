#!/usr/bin/env bash

# Rebuild for bcrypt on circleci and other envs
npm rebuild

# Only run migrations automatically on staging and production
if [ "$SEQUELIZE_ENV" = "staging" ] || [ "$SEQUELIZE_ENV" = "production" ]; then
  npm run db:migrate
fi

if [ "$NODE_ENV" = "circleci" ]; then
  # pre-install website and app to attempt to get their node_modules cached by circleci
  npm run test:e2e:exec website:install app:install
fi