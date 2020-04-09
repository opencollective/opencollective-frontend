## With files

### Initial state

#### Receipt type (file required)

```jsx
import { Formik, FieldArray } from 'formik';
<Formik initialValues={{ type: 'RECEIPT', currency: 'USD' }}>
  {() => <FieldArray name="items" component={ExpenseFormItems} />}
</Formik>;
```

#### Invoice type (file not required)

```jsx
import { Formik, FieldArray } from 'formik';
<Formik initialValues={{ type: 'INVOICE', currency: 'EUR' }}>
  {() => <FieldArray name="items" component={ExpenseFormItems} />}
</Formik>;
```

### With some items

```jsx
import { Formik, FieldArray } from 'formik';
<Formik
  initialValues={{
    type: 'RECEIPT',
    currency: 'USD',
    items: [
      { id: '1', url: 'https://loremflickr.com/120/120/invoice?lock=1', incurredAt: '2020-02-07' },
      { id: '2', url: 'https://loremflickr.com/120/120/invoice?lock=2', incurredAt: '2020-02-07' },
      { id: '3', url: 'https://loremflickr.com/120/120/invoice?lock=3', incurredAt: '2020-02-07' },
    ],
  }}
>
  {() => <FieldArray name="items" component={ExpenseFormItems} />}
</Formik>;
```

### With some items (mobile)

```jsx
import { Formik, FieldArray } from 'formik';
<div style={{ maxWidth: 375, resize: 'horizontal' }}>
  <Formik
    initialValues={{
      type: 'RECEIPT',
      currency: 'EUR',
      items: [
        { id: '1', url: 'https://loremflickr.com/120/120/invoice?lock=4', incurredAt: '2020-02-07' },
        { id: '2', url: 'https://loremflickr.com/120/120/invoice?lock=5', incurredAt: '2020-02-07' },
        { id: '3', url: 'https://loremflickr.com/120/120/invoice?lock=6', incurredAt: '2020-02-07' },
      ],
    }}
  >
    {() => <FieldArray name="items" component={ExpenseFormItems} />}
  </Formik>
  ;
</div>;
```
