## Base

Hello

```jsx
<ExpenseForm collective={{ currency: 'USD' }} onSubmit={console.log} />
```

## Mobile

```jsx
<div style={{ maxWidth: 375, minHeight: 500, resize: 'horizontal' }}>
  <ExpenseForm collective={{ currency: 'EUR' }} name="expense-type-mobile" onSubmit={console.log} />
</div>
```

## Edit

```jsx
<ExpenseForm
  onSubmit={console.log}
  collective={{ currency: 'USD' }}
  expense={{
    id: '1',
    type: 'RECEIPT',
    description: 'Food for the team retreat',
    attachments: [
      {
        id: '1',
        url: 'https://loremflickr.com/120/120/invoice?lock=1',
        description: 'Fancy restaurant',
        amount: 17500,
        incurredAt: '2020-01-01',
      },
      {
        id: '2',
        url: 'https://loremflickr.com/120/120/invoice?lock=2',
        description: 'Potatoes & cheese for the non-vegan raclette',
        amount: 3000,
        incurredAt: '2020-01-01',
      },
    ],
  }}
  payoutProfiles={[
    {
      id: '1',
      name: 'Frank Zappa',
      type: 'USER',
      slug: 'zappa',
      imageUrl: 'https://images-staging.opencollective.com/betree/34c2aa0/avatar.png',
    },
    {
      id: '2',
      name: 'Open Collective Inc',
      slug: 'opencollective',
      type: 'ORGANIZATION',
      imageUrl: 'https://images-staging.opencollective.com/opencollective/8c4448e/logo/256.png',
    },
  ]}
/>
```
