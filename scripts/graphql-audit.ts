// RFC 011 audit script for GraphQL best practices
// Usage: tsx scripts/graphql-audit.ts [-o] [-v] [-h]

import fs from 'fs';
import path from 'path';

import type { OperationDefinitionNode } from 'graphql';
import { Kind, parse } from 'graphql';

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

function walk(dir: string, filelist: string[] = []): string[] {
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
    } else if (file === 'graphql-audit.test.ts') {
      // Its fixtures break the rules on purpose
      return;
    } else if (FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
      filelist.push(fullPath);
    }
  });
  return filelist;
}

// A `gql` or `gqlV1` tag, optionally annotated (`gqlV1 /* GraphQL */`), followed by its backtick or by the end of
// the line when the template opens on the next one
const GQL_TAG = /\bgql(?:V1)?\s*(?:\/\*\s*GraphQL\s*\*\/\s*)?(`|$)/;

// A `graphql()` HOC call, with optional type arguments (`graphql<Props>(`)
const HOC_CALL = /\bgraphql\s*[<(]/;

// --- Rule: GraphQL operation name ---
function checkOperationNameRule(file: string, i: number, block: string) {
  // RFC 011: every operation has a name, including shorthand `{ ... }` queries. The parser tells an operation from a
  // selection set; interpolations (`${fragment}`) are dropped first, they only add definitions.
  let anonymous: string[];
  try {
    anonymous = parse(block.replace(/\$\{[^}]*\}/g, ''))
      .definitions.filter(def => def.kind === Kind.OPERATION_DEFINITION && !def.name)
      .map(def => (def as OperationDefinitionNode).operation);
  } catch {
    // Not parseable on its own (unusual interpolation): fall back to explicit `query`/`mutation` keywords
    anonymous = [...block.matchAll(/^\s*(query|mutation)\s*[({]/gm)].map(match => match[1]);
  }
  for (const operation of anonymous) {
    console.log(`[Operation Name] ${file}:${i + 1} -> anonymous ${operation}`);
    errorCount++;
  }
  let m;
  const declRegex = /^\s*(fragment|query|mutation)\s+([A-Za-z0-9_]+)/gm;
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
function checkVariableNameRule(file: string, i: number, varName: string) {
  // RFC 011: camelCase and ends with Mutation, Query, or Fragment
  if (!/^[a-z][a-zA-Z0-9]*(Mutation|Query|Fragment)$/.test(varName)) {
    console.log(`[Variable Name] ${file}:${i + 1} -> "${varName}"`);
    errorCount++;
  }
}

// --- Rule: GraphQL HOC variable name ---
function checkHocNameRule(file: string, i: number, line: string) {
  // Match any variable assigned to graphql(...) or graphql<...>(...)
  const match = line.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*graphql\s*[<(]/);
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

// Returns the contents of the gql template whose tag is on line i, and the line where it closes. Null when the tag
// is not followed by a template.
function readTemplate(lines: string[], i: number): { block: string; end: number } | null {
  const tag = lines[i].match(GQL_TAG);
  let start = i;
  let rest = lines[i].substring(tag.index + tag[0].length);
  if (!tag[1]) {
    // The backtick opens the next line
    const opening = lines[i + 1]?.match(/^\s*`/);
    if (!opening) {
      return null;
    }
    start = i + 1;
    rest = lines[start].substring(opening[0].length);
  }
  const sameLineEnd = rest.indexOf('`');
  if (sameLineEnd !== -1) {
    return { block: rest.substring(0, sameLineEnd), end: start };
  }
  let block = `${rest}\n`;
  for (let j = start + 1; j < lines.length; j++) {
    const end = lines[j].indexOf('`');
    if (end !== -1) {
      return { block: block + lines[j].substring(0, end), end: j };
    }
    block += `${lines[j]}\n`;
  }
  return { block, end: lines.length - 1 };
}

// --- Main audit logic ---
function auditFile(file: string) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Last line consumed by a multi-line block; every rule runs on line i before skipping past it
    let next = i;

    // HOC assignment rule (handle multi-line). It only reads ahead: the call can hold an inline gql template,
    // which the operation name rule must still reach on its own line.
    if (enabledRules.hoc && HOC_CALL.test(line)) {
      // The assignment can sit alone on the line before (`const addAccountQuery =`)
      const start = i > 0 && /=\s*$/.test(lines[i - 1]) ? i - 1 : i;
      let hocBlock = lines.slice(start, i + 1).join('\n');
      let j = i + 1;
      while (j < lines.length && !/\);?\s*$/.test(hocBlock)) {
        hocBlock += `\n${lines[j]}`;
        j++;
      }
      checkHocNameRule(file, start, hocBlock);
    }

    // GraphQL operation name rule
    if (enabledRules.operation && GQL_TAG.test(line)) {
      const template = readTemplate(lines, i);
      if (template) {
        checkOperationNameRule(file, i, template.block);
        next = Math.max(next, template.end);
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

    i = next;
  }
}

// --- Run audit ---
walk(SRC_DIR).forEach(auditFile);
console.log('GraphQL audit complete.');
if (errorCount > 0) {
  process.exit(1);
}
