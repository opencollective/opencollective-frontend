"Sign In" button stays disabled until there is a value in the email input.

Uses the built-in browser email validation to block submission until valid.

### Base form

```js
const [action, setAction] = React.useState(null);
const [email, setEmail] = React.useState('');

<React.Fragment>
  <SignIn
    onSubmit={value => setAction(`The form was submitted with a value of ${value}`)}
    onSecondaryAction={() => setAction('Secondary action was clicked')}
    onEmailChange={setEmail}
    email={email}
  />
  <p>{action}</p>
</React.Fragment>;
```

### Loading / submitting

```js
<SignIn loading onSubmit={() => {}} onSecondaryAction={() => {}} email="test+betree@opencollective.com" />
```

### With an unknown email

```js
<SignIn onSubmit={() => {}} onSecondaryAction={() => {}} unknownEmail email="test+betree@opencollective.com" />
```
