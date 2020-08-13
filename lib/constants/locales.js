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
  en: { name: 'English', nativeName: 'English', completion: '100%', flag: '🇺🇸' },
  ca: { name: 'Catalan', nativeName: 'Català', completion: '28%', flag: '🇦🇩' },
  zh: { name: 'Chinese', nativeName: '中文', completion: '26%', flag: '🇨🇳' },
  cs: { name: 'Czech', nativeName: 'čeština', completion: '21%', flag: '🇨🇿' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '22%', flag: '🇨🇿' },
  fr: { name: 'French', nativeName: 'Français', completion: '100%', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', completion: '25%', flag: '🇩🇪' },
  it: { name: 'Italian', nativeName: 'Italiano', completion: '44%', flag: '🇮🇹' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '17%', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', completion: '22%', flag: '🇰🇷' },
  pt: { name: 'Portuguese', nativeName: 'Português', completion: '86%', flag: '🇵🇹' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '29%', flag: '🇷🇺' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '55%', flag: '🇪🇸' },
};
