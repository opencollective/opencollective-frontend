import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { API, FileInfo, Options } from 'jscodeshift';
import { run as jscodeshiftRun } from 'jscodeshift/src/Runner';
import { omit } from 'lodash';

import logger from '../../server/logger';

const LANG_FILE = path.resolve(__dirname, '../../lang/en.json');

// Cache translations to avoid reloading for each file
let translationsCache: Record<string, string> | null = null;

// Track updated translation keys across all files
// Note: This Set only works in the main process. For worker processes, we use a temp file.
const updatedKeys = new Set<string>();

// Temporary file to collect keys from worker processes
// Each process writes to its own file to avoid concurrent write issues
let processTempFile: string | null = null;

function getProcessTempFile(): string {
  if (!processTempFile) {
    // Use base ID from environment (set by main process) or generate one
    const baseId = process.env.JSCODESHIFT_KEYS_BASE_ID || `${process.pid}-${Date.now()}`;
    // Each process gets its own file using process.pid to avoid conflicts
    processTempFile = path.join(os.tmpdir(), `jscodeshift-keys-${baseId}-${process.pid}.txt`);
  }
  return processTempFile;
}

// Write a key to the process-specific temp file (works in both main and worker processes)
function addUpdatedKey(key: string): void {
  // Always add to Set (works in main process)
  updatedKeys.add(key);

  // Also write to process-specific temp file (each worker has its own file)
  // This avoids concurrent write issues since each process writes to its own file
  const tempFile = getProcessTempFile();
  try {
    // Append key on a new line (simple format, avoids JSON parsing issues)
    fs.appendFileSync(tempFile, `${key}\n`, 'utf8');
  } catch (error) {
    // If temp file doesn't exist yet, create it
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        fs.writeFileSync(tempFile, `${key}\n`, 'utf8');
      } catch (writeError) {
        // Ignore write errors - Set will still work in main process
        logger.debug(`Could not write to temp file: ${writeError}`);
      }
    }
  }
}

// Collect all keys from all temp files matching the pattern and add to Set
function collectKeysFromTempFiles(baseId: string): void {
  const tempDir = os.tmpdir();

  try {
    // Read all matching temp files
    // Pattern: jscodeshift-keys-{baseId}-{pid}.txt
    const files = fs.readdirSync(tempDir);
    const matchingFiles = files.filter(file => {
      // Match pattern: jscodeshift-keys-{baseId}-{pid}.txt
      const regex = new RegExp(`^jscodeshift-keys-${baseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+\\.txt$`);
      return regex.test(file);
    });

    let totalKeys = 0;
    for (const file of matchingFiles) {
      const filePath = path.join(tempDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Read all lines, filter out empty lines, and add to Set
        const keys = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        keys.forEach(key => updatedKeys.add(key));
        totalKeys += keys.length;
        // Clean up temp file
        fs.unlinkSync(filePath);
      } catch (error) {
        logger.warn(`Error reading temp file ${file}:`, error);
      }
    }

    if (matchingFiles.length > 0) {
      logger.debug(`Collected ${totalKeys} keys from ${matchingFiles.length} temp file(s)`);
    }
  } catch (error) {
    logger.warn('Error collecting keys from temp files:', error);
  }
}

// Load the English translations JSON file
function loadTranslations(forceReload = false): Record<string, string> {
  if (translationsCache && !forceReload) {
    return translationsCache;
  }
  try {
    const content = fs.readFileSync(LANG_FILE, 'utf8');
    translationsCache = JSON.parse(content);
    return translationsCache;
  } catch (error) {
    logger.error(`Error loading ${LANG_FILE}:`, error);
    process.exit(1);
  }
}

