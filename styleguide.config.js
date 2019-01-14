const { createConfig, babel, css } = require('webpack-blocks');
const path = require('path');
const fileExistsCaseInsensitive = require('react-styleguidist/scripts/utils/findFileCaseInsensitive');

module.exports = {
  assetsDir: 'styleguide',
  compilerConfig: {
    transforms: {
      dangerousTaggedTemplateString: true,
    },
  },
  getExampleFilename(componentPath) {
    const examplePath = path.join(__dirname, 'styleguide', 'examples', `${path.parse(componentPath).name}.md`);
    const existingFile = fileExistsCaseInsensitive(examplePath);
    if (existingFile) {
      return existingFile;
    }
    return false;
  },
  pagePerSection: true,
  sections: [
    {
      name: 'UI',
      content: 'styleguide/pages/UI.md',
      components: 'src/components/*.js',
    },
    {
      name: 'Grid',
      content: 'styleguide/pages/Grid.md',
      sections: [
        {
          name: 'Box',
          content: 'styleguide/examples/Box.md',
        },
        {
          name: 'Flex',
          content: 'styleguide/examples/Flex.md',
        },
      ],
    },
  ],
  skipComponentsWithoutExample: true,
  styleguideComponents: {
    Wrapper: path.join(__dirname, 'styleguide/ThemeWrapper'),
  },
  styles: {
    Blockquote: {
      blockquote: {
        borderLeft: '3px solid grey',
        margin: '16px 0',
        padding: '0 32px',
      },
    },
  },
  title: 'Open Collective Frontend Style Guide',
  usageMode: 'expand',
  webpackConfig: createConfig([babel()]),
};
