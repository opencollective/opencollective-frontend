#!/usr/bin/env bash
#
# Description
# ===========
#
# Deploy script. Does the following:
#   1. Shows the commits about to be pushed (stops there if there are none)
#   2. Ask for confirmation (exit with 1 if not confirming)
#   3. Notify Slack
#   4. Push origin/main to Heroku
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
  HEROKU_APP="oc-staging-frontend"
elif [ "$1" == "production" ]; then
  HEROKU_APP="oc-prod-frontend"
else
  echo "Unknwown remote $1"
  exit 1
fi

PUSH_TO_SLACK=true # Setting this to false will echo the message instead of pushing to Slack
SLACK_CHANNEL="CEZUS9WH3"

DEPLOY_ORIGIN_URL="https://git.heroku.com/${HEROKU_APP}.git"

LOCAL_ORIGIN="origin"
PRE_DEPLOY_ORIGIN="predeploy-${1}"

LOCAL_BRANCH="main"
PRE_DEPLOY_BRANCH="main"

GIT_LOG_FORMAT_SHELL='short'
GIT_LOG_FORMAT_SLACK='format:<https://github.com/opencollective/opencollective-frontend/commit/%H|[%ci]> *%an* %n_%<(80,trunc)%s_%n'

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
  if [ "$1" == "staging" ]; then
    PUSH_FLAGS="--force"
  fi
  git push $PUSH_FLAGS $DEPLOY_ORIGIN_URL "$LOCAL_ORIGIN/$LOCAL_BRANCH:refs/heads/$PRE_DEPLOY_BRANCH"
  exit $?
}

function get_deployed_commit()
{
  # Commit of the current Heroku release. Unlike the Heroku git remote, this is also
  # correct when the app is deployed by the GitHub integration or rolled back.
  local token slug_id
  command -v heroku &> /dev/null || return 1
  token=$(heroku auth:token 2> /dev/null) || return 1
  slug_id=$(heroku releases:info -a "$HEROKU_APP" --json 2> /dev/null | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0)).slug?.id ?? '')") || return 1
  [ -n "$slug_id" ] || return 1
  curl -s --fail \
    -H "Authorization: Bearer $token" \
    -H "Accept: application/vnd.heroku+json; version=3" \
    "https://api.heroku.com/apps/$HEROKU_APP/slugs/$slug_id" \
    | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0)).commit ?? '')"
}

# ---- Show the commits about to be pushed ----

echo "ℹ️  Fetching remote $1 state..."
git fetch $LOCAL_ORIGIN $LOCAL_BRANCH &> /dev/null
DEPLOYED_COMMIT=$(get_deployed_commit)

if [ -n "$DEPLOYED_COMMIT" ] && git cat-file -e "$DEPLOYED_COMMIT^{commit}" &> /dev/null; then
  GIT_LOG_COMPARISON="$DEPLOYED_COMMIT..$LOCAL_ORIGIN/$LOCAL_BRANCH"
else
  # Fallback on the Heroku git remote, which is only up to date when deploying with `git push`
  echo "⚠️  Could not get the deployed commit from the Heroku CLI (is it installed and logged in?), using the Heroku git remote instead."
  git remote add $PRE_DEPLOY_ORIGIN $DEPLOY_ORIGIN_URL &> /dev/null
  git fetch $PRE_DEPLOY_ORIGIN $PRE_DEPLOY_BRANCH > /dev/null
  GIT_LOG_COMPARISON="$PRE_DEPLOY_ORIGIN/$PRE_DEPLOY_BRANCH..$LOCAL_ORIGIN/$LOCAL_BRANCH"
fi

if [ -z "$(git rev-list -n 1 $GIT_LOG_COMPARISON)" ]; then
  echo "✅  $1 is already up to date with $LOCAL_ORIGIN/$LOCAL_BRANCH ($(git rev-parse --short $LOCAL_ORIGIN/$LOCAL_BRANCH)), nothing to deploy."
  exit 0
fi

echo ""
echo "-------------- New commits --------------"
git --no-pager log --pretty="${GIT_LOG_FORMAT_SHELL}" $GIT_LOG_COMPARISON
echo "-----------------------------------------"
echo ""

# ---- Ask for confirmation ----

echo "ℹ️  You're about to deploy the preceding commits from main branch to $1 server."
confirm "❔ Are you sure (yes/no) > " || exit 1

# ---- Slack notification ----

cd -- "$(dirname $0)/.."
eval $(cat .env | grep OC_SLACK_DEPLOY_WEBHOOK=)

if [ -z "$OC_SLACK_DEPLOY_WEBHOOK" ]; then
  # Emit a warning as we don't want the deploy to crash just because we
  # havn't setup a Slack token. Get yours on https://api.slack.com/custom-integrations/legacy-tokens
  echo "ℹ️  OC_SLACK_DEPLOY_WEBHOOK is not set, I will not notify Slack about this deploy 😞  (please do it manually)"
  exit_success $1
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
    "text": ":rocket: Deploying *FRONTEND* to *${1}* ($(git config user.name)) ${CUSTOM_MESSAGE}",
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
    -d "$PAYLOAD" \
    -s \
    --fail \
    "$OC_SLACK_DEPLOY_WEBHOOK" \
    &> /dev/null

  if [ $? -ne 0 ]; then
    echo "⚠️  I won't be able to notify slack. Please do it manually and check your OC_SLACK_DEPLOY_WEBHOOK"
  else
    echo "🔔  Slack notified about this deployment."
  fi
else
  echo "Following message would be posted on Slack:"
  echo "$PAYLOAD"
fi

# Always exit with 0 to continue the deploy even if slack notification failed
exit_success $1
