// RFC 011 audit script for GraphQL best practices
// Usage: node scripts/graphql-audit.js [-o] [-v] [-h]

const fs = require('fs');
const path = require('path');

const SRC_DIR = './';
const FILE_EXTENSIONS = ['.js', '.ts', '.tsx'];

// CLI flags: -o for operation name, -v for variable name, -h for HOC rule
const args = process.argv.slice(2);
const enabledRules = {
  operation: true,
  variable: true,
  hoc: true,
};
if (args.length) {
  // If any flags are provided, disable all by default
  Object.keys(enabledRules).forEach(k => (enabledRules[k] = false));
  for (const arg of args) {
    if (arg === '-o') {
      enabledRules.operation = true;
    }
    if (arg === '-v') {
      enabledRules.variable = true;
    }
    if (arg === '-h') {
      enabledRules.hoc = true;
    }
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

// --- Rule: GraphQL operation name ---
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

// --- Rule: GraphQL variable name ---
function checkVariableNameRule(file, i, varName) {
  // RFC 011: camelCase and ends with Mutation, Query, or Fragment
  if (!/^[a-z][a-zA-Z0-9]*(Mutation|Query|Fragment)$/.test(varName)) {
    console.log(`[Variable Name] ${file}:${i + 1} -> "${varName}"`);
    errorCount++;
  }
}

// --- Rule: GraphQL HOC variable name ---
function checkHocNameRule(file, i, line) {
  // Match any variable assigned to graphql(...)
  const hocAssignRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*graphql\(([^)]*)\)/;
  const match = line.match(hocAssignRegex);
  if (match) {
    const varName = match[1];
    // Accept any PascalCase name prefixed with 'add' and ending with allowed suffix
    if (!/^add[A-Z][a-zA-Z0-9]+(Mutation|Query|Fragment|Data)$/.test(varName)) {
      console.log(
        `[HOC Name] ${file}:${i + 1} -> "${varName}" should be prefixed with 'add' and PascalCase, ending with Query, Data, Mutation, or Fragment`,
      );
      errorCount++;
    }
  }
}

// --- Main audit logic ---
function auditFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // HOC assignment rule (handle multi-line)
    if (enabledRules.hoc && line.includes('graphql(')) {
      let hocBlock = line;
      let j = i + 1;
      while (j < lines.length && !/\);?\s*$/.test(hocBlock)) {
        hocBlock += `\n${lines[j]}`;
        j++;
      }
      checkHocNameRule(file, i, hocBlock);
      if (j > i + 1) {
        i = j - 1;
      }
    }

    // GraphQL operation name rule
    if (enabledRules.operation && line.match(/gql(V1)?`/)) {
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
      checkOperationNameRule(file, i, block);
      if (closed) {
        i = j;
      }
    }

    // GraphQL variable name rule
    if (enabledRules.variable) {
      const varAssignMatch = line.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*gql(V1)?/);
      if (varAssignMatch) {
        const varName = varAssignMatch[1];
        let foundTemplate = false;
        if (line.includes('`')) {
          foundTemplate = true;
        } else {
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

// --- Run audit ---
walk(SRC_DIR).forEach(auditFile);
console.log('GraphQL audit complete.');
if (errorCount > 0) {
  process.exit(1);
}
