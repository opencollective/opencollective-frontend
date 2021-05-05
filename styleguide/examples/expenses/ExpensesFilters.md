```jsx
import { webpackCollective } from '../../mocks/collectives';
const [filters, setFilters] = React.useState();
<div>
  <ExpensesFilters collective={webpackCollective} filters={filters} onChange={setFilters} />
  <hr />
  <code>{JSON.stringify(filters)}</code>
</div>;
```