// Extract string value from a string literal node
function getStringValue(node: any): string | null {
  if (!node) {
    return null;
  }

  // Handle JSXExpressionContainer - unwrap to get the actual expression
  if (node.type === 'JSXExpressionContainer' && node.expression) {
    return getStringValue(node.expression);
  }

  if (node.type === 'StringLiteral') {
    // For string literals, prefer raw to preserve special characters like non-breaking spaces
    // Fall back to value if raw is not available
    if (node.raw) {
      // Remove quotes from raw value
      const raw = node.raw;
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        // Unescape the string (handle escape sequences)
        try {
          // Use JSON.parse to handle escape sequences properly
          return JSON.parse(raw);
        } catch {
          // If JSON.parse fails, try manual unescaping
          return raw.slice(1, -1).replace(/\\(.)/g, (_, char) => {
            const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"', "'": "'" };
            return escapes[char] ?? char;
          });
        }
      }
    }
    return node.value;
  }
  if (node.type === 'Literal' && typeof node.value === 'string') {
    // Try to get raw value to preserve special characters
    const raw = (node as any).raw || (node as any).extra?.raw;
    if (raw) {
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        try {
          return JSON.parse(raw);
        } catch {
          return raw.slice(1, -1).replace(/\\(.)/g, (_, char) => {
            const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"', "'": "'" };
            return escapes[char] ?? char;
          });
        }
      }
    }
    return node.value;
  }
  if (node.type === 'TemplateLiteral' && node.quasis && node.quasis.length > 0) {
    // For template literals, we can only extract if there are no expressions
    // (i.e., it's a simple template literal without JavaScript expressions)
    if (node.expressions && node.expressions.length > 0) {
      // Has JavaScript expressions - can't extract as simple string
      return null;
    }
    // No expressions - extract from quasis
    // Prefer raw over cooked to preserve special characters like non-breaking spaces
    if (node.quasis.length === 1) {
      const quasi = node.quasis[0];
      if (quasi.value) {
        return quasi.value.raw ?? quasi.value.cooked ?? null;
      }
      // Fallback: check if value is directly on quasi
      return quasi.raw ?? quasi.cooked ?? null;
    }
    // Multiple quasis but no expressions - concatenate them
    return node.quasis
      .map((quasi: any) => {
        if (quasi.value) {
          return quasi.value.raw ?? quasi.value.cooked ?? '';
        }
        return quasi.raw ?? quasi.cooked ?? '';
      })
      .join('');
  }
  return null;
}

// Get quote style from existing string literal (for preservation)
function getQuoteStyle(node: any): "'" | '"' {
  if (node.type === 'StringLiteral' || node.type === 'Literal') {
    const raw = node.raw || (node as any).extra?.raw || '';
    if (raw.startsWith("'")) {
      return "'";
    }
    if (raw.startsWith('"')) {
      return '"';
    }
  }
  return '"';
}

// Normalize string for comparison (handles non-breaking spaces, etc.)
function normalizeForComparison(str: string): string {
  // Replace non-breaking space (U+00A0) and other similar whitespace with regular space
  return str.replace(/\u00A0/g, ' ').replace(/[\u2000-\u200B\u202F\u205F\u3000]/g, ' ');
}

// Check if node is a template literal (without JavaScript expressions/interpolations)
function isTemplateLiteral(node: any): boolean {
  // Handle JSXExpressionContainer - check the inner expression
  if (node.type === 'JSXExpressionContainer' && node.expression) {
    return isTemplateLiteral(node.expression);
  }

  return (
    node.type === 'TemplateLiteral' &&
    node.quasis &&
    node.quasis.length > 0 &&
    (!node.expressions || node.expressions.length === 0)
  );
}

// Create a string literal or template literal based on the original node type
function createStringNode(j: API['jscodeshift'], value: string, originalNode: any): any {
  // If original was a template literal, preserve it as a template literal
  if (isTemplateLiteral(originalNode)) {
    // For a simple template literal with no expressions, tail must be true (it's the last element)
    return j.templateLiteral([j.templateElement({ raw: value, cooked: value }, true)], []);
  }

  // Otherwise create a string literal
  const quoteStyle = getQuoteStyle(originalNode);
  const newValue = j.stringLiteral(value);
  if (quoteStyle === "'") {
    (newValue as any).raw = `'${value.replace(/'/g, "\\'")}'`;
  }
  return newValue;
}

// Find id value in an array of attributes/properties
function findIdValue(attributes: any[]): string | null {
  for (const attr of attributes) {
    if (attr.type === 'JSXAttribute' && attr.name.name === 'id' && attr.value) {
      return getStringValue(attr.value);
    } else if (attr.type === 'ObjectProperty') {
      const key = attr.key;
      if ((key.type === 'Identifier' && key.name === 'id') || (key.type === 'StringLiteral' && key.value === 'id')) {
        return getStringValue(attr.value);
      }
    }
  }
  return null;
}

// Find defaultMessage in an array of attributes/properties, returns the attribute/property node
function findDefaultMessage(attributes: any[]): any {
  for (const attr of attributes) {
    if (attr.type === 'JSXAttribute' && attr.name.name === 'defaultMessage') {
      return attr;
    } else if (attr.type === 'ObjectProperty') {
      const key = attr.key;
      if (
        (key.type === 'Identifier' && key.name === 'defaultMessage') ||
        (key.type === 'StringLiteral' && key.value === 'defaultMessage')
      ) {
        return attr;
      }
    }
  }
  return null;
}

