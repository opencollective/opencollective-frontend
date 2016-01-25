# Rebuild for bcrypt on circleci and other envs
npm rebuild

# Only run migrations automatically on staging
if [ "$SEQUELIZE_ENV" = "staging" ]; then
  npm run db:migrate
fi
