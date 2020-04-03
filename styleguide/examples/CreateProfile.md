```js
const [action, setAction] = React.useState(null);
const [email, setEmail] = React.useState('');
<React.Fragment>
  <CreateProfile
    onPersonalSubmit={data => setAction(`Personal Create data: ${JSON.stringify(data)}`)}
    onOrgSubmit={data => setAction(`Org Create data: ${JSON.stringify(data)}`)}
    onSecondaryAction={() => setAction('Secondary action button was clicked!')}
    onEmailChange={setEmail}
    email={email}
  />
  {action && <p>{action}</p>}
</React.Fragment>;
```

Displays passed in errors:

```js
<CreateProfile errors={{ email: 'email already exists' }} />
```
