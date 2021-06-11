## Default

```jsx
import { webpackCollective } from '../mocks/collectives';
const [selected, setSelected] = React.useState('contribute');
<CollectiveNavbar collective={webpackCollective} selected={selected} onSectionClick={setSelected} />;
```

## Loading state

```jsx
<CollectiveNavbar isLoading />
```

## Customize CTAs

```jsx
import { webpackCollective } from '../mocks/collectives';
const [selected, setSelected] = React.useState('contribute');
<CollectiveNavbar
  collective={webpackCollective}
  selected={selected}
  onSectionClick={setSelected}
  callsToAction={{ hasContact: true, hasSubmitExpense: true }}
/>;
```
