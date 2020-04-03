## New payout method

### PayPal

```jsx
import { Formik } from 'formik';
import { validatePayoutMethod } from 'components/expenses/PayoutMethodForm';
<Formik validate={validatePayoutMethod} initialValues={{ type: 'PAYPAL', data: { email: '' } }}>
  {({ values, setValues, errors }) => <PayoutMethodForm payoutMethod={values} onChange={setValues} errors={errors} />}
</Formik>;
```

### Other

```jsx
import { Formik } from 'formik';
import { validatePayoutMethod } from 'components/expenses/PayoutMethodForm';
<Formik validate={validatePayoutMethod} initialValues={{ type: 'OTHER', data: { content: '' } }}>
  {({ values, setValues, errors }) => <PayoutMethodForm payoutMethod={values} onChange={setValues} errors={errors} />}
</Formik>;
```

## Edit Payout method

### PayPal

```jsx
import { Formik } from 'formik';
import { validatePayoutMethod } from 'components/expenses/PayoutMethodForm';
import { payoutMethodPaypal } from '../../mocks/payout-methods';
<Formik validate={validatePayoutMethod} initialValues={payoutMethodPaypal}>
  {({ values, setValues, errors }) => <PayoutMethodForm payoutMethod={values} onChange={setValues} errors={errors} />}
</Formik>;
```

### Other

```jsx
import { Formik } from 'formik';
import { validatePayoutMethod } from 'components/expenses/PayoutMethodForm';
import { payoutMethodOther } from '../../mocks/payout-methods';
<Formik validate={validatePayoutMethod} initialValues={payoutMethodOther}>
  {({ values, setValues, errors }) => <PayoutMethodForm payoutMethod={values} onChange={setValues} errors={errors} />}
</Formik>;
```
