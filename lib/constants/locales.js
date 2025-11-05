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
  'pt-BR': { name: 'Brazilian Portuguese', nativeName: 'Português brasileiro', completion: '86%' },
  ca: { name: 'Catalan', nativeName: 'Català', completion: '14%' },
  zh: { name: 'Chinese', nativeName: '中文', completion: '46%' },
  cs: { name: 'Czech', nativeName: 'čeština', completion: '20%' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '18%' },
  fr: { name: 'French', nativeName: 'Français', completion: '97%' },
  de: { name: 'German', nativeName: 'Deutsch', completion: '53%' },
  he: { name: 'Hebrew', nativeName: 'עברית', completion: '45%' },
  it: { name: 'Italian', nativeName: 'Italiano', completion: '23%' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '26%' },
  ko: { name: 'Korean', nativeName: '한국어', completion: '13%' },
  pl: { name: 'Polish', nativeName: 'Polski', completion: '65%' },
  pt: { name: 'Portuguese', nativeName: 'Português', completion: '14%' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '31%' },
  'sk-SK': { name: 'Slovak', nativeName: 'Slovensky', completion: '56%' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '97%' },
  'sv-SE': { name: 'Swedish', nativeName: 'Svenska', completion: '52%' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', completion: '41%' },
};
