### Normal

```js
initialState = { checked: false };
<StyledCheckbox
  checked={state.checked}
  onChange={({ checked }) => setState({ checked })}
  label={state.checked ? 'Checked' : 'Unchecked'}
/>;
```

### Disabled

```js
<div>
  <StyledCheckbox disabled label="Unchecked" defaultChecked={false} />
  <br />
  <StyledCheckbox disabled label="Checked" defaultChecked />
</div>
```

### Without label

```js
<StyledCheckbox />
```

### With custom sizes

```js
initialState = { checked: false };

<div>
  <StyledCheckbox
    label="A little bit bigger"
    size="20px"
    checked={state.checked}
    onChange={({ checked }) => setState({ checked })}
  />
  <br />
  <StyledCheckbox label="Wow" size="30px" checked={state.checked} onChange={({ checked }) => setState({ checked })} />
  <br />
  <StyledCheckbox
    label="This is huge"
    size="50px"
    checked={state.checked}
    onChange={({ checked }) => setState({ checked })}
  />
</div>;
```
