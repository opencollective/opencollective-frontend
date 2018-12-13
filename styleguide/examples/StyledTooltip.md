```js
const { P } = require('../../src/components/Text');

const content = (
  <P>Hello, I&apos;m a tooltip!</P>
);

<StyledTooltip content={content}>
  {props => <P {...props} display="inline">Hover, focus, or click on me</P>}
</StyledTooltip>
```

```js
const { P } = require('../../src/components/Text');
const { Info } = require('styled-icons/feather/Info.cjs');

const content = (
  <React.Fragment>
    <P fontWeight="bold"mb={2}>Example heading</P>
    <P fontSize="Caption" lineHeight="Caption">
      Example text. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    </P>
  </React.Fragment>
);

<StyledTooltip content={content}>
  {props => <Info {...props} size={16} />}
</StyledTooltip>
```

```js
const { P } = require('../../src/components/Text');
const { Info } = require('styled-icons/feather/Info.cjs');
const { Flex } = require('@rebass/grid');

const content = (
  <React.Fragment>
    <P fontWeight="bold"mb={2}>Example heading</P>
    <P fontSize="Caption" lineHeight="Caption">
      Example text. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    </P>
  </React.Fragment>
);

<Flex justifyContent="flex-end">
  <StyledTooltip content={content}>
    {props => <Info {...props} size={16} />}
  </StyledTooltip>
</Flex>
```
