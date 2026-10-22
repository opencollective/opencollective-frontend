import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';

/**
 * Invisible characters that machine translation tends to leak into strings (zero-width spaces,
 * soft hyphens, bidi controls, BOM...). Non-breaking spaces are deliberately allowed: French
 * typography relies on them.
 */
const HIDDEN_CHARACTERS_REGEX = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/gu;

const formatCodePoint = (char: string) => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

type MessageStructure = { arguments: Set<string>; tags: Set<string> };

function collectStructure(elements: MessageFormatElement[], structure: MessageStructure): MessageStructure {
  for (const element of elements) {
    switch (element.type) {
      case TYPE.argument:
      case TYPE.number:
      case TYPE.date:
      case TYPE.time:
        structure.arguments.add(element.value);
        break;
      case TYPE.select:
      case TYPE.plural:
        structure.arguments.add(element.value);
        Object.values(element.options).forEach(option => collectStructure(option.value, structure));
        break;
      case TYPE.tag:
        structure.tags.add(element.value);
        collectStructure(element.children, structure);
        break;
    }
  }

  return structure;
}

function parseStructure(message: string): MessageStructure {
  return collectStructure(parse(message), { arguments: new Set(), tags: new Set() });
}

const difference = (a: Set<string>, b: Set<string>) => [...a].filter(item => !b.has(item));

/**
 * Checks that a translation can safely replace its English source: it must parse as ICU,
 * keep the same placeholders and rich-text tags, and not add invisible characters.
 * Returns a list of human-readable problems (empty when valid).
 */
export function validateTranslation(english: string, translation: string): string[] {
  if (!translation.trim()) {
    return ['translation is empty'];
  }

  const errors: string[] = [];
  const hiddenCharacters = new Set(translation.match(HIDDEN_CHARACTERS_REGEX) ?? []);
  const unexpectedHidden = [...hiddenCharacters].filter(char => !english.includes(char));
  if (unexpectedHidden.length) {
    errors.push(`contains invisible characters: ${unexpectedHidden.map(formatCodePoint).join(', ')}`);
  }

  let source: MessageStructure;
  try {
    source = parseStructure(english);
  } catch {
    // English source is not valid ICU (should not happen); nothing to compare against.
    return errors;
  }

  let target: MessageStructure;
  try {
    target = parseStructure(translation);
  } catch (e) {
    errors.push(`invalid ICU message (${e.message})`);
    return errors;
  }

  const missingArguments = difference(source.arguments, target.arguments);
  const unknownArguments = difference(target.arguments, source.arguments);
  const missingTags = difference(source.tags, target.tags);
  const unknownTags = difference(target.tags, source.tags);
  if (missingArguments.length) {
    errors.push(`missing placeholders: ${missingArguments.map(name => `{${name}}`).join(', ')}`);
  }
  if (unknownArguments.length) {
    errors.push(`unknown placeholders: ${unknownArguments.map(name => `{${name}}`).join(', ')}`);
  }
  if (missingTags.length) {
    errors.push(`missing tags: ${missingTags.map(name => `<${name}>`).join(', ')}`);
  }
  if (unknownTags.length) {
    errors.push(`unknown tags: ${unknownTags.map(name => `<${name}>`).join(', ')}`);
  }

  return errors;
}
