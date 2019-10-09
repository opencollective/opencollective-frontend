/**
 * Define the languages that can be activated by users on Open Collective based
 * on https://crowdin.com/project/opencollective.
 *
 * Only languages completed with 20%+ are currently activated.
 */

// Please keep English at the top, and sort other entries by `completion`.
export default {
  en: { name: 'English' },
  fr: { name: 'French', nativeName: 'Français', completion: '87%' },
  pt: { name: 'Portuguese', nativeName: 'Português', completion: '37%' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '30%' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '27%' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '26%' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '25%' },
};
