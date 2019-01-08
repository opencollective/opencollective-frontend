#!/bin/sh
# This script wraps the sequelize command with babel-node and passes
# parameters required in every single call.

# Important paths
ROOT="$( dirname "$(readlink "$0/..")" )"
NODEBIN=${ROOT}/node_modules/.bin
PATH=${PATH}:$NODEBIN

# Environment
SQLENV=${SEQUELIZE_ENV:=${NODE_ENV:=development}}

# Parameters & Command
PG_URL=`babel-node config/pg-url.js`
SEQUELIZE_CONFIG="--models-path server/models/ --url ${PG_URL} --env ${SQLENV}"
COMMAND="babel-node $NODEBIN/sequelize ${SEQUELIZE_CONFIG} $@"

# Variables exported for the exec
export CUSTOM_DB PATH
cd ${ROOT}
echo ${COMMAND}
exec ${COMMAND}