// Transform FormattedMessage JSX components
function transformFormattedMessage(
  j: API['jscodeshift'],
  root: any,
  translations: Record<string, string>,
  filePath: string,
): number {
  let changes = 0;

  root.find(j.JSXElement).forEach(path => {
    const element = path.value;
    if (
      element.openingElement.name.type !== 'JSXIdentifier' ||
      element.openingElement.name.name !== 'FormattedMessage'
    ) {
      return;
    }

    const attributes = element.openingElement.attributes || [];
    const id = findIdValue(attributes);
    if (!id || !translations[id]) {
      return;
    }

    const expectedMessage = translations[id];
    const defaultMessageAttr = findDefaultMessage(attributes);

    if (defaultMessageAttr) {
      const currentValue = getStringValue(defaultMessageAttr.value);
      // Use normalized comparison to detect semantic differences while preserving formatting
      const normalizedCurrent = normalizeForComparison(currentValue || '');
      const normalizedExpected = normalizeForComparison(expectedMessage);
      if (normalizedCurrent !== normalizedExpected) {
        // Replace the value directly, preserving template literal format if original was one
        const newValue = createStringNode(j, expectedMessage, defaultMessageAttr.value);
        defaultMessageAttr.value = newValue;
        logger.debug(
          `[FormattedMessage] ${filePath}: Updated "${id}"\n  Old: "${currentValue}"\n  New: "${expectedMessage}"`,
        );
        addUpdatedKey(id);
        changes++;
      }
    } else {
      // Add defaultMessage if missing
      const quoteStyle = attributes.length > 0 && attributes[0].value ? getQuoteStyle(attributes[0].value) : '"';
      const newValue = j.stringLiteral(expectedMessage);
      if (quoteStyle === "'") {
        (newValue as any).raw = `'${expectedMessage.replace(/'/g, "\\'")}'`;
      }
      const newAttr = j.jsxAttribute(j.jsxIdentifier('defaultMessage'), newValue);
      element.openingElement.attributes = [...attributes, newAttr];
      logger.info(`[FormattedMessage] ${filePath}: Added defaultMessage for "${id}": "${expectedMessage}"`);
      addUpdatedKey(id);
      changes++;
    }
  });

  return changes;
}

// Transform intl.formatMessage calls
function transformFormatMessage(
  j: API['jscodeshift'],
  root: any,
  translations: Record<string, string>,
  filePath: string,
): number {
  let changes = 0;

  root.find(j.CallExpression).forEach(path => {
    const callExpr = path.value;
    if (
      callExpr.callee.type !== 'MemberExpression' ||
      callExpr.callee.property.type !== 'Identifier' ||
      callExpr.callee.property.name !== 'formatMessage'
    ) {
      return;
    }

    if (callExpr.arguments.length === 0 || callExpr.arguments[0].type !== 'ObjectExpression') {
      return;
    }

    const objExpr = callExpr.arguments[0];
    const properties = objExpr.properties || [];
    const id = findIdValue(properties);
    if (!id || !translations[id]) {
      return;
    }

    const expectedMessage = translations[id];
    const defaultMessageProp = findDefaultMessage(properties);

    if (defaultMessageProp) {
      const currentValue = getStringValue(defaultMessageProp.value);
      // Use normalized comparison to detect semantic differences while preserving formatting
      const normalizedCurrent = normalizeForComparison(currentValue || '');
      const normalizedExpected = normalizeForComparison(expectedMessage);
      if (normalizedCurrent !== normalizedExpected) {
        // Replace the value directly, preserving template literal format if original was one
        const newValue = createStringNode(j, expectedMessage, defaultMessageProp.value);
        defaultMessageProp.value = newValue;
        logger.debug(
          `[intl.formatMessage] ${filePath}: Updated "${id}"\n  Old: "${currentValue}"\n  New: "${expectedMessage}"`,
        );
        addUpdatedKey(id);
        changes++;
      }
    } else {
      // Add defaultMessage if missing
      const quoteStyle = properties.length > 0 && properties[0].value ? getQuoteStyle(properties[0].value) : '"';
      const newProp = j.objectProperty(j.identifier('defaultMessage'), j.stringLiteral(expectedMessage));
      if (quoteStyle === "'") {
        (newProp.value as any).raw = `'${expectedMessage.replace(/'/g, "\\'")}'`;
      }
      objExpr.properties = [...properties, newProp];
      logger.info(`[intl.formatMessage] ${filePath}: Added defaultMessage for "${id}": "${expectedMessage}"`);
      addUpdatedKey(id);
      changes++;
    }
  });

  return changes;
}

