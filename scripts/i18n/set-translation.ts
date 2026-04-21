import * as fs from 'fs';
import * as path from 'path';

const LANG_DIR = path.resolve(__dirname, '../../lang');

function normalizeLocale(arg: string): string {
  return arg.replace(/\.json$/i, '');
}

function loadJson(filePath: string): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as Record<string, string>;
}

function writeLocaleFile(filePath: string, data: Record<string, string>): void {
  // Preserve key order from the parsed file (insertion order) to minimize diffs.
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: tsx scripts/i18n/set-translation.ts <locale> <id> <translation...>');
    console.error('Example: tsx scripts/i18n/set-translation.ts fr +1HAHt "URL du profil"');
    process.exit(1);
  }

  const locale = normalizeLocale(args[0]);
  const id = args[1];
  const translation = args.slice(2).join(' ');

  const localePath = path.join(LANG_DIR, `${locale}.json`);
  if (!fs.existsSync(localePath)) {
    console.error(`Locale file not found: ${localePath}`);
    process.exit(1);
  }

  const data = loadJson(localePath);
  data[id] = translation;
  writeLocaleFile(localePath, data);
}

main();
