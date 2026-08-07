/**
 * Define the languages that can be activated by users on Open Collective.
 *
 * Only languages completed with 20%+ are currently activated.
 *
 * See https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes for a list of language
 * codes with their native names.
 */

// Please keep English at the top, and sort other entries by `name`.
export default {
  en: { name: 'English', nativeName: 'English', completion: '100%' },
  'pt-BR': { name: 'Brazilian Portuguese', nativeName: 'Português brasileiro', completion: '87%' },
  ca: { name: 'Catalan', nativeName: 'Català', completion: '14%' },
  zh: { name: 'Chinese', nativeName: '中文', completion: '49%' },
  cs: { name: 'Czech', nativeName: 'čeština', completion: '20%' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '31%' },
  fr: { name: 'French', nativeName: 'Français', completion: '100%' },
  de: { name: 'German', nativeName: 'Deutsch', completion: '42%' },
  he: { name: 'Hebrew', nativeName: 'עברית', completion: '37%' },
  it: { name: 'Italian', nativeName: 'Italiano', completion: '26%' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '22%' },
  ko: { name: 'Korean', nativeName: '한국어', completion: '15%' },
  pl: { name: 'Polish', nativeName: 'Polski', completion: '54%' },
  pt: { name: 'Portuguese', nativeName: 'Português', completion: '15%' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '29%' },
  'sk-SK': { name: 'Slovak', nativeName: 'Slovensky', completion: '44%' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '88%' },
  'sv-SE': { name: 'Swedish', nativeName: 'Svenska', completion: '47%' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', completion: '38%' },
};
