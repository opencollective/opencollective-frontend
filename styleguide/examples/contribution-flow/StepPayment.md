### With PayPal and Manual

```js
import paymentMethods from '../../mocks/payment_methods';
import { personalProfile } from '../../mocks/profiles';

const [disabled, setDisabled] = React.useState(false);
const [values, setValues] = React.useState(null);
<div>
  <StepPayment
    withPaypal
    collective={personalProfile}
    disabled={disabled}
    onChange={setValues}
    paymentMethods={paymentMethods}
    manual={{
      title: 'Bank transfer',
      instructions:
        'Please make a bank transfer for the amount of $42.00 to the bank account: IBAN: BE11 4242 4242 4242 with the following communication: "fzappa order 125238". Please note that it will take a few days to process your payment.',
    }}
  />
  <br />
  <br />
  <button onClick={() => setDisabled(!disabled)}>{disabled ? 'Enable' : 'Disable'}</button>
  <hr />
  <br />
  <label>State</label>
  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(values, null, 2)}</pre>
</div>;
```
