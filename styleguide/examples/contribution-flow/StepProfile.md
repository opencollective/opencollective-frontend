```jsx noeditor
// See https://github.com/styleguidist/react-styleguidist/issues/1278
import profiles, { personalProfile } from '../../mocks/profiles';
```

```js
import profiles, { personalProfile } from '../../mocks/profiles';
initialState = null;
<div style={{ display: 'flex', flexWrap: 'wrap' }}>
  <StepProfile
    onProfileChange={setState}
    otherProfiles={profiles}
    personalProfile={personalProfile}
    defaultSelectedProfile={state || personalProfile}
    id="contribute-as"
    name="contribute-as"
  />
  <div style={{ margin: 24, maxWidth: 300 }}>
    <strong>State</strong>
    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(state, null, 2)}</pre>
  </div>
</div>;
```
