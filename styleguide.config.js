const path = require('path');
const fileExistsCaseInsensitive = require('react-styleguidist/scripts/utils/findFileCaseInsensitive');

module.exports = {
  assetsDir: 'styleguide',
  compilerConfig: {
    objectAssign: 'Object.assign',
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
      name: 'Atoms',
      components: 'src/components/Styled*.js',
      description: 'Base design atoms.',
    },
    {
      name: 'UI',
      content: 'styleguide/pages/UI.md',
      components: 'src/components/*.js',
      ignore: ['src/components/Contribute*.js', 'src/components/Styled*.js'],
    },
    {
      name: 'Contribution Flow',
      components: 'src/components/Contribute*.js',
      description: 'These components are used on the donate/contribute flow.',
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
    Wrapper: path.join(__dirname, 'styleguide/Wrapper'),
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
  webpackConfig: {
    resolve: { extensions: ['.js', '.json'] },
    stats: { children: false, chunks: false, modules: false, reasons: false },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: [{ loader: 'babel-loader', options: { cacheDirectory: true } }],
        },
      ],
    },
  },
};
