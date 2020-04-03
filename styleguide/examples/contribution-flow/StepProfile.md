```js
import profiles, { personalProfile } from '../../mocks/profiles';
const [profile, setProfile] = React.useState(null);
<div style={{ display: 'flex', flexWrap: 'wrap' }}>
  <StepProfile
    onProfileChange={setProfile}
    otherProfiles={profiles}
    personalProfile={personalProfile}
    defaultSelectedProfile={profile || personalProfile}
    id="contribute-as"
    name="contribute-as"
  />
  <div style={{ margin: 24, maxWidth: 300 }}>
    <strong>State</strong>
    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(profile, null, 2)}</pre>
  </div>
</div>;
```
