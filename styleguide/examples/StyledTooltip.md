```jsx noeditor
// See https://github.com/styleguidist/react-styleguidist/issues/1278
import { Box, Flex } from '@rebass/grid';
import { P } from 'components/Text';
import { Info } from 'styled-icons/feather/Info';
```

```js
import { P } from 'components/Text';

const content = <P>Hello, I&apos;m a tooltip!</P>;

<StyledTooltip content={content}>
  {props => (
    <P {...props} display="inline">
      Hover, focus, or click on me
    </P>
  )}
</StyledTooltip>;
```

```js
import { P } from 'components/Text';
import { Info } from 'styled-icons/feather/Info';

const content = (
  <React.Fragment>
    <P fontWeight="bold" mb={2}>
      Example heading
    </P>
    <P fontSize="Caption" lineHeight="Caption">
      Example text. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
      et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat.
    </P>
  </React.Fragment>
);

<StyledTooltip content={content}>{props => <Info {...props} size={16} />}</StyledTooltip>;
```

```js
import { P } from 'components/Text';
import { Info } from 'styled-icons/feather/Info';
import { Flex } from '@rebass/grid';

const content = (
  <React.Fragment>
    <P fontWeight="bold" mb={2}>
      Example heading
    </P>
    <P fontSize="Caption" lineHeight="Caption">
      Example text. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
      et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat.
    </P>
  </React.Fragment>
);

<Flex justifyContent="flex-end">
  <StyledTooltip content={content}>{props => <Info {...props} size={16} />}</StyledTooltip>
</Flex>;
```
