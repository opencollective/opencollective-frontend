```jsx noeditor
// See https://github.com/styleguidist/react-styleguidist/issues/1278
import { webpackContributors } from '../mocks/contributors';
```

This example doesn't have auto-resize, please use a desktop screen to review this component.

```jsx
import { webpackContributors } from '../mocks/contributors';
<ContributorsGrid contributors={webpackContributors} maxNbRowsForViewports={{ DESKTOP: 2, WIDESCREEN: 2 }} />;
```
