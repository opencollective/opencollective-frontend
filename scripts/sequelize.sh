#!/bin/sh
# This script wraps the sequelize command with babel-node and passes
# parameters required in every single call.

# Important paths
ROOT="$( dirname "$(readlink "$0/..")" )"
NODEBIN=${ROOT}/node_modules/.bin
PATH=${PATH}:$NODEBIN

# Parameters & Command
SEQUELIZE_CONFIG="--models-path server/models/ --config config/sequelize-cli.js"
COMMAND="babel-node --extensions .js,.ts $NODEBIN/sequelize ${SEQUELIZE_CONFIG} $@"

# Variables exported for the exec
export CUSTOM_DB PATH
cd ${ROOT}
echo ${COMMAND}
exec ${COMMAND}
