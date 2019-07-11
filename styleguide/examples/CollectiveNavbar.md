```jsx noeditor
// See https://github.com/styleguidist/react-styleguidist/issues/1278
import { webpackCollective, openSourceHost } from '../mocks/collectives';
```

```js
import { webpackCollective } from '../mocks/collectives';
initialState = { selected: 'contribute' };
<CollectiveNavbar
  collective={webpackCollective}
  selected={state.selected}
  onSectionClick={selected => setState({ selected })}
  LinkComponent={({ label }) => label}
/>;
```
