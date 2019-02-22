```js
initialState = { action: null };
<React.Fragment>
  <CreateProfile
    onPersonalSubmit={data => setState({ action: `Personal Create data: ${JSON.stringify(data)}` })}
    onOrgSubmit={data => setState({ action: `Org Create data: ${JSON.stringify(data)}` })}
    onSecondaryAction={() => setState({ action: 'Secondary action button was clicked!'})}
  />
  {state.action && <p>{state.action}</p>}
</React.Fragment>
```

Displays passed in errors:

```js
<CreateProfile errors={{ email: 'email already exists' }} />

```
