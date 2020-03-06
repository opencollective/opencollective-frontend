## Default

```jsx
import { webpackCollective } from '../mocks/collectives';
initialState = { selected: 'contribute' };
<CollectiveNavbar
  collective={webpackCollective}
  selected={state.selected}
  onSectionClick={selected => setState({ selected })}
/>;
```

## Loading state

```jsx
<CollectiveNavbar isLoading />
```

## Customize CTAs

```jsx
import { webpackCollective } from '../mocks/collectives';
initialState = { selected: 'contribute' };
<CollectiveNavbar
  collective={webpackCollective}
  selected={state.selected}
  onSectionClick={selected => setState({ selected })}
  callsToAction={{ hasContact: true, hasSubmitExpense: true }}
/>;
```
