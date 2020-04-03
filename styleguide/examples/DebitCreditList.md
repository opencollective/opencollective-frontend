```jsx
import DebitCreditList, { DebitItem, CreditItem } from 'components/DebitCreditList';

<DebitCreditList>
  {[1, 2, 3, 4, 5].map(i =>
    i % 2 === 0 ? (
      <CreditItem key={i}>
        <div style={{ height: 30 * (i + 1), display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          I'm {i}. I'm a credit!
        </div>
      </CreditItem>
    ) : (
      <DebitItem key={i}>
        <div style={{ height: 30 * (i + 1), display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          I'm {i}. I'm a debit!
        </div>
      </DebitItem>
    ),
  )}
</DebitCreditList>;
```
