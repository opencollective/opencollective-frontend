/**
 * Define the languages that can be activated by users on Open Collective based
 * on https://crowdin.com/project/opencollective.
 *
 * Only languages completed with 20%+ are currently activated.
 *
 * See https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes for a list of language
 * codes with their native names.
 */

// Please keep English at the top, and sort other entries by `name`.
export default {
  en: { name: 'English', nativeName: 'English', completion: '100%' },
  'pt-BR': { name: 'Brazilian Portuguese', nativeName: 'Português brasileiro', completion: '71%' },
  ca: { name: 'Catalan', nativeName: 'Català', completion: '12%' },
  zh: { name: 'Chinese', nativeName: '中文', completion: '38%' },
  cs: { name: 'Czech', nativeName: 'čeština', completion: '17%' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '16%' },
  fr: { name: 'French', nativeName: 'Français', completion: '91%' },
  de: { name: 'German', nativeName: 'Deutsch', completion: '42%' },
  he: { name: 'Hebrew', nativeName: 'עברית', completion: '36%' },
  it: { name: 'Italian', nativeName: 'Italiano', completion: '20%' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '19%' },
  ko: { name: 'Korean', nativeName: '한국어', completion: '11%' },
  pl: { name: 'Polish', nativeName: 'Polski', completion: '53%' },
  pt: { name: 'Portuguese', nativeName: 'Português', completion: '12%' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '25%' },
  'sk-SK': { name: 'Slovak', nativeName: 'Slovensky', completion: '45%' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '91%' },
  'sv-SE': { name: 'Swedish', nativeName: 'Svenska', completion: '41%' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', completion: '33%' },
};
