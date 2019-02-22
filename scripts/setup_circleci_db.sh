cd ~/api
echo "> Restoring opencollective_dvl database for e2e testing";
export PGPORT=5432
export PGHOST=localhost
export PGUSER=ubuntu
npm run db:setup
./scripts/db_restore.sh -U ubuntu -d opencollective_dvl -f test/dbdumps/opencollective_dvl.pgsql
./scripts/sequelize.sh db:migrate
if [ $? -ne 0 ]; then
  echo "Error with restoring opencollective_dvl, exiting"
  exit 1;
else
  echo "✓ API is setup";
fi
