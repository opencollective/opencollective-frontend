### Base

```jsx
const [value, setValue] = React.useState(['open', 'source', 'rules']);
<StyledInputTags value={value} onChange={options => setValue(options.map(o => o.value))} />;
```

### With suggestions

```jsx
const [value, setValue] = React.useState([]);
<StyledInputTags
  suggestedTags={['blue', 'orange', 'yellow']}
  value={value}
  onChange={options => setValue(options.map(o => o.value))}
/>;
```
