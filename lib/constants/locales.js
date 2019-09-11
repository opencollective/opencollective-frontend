/**
 * Define the languages that can be activated by users on Open Collective based
 * on https://crowdin.com/project/opencollective.
 *
 * Only languages completed with 20%+ are currently activated.
 */

// Please keep English at the top, and sort other entries by `completion`.
export default {
  en: { name: 'English' },
  fr: { name: 'French', nativeName: 'Français', completion: '80%' },
  es: { name: 'Spanish', nativeName: 'Español', completion: '32%' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', completion: '29%' },
  ja: { name: 'Japanese', nativeName: '日本語', completion: '25%' },
  ru: { name: 'Russian', nativeName: 'Русский', completion: '23%' },
};
