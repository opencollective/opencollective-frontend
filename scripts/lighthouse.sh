#!/bin/bash

RETURN_CODE=0

. ./scripts/setup_functions.sh

start_app

wait_for_app_services

echo ""
echo "> Running lighthouse"
npx lhci autorun
RETURN_CODE=$?

stop_app

exit $RETURN_CODE
