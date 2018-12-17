### Normal

```js
initialState = { checked: false };
<StyledCheckbox
  checked={state.checked}
  onChange={checked => setState({ checked })}
  label={state.checked ? 'Checked' : 'Unchecked'}
/>;
```

### Disabled

```js
initialState = { checked: false };

<div>
  <StyledCheckbox disabled label="Unchecked" checked={state.checked} onChange={checked => setState({ checked })} />
  <br />
  <StyledCheckbox disabled checked label="Checked" />
</div>;
```

### With custom sizes

```js
initialState = { checked: false };

<div>
  <StyledCheckbox
    label="A little bit bigger"
    size="20px"
    checked={state.checked}
    onChange={checked => setState({ checked })}
  />
  <br />
  <StyledCheckbox label="Wow" size="30px" checked={state.checked} onChange={checked => setState({ checked })} />
  <br />
  <StyledCheckbox
    label="This is huge"
    size="50px"
    checked={state.checked}
    onChange={checked => setState({ checked })}
  />
</div>;
```
