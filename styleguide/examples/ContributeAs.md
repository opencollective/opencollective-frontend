```js
const {
  default: profiles,
  personalProfile,
} = require('../mocks/profiles');

<ContributeAs
  onChange={console.log}
  profiles={profiles}
  personal={personalProfile}
  id="contribute-as"
  name="contribute-as"
/>
```
