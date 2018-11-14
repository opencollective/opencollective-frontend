#!/usr/bin/env bash

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 [staging|production]"
  exit 1
fi

if [ "$1" != "staging" ] && [ "$1" != "production" ]; then
  echo "Unknwown remote $1"
  exit 1
fi


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

# ---- Show ths commits about to be pushed ----

echo "----------------"
git --no-pager log $1/master..origin/master
echo "----------------"

# ---- Ask for confirmation ----

echo "ℹ️  You're about to deploy the preceding commits from master branch to staging server."
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

ESCAPED_CHANGELOG=$(git --no-pager log $1/master..origin/master | sed 's/"/\\\\"/g')

read -d '' PAYLOAD << EOF
  {
    "channel": "C0RMV6F8C",
    "text": ":rocket: Deploying Frontend *master* branch to *${1}*",
    "as_user": true,
    "attachments": [{
      "title": "Changelog",
      "text": "${ESCAPED_CHANGELOG}"
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
