/**
 * Writes the GraphQL V2 operations of the frontend to a directory, one `.graphql` file per source file, for the
 * query cost report of the API (`npm run graphql:cost` in opencollective-api, see
 * opencollective/opencollective#9084). Also writes `variables.json`, the representative variables of
 * `scripts/config/graphql-cost-variables.ts`.
 *
 *     npx tsx scripts/extract-graphql-operations.ts <output directory> [frontend directory]
 *
 * The documents are loaded by graphql-codegen itself, with `scripts/config/graphql-codegen.ts`, so the report covers
 * exactly the operations that codegen types (the ones that ship). The frontend directory defaults to the current
 * one; passing another checkout extracts the operations of another revision, with its own codegen config.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

import type { CodegenConfig } from '@graphql-codegen/cli';
import { CodegenContext } from '@graphql-codegen/cli';
import { print } from 'graphql';

async function main(outputDir: string, frontendDir: string) {
  const root = path.resolve(frontendDir);
  const configPath = path.join(root, 'scripts/config/graphql-codegen.ts');
  const { default: config }: { default: CodegenConfig } = await import(pathToFileURL(configPath).href);
  const context = new CodegenContext({ config: { ...config, cwd: root } });
  const documents = await context.loadDocuments(config.documents, 'standard');

  // A file can produce several documents (one per tagged template)
  const byFile = new Map<string, string[]>();
  for (const { location, document } of documents) {
    const file = path.relative(root, location);
    byFile.set(file, [...(byFile.get(file) || []), print(document)]);
  }

  fs.rmSync(outputDir, { recursive: true, force: true });
  for (const [file, contents] of byFile) {
    const outputFile = path.join(outputDir, `${file}.graphql`);
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, `${contents.join('\n\n')}\n`);
  }

  // Older revisions may not declare representative variables
  const variablesPath = path.join(root, 'scripts/config/graphql-cost-variables.ts');
  const variables = fs.existsSync(variablesPath) ? (await import(pathToFileURL(variablesPath).href)).default : {};
  fs.writeFileSync(path.join(outputDir, 'variables.json'), JSON.stringify(variables, null, 2));

  console.log(`Wrote the GraphQL documents of ${byFile.size} files to ${outputDir}`);
}

if (!process.argv[2]) {
  console.error('Usage: tsx scripts/extract-graphql-operations.ts <output directory> [frontend directory]');
  process.exit(1);
}

main(process.argv[2], process.argv[3] || '.').catch(error => {
  console.error(error);
  process.exit(1);
});