// Transform defineMessage calls
function transformDefineMessage(
  j: API['jscodeshift'],
  root: any,
  translations: Record<string, string>,
  filePath: string,
): number {
  let changes = 0;

  root.find(j.CallExpression).forEach(path => {
    const callExpr = path.value;
    if (callExpr.callee.type !== 'Identifier' || callExpr.callee.name !== 'defineMessage') {
      return;
    }

    if (callExpr.arguments.length === 0 || callExpr.arguments[0].type !== 'ObjectExpression') {
      return;
    }

    const objExpr = callExpr.arguments[0];
    const properties = objExpr.properties || [];
    const id = findIdValue(properties);
    if (!id || !translations[id]) {
      return;
    }

    const expectedMessage = translations[id];
    const defaultMessageProp = findDefaultMessage(properties);

    if (defaultMessageProp) {
      const currentValue = getStringValue(defaultMessageProp.value);
      // Use normalized comparison to detect semantic differences while preserving formatting
      const normalizedCurrent = normalizeForComparison(currentValue || '');
      const normalizedExpected = normalizeForComparison(expectedMessage);
      if (normalizedCurrent !== normalizedExpected) {
        // Replace the value directly, preserving template literal format if original was one
        const newValue = createStringNode(j, expectedMessage, defaultMessageProp.value);
        defaultMessageProp.value = newValue;
        logger.debug(
          `[defineMessage] ${filePath}: Updated "${id}"\n  Old: "${currentValue}"\n  New: "${expectedMessage}"`,
        );
        addUpdatedKey(id);
        changes++;
      }
    } else {
      // Add defaultMessage if missing
      const quoteStyle = properties.length > 0 && properties[0].value ? getQuoteStyle(properties[0].value) : '"';
      const newProp = j.objectProperty(j.identifier('defaultMessage'), j.stringLiteral(expectedMessage));
      if (quoteStyle === "'") {
        (newProp.value as any).raw = `'${expectedMessage.replace(/'/g, "\\'")}'`;
      }
      objExpr.properties = [...properties, newProp];
      logger.info(`[defineMessage] ${filePath}: Added defaultMessage for "${id}": "${expectedMessage}"`);
      addUpdatedKey(id);
      changes++;
    }
  });

  return changes;
}

// Transform defineMessages calls (nested objects)
function transformDefineMessages(
  j: API['jscodeshift'],
  root: any,
  translations: Record<string, string>,
  filePath: string,
): number {
  let changes = 0;

  root.find(j.CallExpression).forEach(path => {
    const callExpr = path.value;
    if (callExpr.callee.type !== 'Identifier' || callExpr.callee.name !== 'defineMessages') {
      return;
    }

    if (callExpr.arguments.length === 0 || callExpr.arguments[0].type !== 'ObjectExpression') {
      return;
    }

    const objExpr = callExpr.arguments[0];
    const properties = objExpr.properties || [];

    properties.forEach((prop: any) => {
      if (prop.value.type !== 'ObjectExpression') {
        return;
      }

      const nestedProperties = prop.value.properties || [];
      const id = findIdValue(nestedProperties);
      if (!id || !translations[id]) {
        return;
      }

      const expectedMessage = translations[id];
      const defaultMessageProp = findDefaultMessage(nestedProperties);

      if (defaultMessageProp) {
        const currentValue = getStringValue(defaultMessageProp.value);
        // Use normalized comparison to detect semantic differences while preserving formatting
        const normalizedCurrent = normalizeForComparison(currentValue || '');
        const normalizedExpected = normalizeForComparison(expectedMessage);
        if (normalizedCurrent !== normalizedExpected) {
          // Replace the value, preserving template literal format if original was one
          const newValue = createStringNode(j, expectedMessage, defaultMessageProp.value);
          defaultMessageProp.value = newValue;
          logger.debug(
            `[defineMessages] ${filePath}: Updated "${id}"\n  Old: "${currentValue}"\n  New: "${expectedMessage}"`,
          );
          addUpdatedKey(id);
          changes++;
        }
      } else {
        // Add defaultMessage if missing
        const quoteStyle =
          nestedProperties.length > 0 && nestedProperties[0].value ? getQuoteStyle(nestedProperties[0].value) : '"';
        const newProp = j.objectProperty(j.identifier('defaultMessage'), j.stringLiteral(expectedMessage));
        if (quoteStyle === "'") {
          (newProp.value as any).raw = `'${expectedMessage.replace(/'/g, "\\'")}'`;
        }
        prop.value.properties = [...nestedProperties, newProp];
        logger.info(`[defineMessages] ${filePath}: Added defaultMessage for "${id}": "${expectedMessage}"`);
        addUpdatedKey(id);
        changes++;
      }
    });
  });

  return changes;
}

