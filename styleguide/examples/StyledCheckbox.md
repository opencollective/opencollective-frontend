### Interactive

```js
initialState = { checked: false };
<StyledCheckbox
  checked={state.checked}
  onChange={checked => setState({ checked })}
  label={state.checked ? 'Checked' : 'Unchecked'}
/>;
```

### Normal

```js
<StyledCheckbox label="Unchecked" />
<br/>
<StyledCheckbox label="Checked" checked />
```

### Disabled

```js
<StyledCheckbox disabled label="Uncheckd" />
<br/>
<StyledCheckbox disabled checked label="Checked" />
```

### With custom sizes

```js
<StyledCheckbox label="A little bit bigger" size="20px" />
<br/>
<StyledCheckbox label="Wow" size="30px"/>
<br/>
<StyledCheckbox label="This is huge" size="50px" />
```
