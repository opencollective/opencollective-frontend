### Base

```jsx
const [value, setValue] = React.useState(['OPEN', 'SOURCE', 'RULES']);
<StyledInputTags value={value} onChange={options => setValue(options.map(o => o.value))} />;
```

### With suggestions

```jsx
const [value, setValue] = React.useState([]);
<StyledInputTags
  suggestedTags={['BLUE', 'ORANGE', 'PINK']}
  value={value}
  onChange={options => setValue(options.map(o => o.value))}
/>;
```

### With renderUpdatedTags

```jsx
const [value, setValue] = React.useState([]);
<StyledInputTags value={value} onChange={options => setValue(options.map(o => o.value))} renderUpdatedTags />;
```
