#!/usr/bin/env bash

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 [staging|production]"
  exit 1
fi

if [ "$1" != "staging" ] && [ "$1" != "production" ]; then
  echo "Unknwown remote $1"
  exit 1
fi

# ---- Variables ----

LOCAL_BRANCH="origin/master"
REMOTE_BRANCH="$1/master"
SLACK_CHANNEL="C0RMV6F8C"
GIT_LOG_FORMAT_SHELL='short'
GIT_LOG_FORMAT_SLACK='format:<https://github.com/opencollective/opencollective-api/commit/%H|[%ci]> *%an* %n%s%n'

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

# ---- Show the commits about to be pushed ----

# Update deploy remote
echo "ℹ️  Fetching remote $1 state..."
git fetch $1 > /dev/null

echo ""
echo "-------------- New commits --------------"
git --no-pager log --pretty="${GIT_LOG_FORMAT_SHELL}" $REMOTE_BRANCH..$LOCAL_BRANCH
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
  git log --pretty="${GIT_LOG_FORMAT_SLACK}" $REMOTE_BRANCH..$LOCAL_BRANCH \
  | sed 's/"/\\\\"/g'
)

read -d '' PAYLOAD << EOF
  {
    "channel": "${SLACK_CHANNEL}",
    "text": ":unicorn_face: Deploying API master branch to *${1}*",
    "as_user": true,
    "attachments": [{
      "title": "📖 Changelog",
      "text": "
----------------------------------------
${ESCAPED_CHANGELOG}
"
    }]
  }
EOF

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

# Always exit with 0 to continue the deploy even if slack notification failed
exit_success
