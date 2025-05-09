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
  'pt-BR': { name: 'Brazilian Portuguese', nativeName: 'Português brasileiro', completion: '62%' },
  ca: { name: 'Catalan', nativeName: 'Català', completion: '9%' },
  zh: { name: 'Chinese', nativeName: '中文', completion: '55%' },
  cs: { name: 'Czech', nativeName: 'čeština', completion: '24%' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '21%' },
  fr: { name: 'French', nativeName: 'Français', completion: '99%' },
  de: { name: 'German', nativeName: 'Deutsch', completion: '64%' },
  he: { name: 'Hebrew', nativeName: 'עברית', completion: '54%' },
  it: { name: 'Italian', nativeName: 'Italiano', completion: '24%' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '30%' },
  ko: { name: 'Korean', nativeName: '한국어', completion: '16%' },
  pl: { name: 'Polish', nativeName: 'Polski', completion: '69%' },
  pt: { name: 'Portuguese', nativeName: 'Português', completion: '16%' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '35%' },
  'sk-SK': { name: 'Slovak', nativeName: 'Slovensky', completion: '67%' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '99%' },
  'sv-SE': { name: 'Swedish', nativeName: 'Svenska', completion: '60%' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', completion: '49%' },
};
