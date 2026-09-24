const supportedLanguages = ['en'];

const languages = require.context('../../lang', false, /\.json$/i, 'weak');

languages.keys().forEach(element => {
  const match = element.match(/\.?\/?([^.]+)\.json$/);
  if (match) {
    supportedLanguages.push(match[1]);
  }
});

export default supportedLanguages;
