# Rebuild for bcrypt on circleci and other envs
npm rebuild

# Only run migrations automatically on staging and production
if [ "$SEQUELIZE_ENV" = "staging" ] || [ "$SEQUELIZE_ENV" = "production" ]; then
  npm run db:migrate
fi
