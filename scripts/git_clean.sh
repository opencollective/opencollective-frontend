#!/bin/bash
if [[ `git checkout master` ]]; then 
  for BRANCH in `git branch | grep -v "*"`; do
    git checkout $BRANCH > /dev/null 2>&1;
    if [[ `git merge master --no-edit 2> /dev/null` ]]; then
      echo "> $BRANCH merged with master";
      if [[ `git diff master` ]]; then
	echo "> $BRANCH is different than master";
        git reset --hard > /dev/null;
      else
	echo "> Removing branch $BRANCH";
        git checkout master;
        git branch -D $BRANCH;
      fi;
    else 
      git reset --hard > /dev/null;
      echo "Unable to merge $BRANCH with master";
    fi; 
  done;
  git checkout master;
fi;
