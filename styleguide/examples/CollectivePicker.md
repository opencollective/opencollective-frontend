## Default

```jsx
import { randomCollectivesList } from '../mocks/collectives';
<CollectivePicker collectives={randomCollectivesList} />;
```

# With custom `StyledSelect` options

> Because this component relies on [StyledSelect](#!/StyledSelect), we can pass all the options
> accepted by [react-select](https://react-select.com/props).

### Allow multi

```jsx
import { randomCollectivesList } from '../mocks/collectives';
<CollectivePicker collectives={randomCollectivesList} isMulti />;
```

### Custom placeholder

```jsx
<CollectivePicker placeholder="Pick a collective to destroy" />
```

### Creatable

```jsx
<CollectivePicker creatable />
```

### Async

This is just to demonstrate how the component can be used asynchronously. Prefer
using `CollectivePickerAsync` to automatically load collectives from API.

```jsx
import { randomCollectivesList } from '../mocks/collectives';
const searchCollectives = search => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(randomCollectivesList.filter(({ name }) => name.includes(search)));
    }, 1000);
  });
};
const [collectives, setCollectives] = React.useState([]);
const [loading, setLoading] = React.useState(false);
<CollectivePicker
  isLoading={loading}
  collectives={collectives}
  onInputChange={(search, { action }) => {
    if (action !== 'input-change') {
      return;
    }
    setLoading(true);
    searchCollectives(search).then(collectives => {
      setCollectives(collectives);
      setLoading(false);
    });
  }}
/>;
```
