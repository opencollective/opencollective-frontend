env=$1

# current branch name
current_branch_name="$(git symbolic-ref HEAD 2>/dev/null)" ||
current_branch_name="(unnamed branch)"     # detached HEAD

current_branch_name=${current_branch_name##refs/heads/}

# Set env variables
if [ $env = "staging" ]
then
  branch_name="staging"
  remote="https://git.heroku.com/opencollective-staging-api.git"
  from_branch="master"
elif [ $env = "production" ]
then
  branch_name="production"
  remote="https://git.heroku.com/opencollective-prod-api.git"
  from_branch="staging"
else
  echo "Unknown env: $env, only staging and production are valid"
  exit
fi

# Get latest changes from github
git fetch origin

git checkout $from_branch
git merge origin/$from_branch

# If it's staging, increase version patch on master
if [ $env = "staging" ]
then
  npm version patch
fi


# Create branch for first time user or checkout existing one
if [[ `git branch --list $branch_name ` ]]
then
  git checkout $branch_name
  git merge $from_branch
else
  git checkout -b $branch_name $from_branch
fi

# Update on github
git push origin $branch_name

# Push to heroku
git push $remote $branch_name:master

# Update remote $from_branch
git push origin $from_branch

# Go back to the previous branch before deploying
git checkout $current_branch_name
