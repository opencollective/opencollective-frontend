### Normal

```js
const [checked, setChecked] = React.useState(false);
<StyledCheckbox
  checked={checked}
  onChange={({ checked }) => setChecked(checked)}
  label={checked ? 'Checked' : 'Unchecked'}
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
const [checked, setChecked] = React.useState(false);

<div>
  <StyledCheckbox
    label="A little bit bigger"
    size="20px"
    checked={checked}
    onChange={({ checked }) => setChecked(checked)}
  />
  <br />
  <StyledCheckbox label="Wow" size="30px" checked={checked} onChange={({ checked }) => setChecked(checked)} />
  <br />
  <StyledCheckbox label="This is huge" size="50px" checked={checked} onChange={({ checked }) => setChecked(checked)} />
</div>;
```
