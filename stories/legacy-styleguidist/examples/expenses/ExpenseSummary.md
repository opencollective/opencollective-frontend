## Invoice

```jsx
import { expenseReceipt } from '../../mocks/expenses-v2';
import { openSourceHost } from '../../mocks/collectives';
<ExpenseSummary host={openSourceHost} expense={expenseReceipt} />;
```

## Receipt

```jsx
import { expenseInvoice } from '../../mocks/expenses-v2';
import { openSourceHost } from '../../mocks/collectives';
<ExpenseSummary host={openSourceHost} expense={expenseInvoice} />;
```

## Loading

```jsx
import { expenseInvoice } from '../../mocks/expenses-v2';
import { openSourceHost } from '../../mocks/collectives';
const [isLoading, setLoading] = React.useState(true);
<div>
  <button onClick={() => setLoading(!isLoading)}>Toggle loading</button>
  <br />
  <hr />
  <br />
  <ExpenseSummary host={openSourceHost} expense={expenseInvoice} isLoading={isLoading} />
</div>;
```
