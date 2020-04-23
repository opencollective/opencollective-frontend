### Base

```jsx
<TemporaryNotification position="relative">Dismiss me if you dare!</TemporaryNotification>
```

### Usage with `DismissibleMessage`

```jsx
import DismissibleMessage from 'components/DismissibleMessage';

<DismissibleMessage messageId="styleguide-dismissible-temporary-notification" displayForLoggedOutUser>
  {({ dismiss }) => (
    <TemporaryNotification position="relative" onDismiss={dismiss}>
      There's no come back if you dissmiss me, it will be a permanent action. You're warned!
    </TemporaryNotification>
  )}
</DismissibleMessage>;
```
