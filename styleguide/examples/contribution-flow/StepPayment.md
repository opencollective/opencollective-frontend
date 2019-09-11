```jsx noeditor
// See https://github.com/styleguidist/react-styleguidist/issues/1278
import paymentMethods from '../../mocks/payment_methods';
import { personalProfile } from '../../mocks/profiles';
```

### With PayPal and Manual

```js
import paymentMethods from '../../mocks/payment_methods';
import { personalProfile } from '../../mocks/profiles';

initialState = { disabled: false, values: null };
<div>
  <StepPayment
    withPaypal
    collective={personalProfile}
    disabled={state.disabled}
    onChange={values => setState({ values })}
    paymentMethods={paymentMethods}
    manual={{
      title: 'Bank transfer',
      instructions:
        'Please make a bank transfer for the amount of $42.00 to the bank account: IBAN: BE11 4242 4242 4242 with the following communication: "fzappa order 125238". Please note that it will take a few days to process your payment.',
    }}
  />
  <br />
  <br />
  <button onClick={() => setState({ disabled: !state.disabled })}>{state.disabled ? 'Enable' : 'Disable'}</button>
  <hr />
  <br />
  <label>State</label>
  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(state.values, null, 2)}</pre>
</div>;
```
