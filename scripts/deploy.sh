env=$1

# Set env variables
if [ $env = "staging" ]
then
  branch_name="staging"
  remote="https://git.heroku.com/opencollective-staging-api.git"
elif [ $env = "production" ]
then
  branch_name="production"
  remote="https://git.heroku.com/opencollective-prod-api.git"
else
  echo "Unknown env: $env, only staging and production are valid"
  exit
fi

# Create branch for first time user or checkout existing one
if [[ `git branch --list $branch_name ` ]]
then
  git checkout $branch_name
else
  git checkout -b $branch_name master
fi

# Get latest changes on github
git fetch origin

# Merge github master branch
git merge origin/master

# Update on github
git push origin $branch_name

# Push to heroku
git push $remote $branch_name:master