#!/bin/bash
if [[ `git checkout master` ]]; then 
  for BRANCH in `git branch | grep -v "*"`; do
    if [[ `git diff master..$BRANCH` ]]; then
      echo "- $BRANCH needs to be fast-forward";
      git checkout $BRANCH;
      if [[ `git merge master --ff-only` ]]; then
        git checkout master;
        git branch -d $BRANCH;
      fi;
    else 
      git branch -D $BRANCH;
    fi; 
  done;
  git checkout master;
fi;
