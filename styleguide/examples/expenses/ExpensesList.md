```jsx
import { expensesList } from '../../mocks/expenses-v2';
import { webpackCollective } from '../../mocks/collectives';
<ExpensesList collective={webpackCollective} expenses={expensesList} />;
```

### States

```jsx
import { expensesList } from '../../mocks/expenses-v2';
import { webpackCollective } from '../../mocks/collectives';
const [isLoading, setLoading] = React.useState(false);
const [isInverted, setInverted] = React.useState(false);
<div>
  <button onClick={() => setLoading(!isLoading)}>Toggle loading</button>
  <button onClick={() => setInverted(!isInverted)}>Toggle inverted</button>
  <br />
  <hr />
  <br />
  <ExpensesList collective={webpackCollective} expenses={expensesList} isLoading={isLoading} isInverted={isInverted} />
</div>;
```

### Empty

```jsx
<ExpensesList />
```
