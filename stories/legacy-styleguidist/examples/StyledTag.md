### Types

- Default

```jsx
<StyledTag>Hello World</StyledTag>
```

- Info

```jsx
<StyledTag type="info">Hello World</StyledTag>
```

- Dark

```jsx
<StyledTag type="dark">Hello World</StyledTag>
```

- Success

```jsx
<StyledTag type="success">Hello World</StyledTag>
```

- Warning

```jsx
<StyledTag type="warning">Hello World</StyledTag>
```

- Error

```jsx
<StyledTag type="error">Hello World</StyledTag>
```

### With close button

```jsx
<StyledTag closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="info" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="dark" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="success" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="warning" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="error" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>
```

### Rounded variant

```jsx
import styled from 'styled-components';
import { PriceTags } from '@styled-icons/icomoon/PriceTags';

const TagIcon = styled(PriceTags)`
  margin-right: 4px;
`;

<>
  <StyledTag variant="rounded-left" type="dark">
    Receipt
  </StyledTag>{' '}
  <StyledTag variant="rounded-right">open source</StyledTag> <StyledTag variant="rounded-right">design</StyledTag>{' '}
  <StyledTag variant="rounded-right">system</StyledTag>{' '}
  <StyledTag variant="rounded-right" closeButtonProps={{ onClick: console.log }}>
    removable
  </StyledTag>{' '}
  <StyledTag variant="rounded-right" type="white" border="1px dashed #C4C7CC">
    <TagIcon size="10px" /> Edit Tags
  </StyledTag>
  <StyledTag variant="rounded">rounded</StyledTag>{' '}
</>;
```
