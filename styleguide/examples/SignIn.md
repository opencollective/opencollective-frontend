"Sign In" button stays disabled until there is a value in the email input.

Uses the built-in browser email validation to block submission until valid.

### Base form

```js
initialState = { action: null };

<React.Fragment>
  <SignIn
    onSubmit={value => setState({ action: `The form was submitted with a value of ${value}` })}
    onSecondaryAction={() => setState({ action: 'Secondary action was clicked' })}
  />
  <p>{state.action}</p>
</React.Fragment>;
```

### Loading / submitting

```js
<SignIn loading onSubmit={() => {}} onSecondaryAction={() => {}} />
```

### With an unknown email

```js
<SignIn onSubmit={() => {}} onSecondaryAction={() => {}} unkownEmail />
```
