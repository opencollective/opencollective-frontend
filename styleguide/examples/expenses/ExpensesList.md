```jsx
import { expensesList } from '../../mocks/expenses-v2';
import { webpackCollective } from '../../mocks/collectives';
<ExpensesList collective={webpackCollective} expenses={expensesList} />;
```

### Loading

```jsx
<ExpensesList isLoading />
```

### Empty

```jsx
<ExpensesList />
```
