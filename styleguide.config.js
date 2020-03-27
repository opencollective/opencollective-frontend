const fs = require('fs');
const path = require('path');

// eslint-disable-next-line  node/no-unpublished-require
const { default: fileExistsCaseInsensitive } = require('react-styleguidist/lib/scripts/utils/findFileCaseInsensitive');

module.exports = {
  assetsDir: 'styleguide',
  require: [
    path.join(__dirname, 'public/static/styles/app.css'),
    path.join(__dirname, 'styleguide/static/styleguide.css'),
  ],
  getExampleFilename(componentPath) {
    const parsedPath = path.parse(componentPath);
    const parentDirName = parsedPath.dir.split('components/')[1] || '';
    const parentDirPath = path.join(__dirname, 'styleguide', 'examples', parentDirName);

    if (!fs.existsSync(parentDirPath)) {
      return false;
    }

    const examplePath = path.join(parentDirPath, `${parsedPath.name}.md`);
    return fileExistsCaseInsensitive(examplePath) || false;
  },
  pagePerSection: true,
  moduleAliases: {
    components: path.resolve(__dirname, 'components'),
  },
  sections: [
    {
      name: 'Home',
      content: 'styleguide/pages/index.md',
    },
    {
      name: 'Typography',
      content: 'styleguide/pages/typography.md',
      components: 'components/Text.js',
    },
    {
      name: 'Atoms',
      components: 'components/Styled*.js',
      description: 'Base design atoms.',
      sectionDepth: 1,
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
    {
      name: 'Master components',
      content: 'styleguide/pages/UI.md',
      components: ['components/*.js', 'components/faqs/*.js'],
      ignore: ['components/Contribute*.js', 'components/Styled*.js'],
      sectionDepth: 1,
    },
    {
      name: 'Projects',
      sectionDepth: 2,
      sections: [
        {
          name: 'Expenses',
          components: 'components/expenses/*.js',
          description: 'Expense flow',
        },
        {
          name: 'Collective Page',
          components: 'components/collective-page/*.js',
          description: 'These components are used collective page.',
        },
        {
          name: 'Contribution Flow',
          components: 'components/contribution-flow/*.js',
          description: 'These components are used on the donate/contribute flow.',
        },
      ],
    },
  ],
  skipComponentsWithoutExample: true,
  styleguideComponents: {
    Wrapper: path.join(__dirname, 'styleguide/Wrapper'),
  },
  styles: {
    Section: {
      fontSize: '14px',
    },
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
    optimization: {
      minimize: false, // See https://github.com/terser/terser/issues/567
    },
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
        // Configuration for images
        {
          test: /public\/.*\/images[\\/].*\.(jpg|gif|png)$/,
          use: {
            loader: 'file-loader',
            options: {
              publicPath: '/_next/static/images/',
              outputPath: 'static/images/',
              name: '[name]-[hash].[ext]',
              esModule: false,
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
