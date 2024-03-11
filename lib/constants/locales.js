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
  'pt-BR': { name: 'Brazilian Portuguese', nativeName: 'Português brasileiro', completion: '65%' },
  ca: { name: 'Catalan', nativeName: 'Català', completion: '11%' },
  zh: { name: 'Chinese', nativeName: '中文', completion: '61%' },
  cs: { name: 'Czech', nativeName: 'čeština', completion: '28%' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '15%' },
  fr: { name: 'French', nativeName: 'Français', completion: '97%' },
  de: { name: 'German', nativeName: 'Deutsch', completion: '77%' },
  he: { name: 'Hebrew', nativeName: 'עברית', completion: '63%' },
  it: { name: 'Italian', nativeName: 'Italiano', completion: '28%' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '35%' },
  ko: { name: 'Korean', nativeName: '한국어', completion: '16%' },
  pl: { name: 'Polish', nativeName: 'Polski', completion: '84%' },
  pt: { name: 'Portuguese', nativeName: 'Português', completion: '19%' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '36%' },
  'sk-SK': { name: 'Slovak', nativeName: 'Slovensky', completion: '73%' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '98%' },
  'sv-SE': { name: 'Swedish', nativeName: 'Svenska', completion: '74%' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', completion: '56%' },
};
