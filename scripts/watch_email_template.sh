#!/bin/bash
TEMPLATE="templates/emails/${1}.hbs"

function compileTemplate {
  echo "Compiling $1";
  babel-node scripts/compile-email.js $1 > /tmp/$1.html
  echo "Done: /tmp/$1.html";
  return 0
}
export -f compileTemplate
compileTemplate $@
echo "Watching ${TEMPLATE}";
fswatch -o templates/ | xargs -n1 bash -c "compileTemplate "$@""
