#!/usr/bin/env node
import '../server/env';

/**
 * This script will go back to past commits until the test function returns true
 * Useful to find out when something changed in the code
 */

const test = stdout => !stdout.match(/relation "Notifications" does not exist/);
const command = `mocha test/transactions.routes.test.js`;

const initialIndex = 0;
const initialSteps = 100;

import { exec, execSync } from 'child_process';

const commits = execSync(`git log --pretty=%H:%cd --date=short`, {
  encoding: 'utf8',
});

const commits_array = commits.split('\n');

let index;
let stdout;

let lastGoodCommit, lastBadCommit;

const run = (startIndex, steps) => {
  console.log('Running starting from index', startIndex, 'with steps', steps);
  index = startIndex;
  let commit, date;
  do {
    index += steps;
    const parts = commits_array[index].split(':');
    commit = parts[0];
    date = parts[1];
    console.log('Check out commit', commit, 'from', date, 'at index', index);
    execSync(`git checkout ${commit} > /dev/null 2>&1`);
    console.log('Running', command);
    stdout = execSync(`${command} 2>&1`, { encoding: 'utf8' });
    console.log('Is stdout test passing?', test(stdout));
    if (test(stdout)) {
      lastGoodCommit = commit;
    } else {
      lastBadCommit = commit;
    }
  } while (!test(stdout));
  if (steps > 1) {
    run(index - steps, Math.ceil(steps / 2));
  }
};

run(initialIndex, initialSteps);

console.log('');
console.log('Last good commit:', lastGoodCommit);
console.log('Last bad commit:', lastBadCommit);
console.log('Showing the diff:');
console.log(`git diff ${lastGoodCommit} ${lastBadCommit}`);
console.log('');

const gitDiff = exec(`git diff ${lastGoodCommit} ${lastBadCommit}`);
gitDiff.stdout.pipe(process.stdout);
