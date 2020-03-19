### Default styling example with changing state

```js
const [selected, setSelected] = React.useState(null);
<StyledButtonSet items={['hello', 'world', 'wow']} selected={selected} onChange={setSelected}>
  {({ item }) => item}
</StyledButtonSet>;
```

### Using links inside of buttons

This is just an example. The way you style the links is completely up to you.

You can use [StyledLink](#styledlink) for standard styles.

```js
<StyledButtonSet items={['ok', 'amazing', 'wow']} buttonProps={{ p: 0 }} selected="hello">
  {({ item }) => (
    <a target="_BLANK" style={{ padding: '0.75em 1em', display: 'block' }} href={`https://opencollective.com/${item}`}>
      Open Collective is {item}
    </a>
  )}
</StyledButtonSet>
```
