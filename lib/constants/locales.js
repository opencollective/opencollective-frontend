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
  ca: { name: 'Catalan', nativeName: 'Català', completion: '3%' },
  zh: { name: 'Chinese', nativeName: '中文', completion: '31%' },
  cs: { name: 'Czech', nativeName: 'čeština', completion: '11%' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '8%' },
  fr: { name: 'French', nativeName: 'Français', completion: '43%' },
  de: { name: 'German', nativeName: 'Deutsch', completion: '35%' },
  it: { name: 'Italian', nativeName: 'Italiano', completion: '27%' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '17%' },
  ko: { name: 'Korean', nativeName: '한국어', completion: '17%' },
  pl: { name: 'Polish', nativeName: 'Polski', completion: '14%' },
  pt: { name: 'Portuguese', nativeName: 'Português', completion: '26%' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '43%' },
  'sk-SK': { name: 'Slovak', nativeName: 'Slovensky', completion: '100%' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '97%' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', completion: '48%' },
};
