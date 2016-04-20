#!/usr/bin/env bash

# Rebuild for bcrypt on circleci and other envs
npm rebuild

# Only run migrations automatically on staging and production
if [ "$SEQUELIZE_ENV" = "staging" ] || [ "$SEQUELIZE_ENV" = "production" ]; then
  npm run db:migrate
fi

# pre-install website and app to attempt to get their node_modules cached by circleci
if [ "$NODE_ENV" = "circleci" ]; then
  # only applicable if this repo is the one circleci is originally aiming to build/test
  # (avoid cyclic dependency when API is checked out from client builds)
  if [ ! -d "$HOME/website" ] && [ ! -d "$HOME/app" ]; then
    npm run test:e2e:exec website:install app:install
  fi
fi