// Main transform function
// ts-unused-exports:disable-next-line
export default function transformer(file: FileInfo, api: API, options: Options) {
  try {
    const j = api.jscodeshift;
    const root = j(file.source);

    // Load translations (cached after first load)
    const translations = loadTranslations();

    const filePath = file.path;
    let totalChanges = 0;
    totalChanges += transformFormattedMessage(j, root, translations, filePath);
    totalChanges += transformFormatMessage(j, root, translations, filePath);
    totalChanges += transformDefineMessage(j, root, translations, filePath);
    totalChanges += transformDefineMessages(j, root, translations, filePath);

    if (totalChanges > 0) {
      return root.toSource(options);
    }

    return null;
  } catch (error) {
    logger.error(`Error transforming ${file.path}:`, error);
    // Re-throw to let jscodeshift handle it
    throw error;
  }
}

// If run directly (not as a jscodeshift transform)
if (require.main === module) {
  const translations = loadTranslations();
  logger.info(`Loaded ${Object.keys(translations).length} translations from ${LANG_FILE}`);

  // Generate a unique base ID for this run
  // Each worker process will create its own temp file using this base ID + its process.pid
  const baseId = `${process.pid}-${Date.now()}`;

  // Set environment variable so worker processes can use the same base ID
  process.env.JSCODESHIFT_KEYS_BASE_ID = baseId;

  // Always process components, lib, and pages directories
  const paths = ['components', 'lib', 'pages'];

  const transformPath = __filename;
  const options = {
    extensions: 'js,jsx,ts,tsx',
    parser: 'tsx',
    dry: false,
    verbose: 1,
    ignorePattern: 'lib/graphql/types/**/*.ts',
  };

  jscodeshiftRun(transformPath, paths, options)
    .then((stats: any) => {
      logger.info('✓ Transform completed');

      // Collect keys from all temp files (each worker process wrote to its own file)
      collectKeysFromTempFiles(baseId);

      // Log stats structure for debugging
      logger.debug('jscodeshift stats object:', JSON.stringify(stats, null, 2));

      // Log any errors from jscodeshift
      // jscodeshift returns stats directly or nested, try both
      const statsData = stats?.stats || stats;
      if (statsData) {
        const { error = 0, ok = 0, nochange = 0, skip = 0 } = statsData;
        if (error > 0) {
          logger.warn(`jscodeshift completed with ${error} error(s). Check the output above for details.`);
        }
        logger.info(`jscodeshift stats: ${ok} ok, ${nochange} unmodified, ${skip} skipped, ${error || 0} errors`);
      }

      if (updatedKeys.size > 0) {
        logger.info(`Updated keys: ${Array.from(updatedKeys).join(', ')}`);
        const keysToRemove = Array.from(updatedKeys);
        const langDir = path.resolve(__dirname, '../../lang');

        // Remove keys from all language files
        const langFiles = fs.readdirSync(langDir).filter(file => file.endsWith('.json'));

        for (const langFile of langFiles) {
          const langFilePath = path.join(langDir, langFile);
          try {
            const content = fs.readFileSync(langFilePath, 'utf8');
            const translations = JSON.parse(content);
            const updatedTranslations = omit(translations, keysToRemove);

            // Write the updated translations back to the file
            fs.writeFileSync(langFilePath, `${JSON.stringify(updatedTranslations, null, 2)}\n`, 'utf8');
            logger.info(`Removed ${keysToRemove.length} keys from ${langFile}`);
          } catch (error) {
            logger.warn(`Error processing ${langFile}:`, error);
          }
        }

        // Run npm run build:lang to regenerate translations from components
        logger.info('Running npm run build:langs to regenerate translations...');
        try {
          execSync('npm run build:langs', { stdio: 'inherit', cwd: path.resolve(__dirname, '../..') });
          logger.info('✓ Translations regenerated successfully');
        } catch (error) {
          logger.error('Error running npm run build:langs:', error);
          process.exit(1);
        }
      } else {
        logger.info('No keys were updated, skipping cleanup');
      }
    })
    .catch((error: Error) => {
      logger.error('Error running transform:', error);
      // Clean up all temp files on error
      try {
        collectKeysFromTempFiles(baseId); // This will clean up the files
      } catch (cleanupError) {
        logger.warn('Error cleaning up temp files:', cleanupError);
      }
      process.exit(1);
    });
}
