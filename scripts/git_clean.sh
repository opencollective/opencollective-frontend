#!/bin/bash
if [[ `git checkout main` ]]; then
  for BRANCH in `git branch | grep -v "*"`; do
    git checkout $BRANCH > /dev/null 2>&1;
    if [[ `git merge main --no-edit 2> /dev/null` ]]; then
      echo "> $BRANCH merged with main";
      if [[ `git diff main` ]]; then
	echo "> $BRANCH is different than main";
        git reset --hard > /dev/null;
      else
	echo "> Removing branch $BRANCH";
        git checkout main;
        git branch -D $BRANCH;
      fi;
    else 
      git reset --hard > /dev/null;
      echo "Unable to merge $BRANCH with main";
    fi; 
  done;
  git checkout main;
fi;
