With currency set to `EUR`:

```js
const [value, setValue] = React.useState(0);
const [isValid, setIsValid] = React.useState(true);
<div>
  <StyledInputAmount
    currency="EUR"
    onChange={(value, e) => {
      setValue(value);
      setIsValid(e.target.checkValidity());
    }}
  />
  <p>
    Value: {new String(value)}
    <br />
    Is Valid: {isValid ? 'Yes' : 'No'}
  </p>
</div>;
```

With min amount to `$10`:

```js
<StyledInputAmount currency="USD" min="10" onChange={value => console.log(value)} />
```

### Controlled

```js
const [value, setValue] = React.useState(0);
const [isValid, setIsValid] = React.useState(true);
<div>
  <StyledInputAmount
    currency="EUR"
    value={value}
    required
    onChange={(value, e) => {
      setValue(value);
      setIsValid(e.target.checkValidity());
    }}
  />
  <p>
    Value: {new String(value)}
    <br />
    Is Valid: {isValid ? 'Yes' : 'No'}
  </p>
</div>;
```
