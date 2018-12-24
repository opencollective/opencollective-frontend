#!/usr/bin/env bash
#
# Description
# ===========
#
# Pre-deploy hook. Does the following:
#   1. Shows the commits about to be pushed
#   2. Ask for confirmation (exit with 1 if not confirming)
#   3. Notify Slack
#
#
# Developing
# ==========
# 
# During development, the best way to test it is to call the script
# directly with `./scripts/pre-deploy.sh staging|production`. You can also set
# the `SLACK_CHANNEL` to your personnal channel so you don't flood the team.
# To do that, right click on your own name in Slack, `Copy link`, then
# only keep the last part of the URL.
#
# Or you can set `PUSH_TO_SLACK` to false to echo the payload instead of
# sending it.
#
# ------------------------------------------------------------------------------

if [ "$#" -ne 1 ]; then
  echo "Usage: [DEPLOY_MSG='An optional custom deploy message'] $0 staging|production"
  exit 1
fi

# ---- Variables ----

if [ "$1" == "staging" ]; then
  DEPLOY_ORIGIN_URL="https://git.heroku.com/opencollective-staging-api.git"
elif [ "$1" == "production" ]; then
  DEPLOY_ORIGIN_URL="https://git.heroku.com/opencollective-prod-api.git"
else
  echo "Unknwown remote $1"
  exit 1
fi

PUSH_TO_SLACK=true # Setting this to false will echo the message instead of pushing to Slack
SLACK_CHANNEL="CEZUS9WH3"

LOCAL_ORIGIN="origin"
PRE_DEPLOY_ORIGIN="predeploy-${1}"

LOCAL_BRANCH="master"
PRE_DEPLOY_BRANCH="master"

GIT_LOG_FORMAT_SHELL='short'
GIT_LOG_FORMAT_SLACK='format:<https://github.com/opencollective/opencollective-api/commit/%H|[%ci]> *%an* %n_%<(80,trunc)%s_%n'
GIT_LOG_COMPARISON="$PRE_DEPLOY_ORIGIN/$PRE_DEPLOY_BRANCH..$LOCAL_ORIGIN/$LOCAL_BRANCH"

# ---- Utils ----

function confirm()
{
  echo -n "$@"
  read -e answer
  for response in y Y yes YES Yes Sure sure SURE OK ok Ok
  do
      if [ "$answer" == "$response" ]
      then
          return 0
      fi
  done

  # Any answer other than the list above is considerred a "no" answer
  return 1
}

function exit_success()
{
  echo "🚀  Deploying now..."
  exit 0
}

# ---- Ensure we have a reference to the remote ----

git remote add $PRE_DEPLOY_ORIGIN $DEPLOY_ORIGIN_URL &> /dev/null

# ---- Show the commits about to be pushed ----

# Update deploy remote
echo "ℹ️  Fetching remote $1 state..."
git fetch $PRE_DEPLOY_ORIGIN > /dev/null

echo ""
echo "-------------- New commits --------------"
git --no-pager log --pretty="${GIT_LOG_FORMAT_SHELL}" $GIT_LOG_COMPARISON
echo "-----------------------------------------"
echo ""

# ---- Ask for confirmation ----

echo "ℹ️  You're about to deploy the preceding commits from master branch to $1 server."
confirm "❔ Are you sure (yes/no) > " || exit 1

# ---- Slack notification ----

cd -- "$(dirname $0)/.."
eval $(cat .env | grep OC_SLACK_USER_TOKEN=)

if [ -z "$OC_SLACK_USER_TOKEN" ]; then
  # Emit a warning as we don't want the deploy to crash just because we
  # havn't setup a Slack token. Get yours on https://api.slack.com/custom-integrations/legacy-tokens
  echo "ℹ️  OC_SLACK_USER_TOKEN is not set, I will not notify Slack about this deploy 😞  (please do it manually)"
  exit_success
fi

ESCAPED_CHANGELOG=$(
  git log --pretty="${GIT_LOG_FORMAT_SLACK}" $GIT_LOG_COMPARISON \
  | sed 's/"/\\\\"/g'
)

if [ ! -z "$DEPLOY_MSG" ]; then
  CUSTOM_MESSAGE="-- _$(echo $DEPLOY_MSG | sed 's/"/\\\\"/g' | sed "s/'/\\\\'/g")_"
fi

read -d '' PAYLOAD << EOF
  {
    "channel": "${SLACK_CHANNEL}",
    "text": ":unicorn_face: Deploying *API* to *${1}* ${CUSTOM_MESSAGE}",
    "as_user": true,
    "attachments": [{
      "text": "
---------------------------------------------------------------------------------------------------

${ESCAPED_CHANGELOG}
"
    }]
  }
EOF

if [ $PUSH_TO_SLACK = "true" ]; then
  curl \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "Authorization: Bearer ${OC_SLACK_USER_TOKEN}" \
    -d "$PAYLOAD" \
    -s \
    --fail \
    https://slack.com/api/chat.postMessage \
    &> /dev/null

  if [ $? -ne 0 ]; then
    echo "⚠️  I won't be able to notify slack. Please do it manually and check your OC_SLACK_USER_TOKEN"
  else
    echo "🔔  Slack notified about this deployment."
  fi
else
  echo "Following message would be posted on Slack:"
  echo "$PAYLOAD"
fi

# Always exit with 0 to continue the deploy even if slack notification failed
exit_success
