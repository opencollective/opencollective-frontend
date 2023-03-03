import readline from 'readline';

import { pickBy } from 'lodash';

/**
 * A wrapper around `pickBy` that allows to pass a list of either:
 * - strings: the keys to pick
 * - regexes: the keys to pick if they match the regex
 */
export const pickByPatterns = (object, patterns) => {
  return pickBy(object, (_, name) => {
    return patterns.some(pattern => {
      if (typeof pattern === 'string') {
        return name === pattern;
      } else {
        return pattern.test(name);
      }
    });
  });
};

export const confirm = question => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise(resolve => {
    rl.question(`${question}\n> `, input => {
      if (['y', 'yes', 'sure', 'ok'].includes(input.toLowerCase())) {
        resolve(true);
      } else {
        rl.close();
        resolve(false);
      }
    });
  });
};
