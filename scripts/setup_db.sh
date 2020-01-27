if [ -z "$API_FOLDER" ]; then
  cd ~/api
else
  cd $API_FOLDER
fi
echo "> Restoring opencollective_dvl database for e2e testing";
npm run db:restore
npm run db:migrate
if [ $? -ne 0 ]; then
  echo "Error with restoring opencollective_dvl, exiting"
  exit 1;
else
  echo "✓ API is setup";
fi
cd -
