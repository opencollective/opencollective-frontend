### Base

```jsx
const options = Array.from({ length: 50 }, (x, idx) => ({ label: `Option ${idx}`, value: idx }));

<StyledSelect options={options} />;
```

### Loading

```jsx
const options = Array.from({ length: 5 }, (x, idx) => ({ label: `Option ${idx}`, value: idx }));

<StyledSelect options={[]} isLoading />;
```

### Disabled

```jsx
const options = Array.from({ length: 5 }, (x, idx) => ({ label: `Option ${idx}`, value: idx }));

<StyledSelect options={[]} isDisabled />;
```
