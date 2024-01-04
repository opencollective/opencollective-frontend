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
  'pt-BR': { name: 'Brazilian Portuguese', nativeName: 'Português brasileiro', completion: '68%' },
  ca: { name: 'Catalan', nativeName: 'Català', completion: '11%' },
  zh: { name: 'Chinese', nativeName: '中文', completion: '63%' },
  cs: { name: 'Czech', nativeName: 'čeština', completion: '21%' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '10%' },
  fr: { name: 'French', nativeName: 'Français', completion: '96%' },
  de: { name: 'German', nativeName: 'Deutsch', completion: '80%' },
  he: { name: 'Hebrew', nativeName: 'עברית', completion: '66%' },
  it: { name: 'Italian', nativeName: 'Italiano', completion: '26%' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '36%' },
  ko: { name: 'Korean', nativeName: '한국어', completion: '17%' },
  pl: { name: 'Polish', nativeName: 'Polski', completion: '88%' },
  pt: { name: 'Portuguese', nativeName: 'Português', completion: '20%' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '36%' },
  'sk-SK': { name: 'Slovak', nativeName: 'Slovensky', completion: '76%' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '96%' },
  'sv-SE': { name: 'Swedish', nativeName: 'Svenska', completion: '77%' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', completion: '59%' },
};
