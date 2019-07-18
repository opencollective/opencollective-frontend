const fs = require('fs');
const path = require('path');
const fileExistsCaseInsensitive = require('react-styleguidist/lib/scripts/utils/findFileCaseInsensitive');

module.exports = {
  assetsDir: 'styleguide',
  require: [path.join(__dirname, 'src/styles/app.css')],
  getExampleFilename(componentPath) {
    const parsedPath = path.parse(componentPath);
    const parentDirName = parsedPath.dir.split('src/components/')[1] || '';
    const parentDirPath = path.join(__dirname, 'styleguide', 'examples', parentDirName);

    if (!fs.existsSync(parentDirPath)) {
      return false;
    }

    const examplePath = path.join(parentDirPath, `${parsedPath.name}.md`);
    return fileExistsCaseInsensitive(examplePath) || false;
  },
  pagePerSection: true,
  moduleAliases: {
    components: path.resolve(__dirname, 'src/components'),
  },
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
      ignore: ['src/components/Contribute*.js', 'src/components/Styled*.js', 'src/components/collective-page/*.js'],
    },
    {
      name: 'Collective Page',
      components: 'src/components/collective-page/*.js',
      description: 'These components are used on the donate/contribute flow.',
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
        {
          test: /components\/.*\.(svg)$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 1000000,
            },
          },
        },
        {
          test: /\.(css)$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
  },
};
