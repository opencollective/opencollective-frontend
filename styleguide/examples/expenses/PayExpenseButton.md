## Base

### PayPal

```jsx
import { webpackCollective } from '../../mocks/collectives';
<PayExpenseButton
  onSubmit={console.log}
  expense={{ id: '1', amount: 4200, payoutMethod: { type: 'PAYPAL' } }}
  collective={webpackCollective}
/>;
```

### Transferwise

```jsx
import { webpackCollective } from '../../mocks/collectives';
<PayExpenseButton
  onSubmit={console.log}
  expense={{ id: '1', amount: 4200, payoutMethod: { type: 'BANK_ACCOUNT' } }}
  collective={webpackCollective}
/>;
```

### Other

```jsx
import { webpackCollective } from '../../mocks/collectives';
<PayExpenseButton
  onSubmit={console.log}
  expense={{ id: '1', amount: 4200, payoutMethod: { type: 'OTHER' } }}
  collective={webpackCollective}
/>;
```

## Disabled

### Manually

```jsx
import { webpackCollective } from '../../mocks/collectives';
<PayExpenseButton
  onSubmit={console.log}
  expense={{ id: '1', amount: 4200, payoutMethod: { type: 'PAYPAL' } }}
  collective={webpackCollective}
  disabled
/>;
```

### Not enough funds

```jsx
import { webpackCollective } from '../../mocks/collectives';
<PayExpenseButton
  onSubmit={console.log}
  expense={{ id: '1', amount: 4200, payoutMethod: { type: 'PAYPAL' }, amount: 10000 }}
  collective={{ ...webpackCollective, balance: 500 }}
/>;
```

### Transferwise limit reached

```jsx
import { webpackCollective } from '../../mocks/collectives';
<PayExpenseButton
  onSubmit={console.log}
  expense={{ id: '1', amount: 4200, payoutMethod: { type: 'BANK_ACCOUNT' } }}
  collective={{
    ...webpackCollective,
    host: {
      ...webpackCollective.host,
      plan: { transferwisePayoutsLimit: 1000, transferwisePayouts: 5000 },
    },
  }}
/>;
```
