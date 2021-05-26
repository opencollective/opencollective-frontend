## All buttons

```jsx
import { webpackCollective } from '../../mocks/collectives';
<ProcessExpenseButtons
  expense={{ legacyId: 42, amount: 4200 }}
  collective={webpackCollective}
  permissions={{
    canApprove: true,
    canUnapprove: true,
    canReject: true,
    canPay: true,
    canMarkAsUnpaid: true,
  }}
/>;
```

## Displayed buttons is based on the permissions

```jsx
import { webpackCollective } from '../../mocks/collectives';
<ProcessExpenseButtons
  expense={{ legacyId: 42, amount: 4200 }}
  collective={webpackCollective}
  permissions={{
    canApprove: true,
    canReject: true,
  }}
/>;
```
