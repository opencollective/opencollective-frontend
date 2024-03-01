/**
 * This script uses JSDoc to generate the documentation for the contribution flow URL
 * parameters based on `components/contribution-flow/query-parameters.js`. The output is meant to be
 * copy-pasted on https://github.com/opencollective/documentation/blob/v2/collectives/contribution-flow.md.
 */

/* eslint-disable no-console */

import jsdoc from 'jsdoc-api';
import { partition, repeat } from 'lodash';

const data = jsdoc.explainSync({
  files: './components/contribution-flow/query-parameters.js',
});

const CONFIGS = ['ContributionFlowUrlParametersConfig', 'EmbedContributionFlowUrlParametersConfig'];

const TYPE_LABELS = {
  stringArray: 'comma-separated list',
  interval: '"month" or "year"',
};

// Parse info
let rows = [];
for (const doc of data) {
  /* remove undocumented and non-members */
  if (doc.undocumented || doc.kind !== 'member' || !CONFIGS.includes(doc.memberof) || doc.access === 'private') {
    continue;
  }

  const type = JSON.parse(doc.meta.code.value).type;
  rows.push({
    name: `\`${doc.name}\``,
    type: TYPE_LABELS[type] || type,
    description: doc.deprecated
      ? `Deprecated: ${doc.deprecated}`
      : doc.memberof === 'EmbedContributionFlowUrlParametersConfig'
        ? `Embed only: ${doc.description}`
        : doc.description,
    default: doc.defaultvalue,
    example: doc.examples?.map(value => `\`&${doc.name}=${value}\``)?.join('\n') || '',
  });
}

// Move deprecated rows to the end
const [normalRows, deprecatedRows] = partition(rows, row => !row.description.startsWith('Deprecated:'));
rows = [...normalRows, ...deprecatedRows];

console.log(
  'Paste the following content on https://github.com/opencollective/documentation/blob/v2/collectives/contribution-flow.md \n',
);

// Output headers
const headers = Object.keys(rows[0]);
console.log(`| ${headers.join(' | ')} |`);
console.log(`| ${headers.map(str => repeat('-', str.length)).join(' | ')} |`);

// Output rows
for (const row of rows) {
  console.log(`| ${Object.values(row).join(' | ')} |`);
}
