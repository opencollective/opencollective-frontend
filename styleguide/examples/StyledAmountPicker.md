### Base

```jsx
const [value, setValue] = React.useState(5000);
<StyledAmountPicker currency="USD" presets={[500, 5000, 10000, 50000]} value={value} onChange={setValue} />;
```

```jsx
const [value, setValue] = React.useState(5000);
<StyledAmountPicker currency="EUR" presets={[500, 5000, 10000, 50000]} value={value} onChange={setValue} />;
```

### With a min amount

```jsx
const [value, setValue] = React.useState(5000);
<StyledAmountPicker currency="USD" presets={[500, 5000, 10000, 50000]} value={value} onChange={setValue} min={500} />;
```

### Without presets

```jsx
const [value, setValue] = React.useState(5000);
<StyledAmountPicker currency="USD" value={value} onChange={setValue} />;
```
