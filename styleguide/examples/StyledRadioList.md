Default style:

```js
<StyledRadioList
  options={['one', 'two', 'three', 'four', 'five']}
  name="radiolist"
  id="radiolist"
  onChange={console.log}
/>
```

Using a default value:

```js
<StyledRadioList
  options={['one', 'two', 'three', 'four', 'five']}
  defaultValue="three"
  name="default-list"
  id="default-list"
  onChange={console.log}
/>
```

Customize list style using child render function:

```js
const { Box } = require('@rebass/grid');
<StyledRadioList
  options={['one', 'two', 'three', 'four', 'five']}
  name="selected-list"
  id="selected-list"
  onChange={console.log}
>
  {({ key, value, radio, checked }) => (
    <Box mb={2}>
      <Box as="span" mr={2}>
        {radio}
      </Box>{' '}
      {value} {checked && '(You picked me!)'}
    </Box>
  )}
</StyledRadioList>;
```

Advanced customization:

```js
import { Box, Flex } from '@rebass/grid';
import Container from 'components/Container';
import StyledInputField from 'components/StyledInputField';
import StyledCard from 'components/StyledCard';

const options = {
  hipsterbrown: {
    username: 'HipsterBrown',
    avatar: 'https://avatars0.githubusercontent.com/u/3051193?s=460&v=4',
  },
  betree: {
    username: 'Betree',
    avatar: 'https://avatars1.githubusercontent.com/u/1556356?s=460&v=4',
  },
  piamancini: {
    username: 'piamancini',
    avatar: 'https://avatars3.githubusercontent.com/u/3671070?s=460&v=4',
  },
  xdamman: {
    username: 'xdamman',
    avatar: 'https://avatars0.githubusercontent.com/u/74358?s=460&v=4',
  },
  marcogbarcellos: {
    username: 'marcogbarcellos',
    avatar: 'https://avatars0.githubusercontent.com/u/8717041?s=460&v=4',
  },
  znarf: {
    username: 'znarf',
    avatar: 'https://avatars3.githubusercontent.com/u/806?s=460&v=4',
  },
};

<StyledInputField label="Pick a profile" htmlFor="advanced-list">
  {fieldProps => (
    <StyledCard mx="auto" maxWidth={500}>
      <StyledRadioList {...fieldProps} options={options} onChange={console.log} keyGetter="username">
        {({ key, value, radio, checked, index }) => (
          <Container
            display="flex"
            alignItems="center"
            bg={checked ? 'primary.500' : 'white.full'}
            color={checked ? 'white.full' : 'black.800'}
            px={4}
            py={3}
            borderBottom="1px solid"
            borderColor="black.200"
          >
            <Box as="span" mr={3}>
              {radio}
            </Box>
            <img src={value.avatar} alt={value.username} height={14} />
            <Box as="span" ml={2}>
              {value.username}
            </Box>
          </Container>
        )}
      </StyledRadioList>
    </StyledCard>
  )}
</StyledInputField>;
```
