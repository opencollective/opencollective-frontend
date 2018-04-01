#!/bin/sh
# This script wraps the sequelize command with babel-node and passes
# parameters required in every single call.
ROOT=$(git rev-parse --show-toplevel)
NODEBIN=${ROOT}/node_modules/.bin
PATH=${PATH}:$NODEBIN
SQLENV=${SEQUELIZE_ENV:=${NODE_ENV:=development}}
SEQUELIZE_CONFIG="--models-path server/models/ --config config/sequelize_cli.json --env ${SQLENV}"
COMMAND="babel-node $NODEBIN/sequelize $@ ${SEQUELIZE_CONFIG}"
cd ${ROOT}
echo ${COMMAND}
exec ${COMMAND}
