### Default styling

By default, component take the entire width of its container.

Following example has a resizable container.

```js
const [focus, setFocus] = React.useState(null)
<div style={{ resize: 'horizontal', padding: '15px', overflow: 'auto', width: '80%', maxWidth: '95%' }}>
  <StepsProgress
    steps={[{ name: 'BUY POTATOES' }, { name: 'COOK POTATOES' }, { name: 'EAT POTATOES' }]}
    focus={focus}
    onStepSelect={setFocus}
  >
    {({ step }) => <div style={{ textAlign: 'center' }}>{step.name}</div>}
  </StepsProgress>
</div>;
```

### With disabled steps

```js
const [focus, setFocus] = React.useState(null)
<StepsProgress
  steps={[{ name: 'BUY POTATOES' }, { name: 'COOK POTATOES' }, { name: 'EAT POTATOES' }, { name: 'THEN START AGAIN' }]}
  disabledStepNames={['THEN START AGAIN']}
  focus={focus}
  onStepSelect={setFocus}
>
  {({ step }) => <div style={{ textAlign: 'center' }}>{step.name}</div>}
</StepsProgress>;
```

### With a step loading

```js
const [focus, setFocus] = React.useState(null)
<StepsProgress
  steps={[{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }, { name: 'e' }, { name: 'f' }]}
  loadingStep={{ name: 'c' }}
  focus={focus}
  onStepSelect={setFocus}
/>;
```

### All completed

```js
const [focus, setFocus] = React.useState(null)
<StepsProgress
  steps={[{ name: 'BUY POTATOES' }, { name: 'COOK POTATOES' }, { name: 'EAT POTATOES' }]}
  onStepSelect={setFocus}
  allCompleted
/>;
```
