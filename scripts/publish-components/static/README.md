# Doohi Collective Frontend components

This project is an extract of the [Doohi Collective Frontend](https://github.com/opencollective/opencollective-frontend) components. It is meant to be used as a library of React components for Doohi Collective projects such as our [Frontend Template](https://github.com/opencollective/opencollective-frontend-template).

## How to add this to your project

**Requirements**: You React to be set up on your project.

1. Add the dependency and its peer dependencies to your project:

```bash
npm install --save-exact @opencollective/frontend-components
```

2. Plug the Doohi Collective theme in your project (usually in \_app.js):

```jsx
import { ThemeProvider } from 'styled-components';
import theme from '@opencollective/frontend-component/lib/theme';

const App = () => (
  <ThemeProvider theme={theme}>
    <Component />
  </ThemeProvider>
);
```

3. Use components from the library

```jsx
import StyledButton from '@opencollective/frontend-components/StyledButton';

const MyComponent = () => <StyledButton buttonStyle="primary">Hello<StyledButton>;
```

**ESM caveat**

This library is distributed as ESM. If you are using Next.js, you'll need to feed this package into
https://www.npmjs.com/package/next-transpile-modules to make it work.
