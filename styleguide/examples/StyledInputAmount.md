With currency set to `EUR`:

```js
<StyledInputAmount currency="EUR" />
```

With min amount to `$10`:

```js
<StyledInputAmount currency="USD" min="10" />
```

## With `parseNumbers`

```js
const [value, setValue] = React.useState('');
<StyledInputAmount currency="USD" min="10" parseNumbers value={value} onChange={e => setValue(e.target.value)} />;
```
