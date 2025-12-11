// RFC 011 audit script for GraphQL best practices

// Usage: node scripts/rfc011-audit.js

const fs = require('fs');
const path = require('path');

const SRC_DIR = './';
const FILE_EXTENSIONS = ['.js', '.ts', '.tsx'];

// CLI flags: -o for operation name rule, -v for variable name rule
const args = process.argv.slice(2);
let ENABLE_OPERATION_NAME_RULE = true;
let ENABLE_VARIABLE_NAME_RULE = true;
if (args.length) {
  // If any flags are provided, disable all by default
  ENABLE_OPERATION_NAME_RULE = false;
  ENABLE_VARIABLE_NAME_RULE = false;
  if (args.includes('-o')) {
    ENABLE_OPERATION_NAME_RULE = true;
  }
  if (args.includes('-v')) {
    ENABLE_VARIABLE_NAME_RULE = true;
  }
}

let errorCount = 0;

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file === 'node_modules' || file === '.next') {
        return;
      }
      if (fullPath.includes(path.join('lib', 'graphql', 'types'))) {
        return;
      }
      walk(fullPath, filelist);
    } else if (FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
      filelist.push(fullPath);
    }
  });
  return filelist;
}

function checkOperationNameRule(file, i, block) {
  const declRegex = /^\s*(fragment|query|mutation)\s+([A-Za-z0-9_]+)/gm;
  let m;
  while ((m = declRegex.exec(block)) !== null) {
    const opName = m[2];
    // RFC 011: PascalCase, no Query/Mutation/Fragment suffix, no get/fetch prefix
    if (
      !/^[A-Z][a-zA-Z0-9]*$/.test(opName) ||
      /(Query|Mutation|Fragment)$/.test(opName) ||
      /^(get|fetch)/i.test(opName)
    ) {
      console.log(`[Operation Name] ${file}:${i + 1} -> "${opName}"`);
      errorCount++;
    }
  }
}

function checkVariableNameRule(file, i, varName) {
  // RFC 011: camelCase and ends with Mutation, Query, or Fragment
  if (!/^[a-z][a-zA-Z0-9]*(Mutation|Query|Fragment)$/.test(varName)) {
    console.log(`[Variable Name] ${file}:${i + 1} -> "${varName}"`);
    errorCount++;
  }
}

function auditFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Simple and reliable: look for lines with gql and a backtick, then collect until closing backtick
    if (ENABLE_OPERATION_NAME_RULE && line.match(/gql(V1)?`/)) {
      let block = `${line.substring(line.indexOf('gql'))}\n`;
      let j = i + 1;
      let closed = false;
      for (; j < lines.length; j++) {
        block += `${lines[j]}\n`;
        if (lines[j].includes('`')) {
          closed = true;
          break;
        }
      }
      if (block) {
        checkOperationNameRule(file, i, block);
      }
      if (closed) {
        i = j;
      }
    }

    // Detect variable assignments to gql/gqlV1 blocks
    if (ENABLE_VARIABLE_NAME_RULE) {
      const varAssignMatch = line.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*gql(V1)?/);
      if (varAssignMatch) {
        const varName = varAssignMatch[1];
        let foundTemplate = false;
        // Check current line for backtick
        if (line.includes('`')) {
          foundTemplate = true;
        } else {
          // Look ahead for up to 10 lines for a template literal
          for (let k = i + 1; k <= i + 10 && k < lines.length; k++) {
            if (lines[k].includes('`')) {
              foundTemplate = true;
              break;
            }
          }
        }
        if (foundTemplate) {
          checkVariableNameRule(file, i, varName);
        }
      }
    }
  }
}

walk(SRC_DIR).forEach(auditFile);

console.log('RFC 011 audit complete.');

if (errorCount > 0) {
  process.exit(1);
}
