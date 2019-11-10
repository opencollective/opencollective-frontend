```jsx noeditor
// See https://github.com/styleguidist/react-styleguidist/issues/1278
import { Box } from '@rebass/grid';
import Move from 'styled-icons/boxicons-regular/Move';
import { Close } from 'styled-icons/material/Close';
import styled from 'styled-components';

import { webpackCollective } from '../mocks/collectives';
import StyledCard from 'components/StyledCard';
```

### default

```js
import { webpackCollective } from '../mocks/collectives';
import StyledCard from 'components/StyledCard';
initialState = {
  items: webpackCollective,
  itemsOrder: [],
};

<StyledDragDrop
  id={state.items.id}
  items={state.items.tiers}
  itemsOrder={state.itemsOrder}
  onShuffle={newItemsOrder => {}}
>
  {({ item, index }) => (
    <StyledCard display={'flex'} justifyContent="space-evenly" px={1} py={1} m={1} textAlign="center">
      <h2>ID: {item.id}</h2>
      <h2>Title: {item.name}</h2>
      <h2>Slug: {item.slug}</h2>
      <h3>Index: {index}</h3>
    </StyledCard>
  )}
</StyledDragDrop>;
```

### with options

```js
import { Move } from 'styled-icons/boxicons-regular/Move';
import { Close } from 'styled-icons/material/Close';
import styled from 'styled-components';

import { webpackCollective } from '../mocks/collectives';
import StyledCard from 'components/StyledCard';

initialState = {
  id: webpackCollective.id,
  items: webpackCollective.tiers,
  itemsOrder: [266, 267],
};

const Handle = styled.div`
  opacity: ${({ hide }) => (hide ? 0 : 1)};
  background-color: #484b4c;
  border-radius: 50%;
  margin-bottom: 5px;
  color: #ffffff;
  padding: 5px;
`;

<StyledDragDrop
  handle={true}
  id={state.id}
  items={state.items}
  itemsOrder={state.itemsOrder}
  onShuffle={newItemsOrder => setState({ itemsOrder: newItemsOrder })}
  direction="horizontal"
>
  {({ item, index, cssHelper, handleProps: { wrapper, dragProps, hideDuringDrag }, isDragging }) => (
    <React.Fragment>
      {wrapper(
        <Handle {...dragProps}>
          <Move size={15} />
        </Handle>,
        <Handle
          onClick={() => {
            const items = Array.from(state.items).filter(i => i.id !== item.id);
            setState({ items });
          }}
          hide={hideDuringDrag}
        >
          <Close size={15} />
        </Handle>,
      )}
      <StyledCard
        px={4}
        py={3}
        mx={1}
        maxWidth={500}
        css={cssHelper}
        style={{ backgroundColor: !isDragging ? '#FFFFFF' : '#75CC1F' }}
      >
        <h2>ID: {item.id}</h2>
        <h2>Title: {item.name}</h2>
        <h2>Slug: {item.slug}</h2>
        <h3>Index: {index}</h3>
      </StyledCard>
    </React.Fragment>
  )}
</StyledDragDrop>;
```
