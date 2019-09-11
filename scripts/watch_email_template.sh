#!/bin/bash

usage() {
  echo ""
  echo "This scripts watches templates/emails/<email_template_name>.hbs and recompile it as needed."
  echo ""
  echo "usage: ./scripts/watch_email_template.sh <email_template_name>"
  echo "e.g. ./scripts/watch_email_template.sh collective.update.published"
  echo ""
}

if [[ $# -eq 0 ]] ; then
    usage
    exit 0
fi

TEMPLATE="templates/emails/${1}.hbs"

if [ ! -f $TEMPLATE ]; then
    echo "Template not found in $TEMPLATE"
    echo ""
    exit 0
fi

function compileTemplate {
  echo "Compiling $1";
  babel-node --extensions .js,.ts scripts/compile-email.js $1 > /tmp/$1.html
  echo "Done: /tmp/$1.html";
  return 0
}
export -f compileTemplate
compileTemplate $@
echo "Watching ${TEMPLATE}";
fswatch -o templates/ | xargs -n1 bash -c "compileTemplate "$@""
