### Default styling example with changing state

```js
initialState = { selected: null };
<StyledButtonSet
  items={['hello', 'world', 'wow']}
  selected={state.selected}
  onChange={item => setState({ selected: item })}
>
  {({ item }) => item}
</StyledButtonSet>;
```

### Using links inside of buttons

This is just an exemple. The way you style the links is completely up to you.

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
