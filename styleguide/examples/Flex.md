[See `@rebass/grid` docs for more info](https://www.npmjs.com/package/@rebass/grid#flex)

The `<Flex />` component extends the `<Box />` with `display: flex` on by default;

```js
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { P } from 'components/Text';

const Block = styled(Box)`
  border: 1px solid black;
`;

<Flex>
  <Block width={1} p={2}>
    <P>width: 100%;</P>
  </Block>
  <Block width={1} p={2}>
    <P>width: 100%;</P>
  </Block>
</Flex>;
```

Use any of the flexbox style props: `alignItems`, `justifyContent`, `flexDirection`, `flexWrap`:

```js
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { P } from 'components/Text';

const Block = styled(Box)`
  border: 1px solid black;
`;

<React.Fragment>
  <P>flexDirection: column</P>
  <Flex flexDirection="column" mb={5}>
    <Block width={1} p={2}>
      <P>width: 100%;</P>
    </Block>
    <Block width={1} p={2}>
      <P>width: 100%;</P>
    </Block>
  </Flex>

  <P>flexWrap: wrap</P>
  <Flex flexWrap="wrap" mb={5}>
    <Block width={1 / 2} p={2}>
      <P>width: 25%;</P>
    </Block>
    <Block width={1 / 2} p={2}>
      <P>width: 25%;</P>
    </Block>
    <Block width={1 / 2} p={2}>
      <P>width: 25%;</P>
    </Block>
    <Block width={1 / 2} p={2}>
      <P>width: 25%;</P>
    </Block>
  </Flex>

  <P>alignItems: center</P>
  <Flex alignItems="center" mb={5}>
    <Block width={1 / 2} p={4}>
      <P>width: 25%; padding: 32px;</P>
    </Block>
    <Block width={1 / 2} p={2}>
      <P>width: 25%;</P>
    </Block>
  </Flex>

  <P>justifyContent: space-between</P>
  <Flex justifyContent="space-between">
    <Block width={1 / 4} p={2}>
      <P>width: 25%;</P>
    </Block>
    <Block width={1 / 4} p={2}>
      <P>width: 25%;</P>
    </Block>
  </Flex>
</React.Fragment>;
```
