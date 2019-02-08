### Default styling

By default, component take the entire width of its container.

Following example has a resizable container.

```js
initialState = { focus: null };
<div style={{ resize: 'horizontal', padding: '15px', overflow: 'auto', width: '80%', maxWidth: '95%' }}>
  <StepsProgress
    steps={[{ name: 'BUY POTATOES' }, { name: 'COOK POTATOES' }, { name: 'EAT POTATOES' }]}
    focus={state.focus}
    onStepSelect={focus => setState({ focus })}
  >
    {({ step }) => <div style={{ textAlign: 'center' }}>{step.name}</div>}
  </StepsProgress>
</div>;
```

### With disabled steps

```js
initialState = { focus: null };
<StepsProgress
  steps={[{ name: 'BUY POTATOES' }, { name: 'COOK POTATOES' }, { name: 'EAT POTATOES' }, { name: 'THEN START AGAIN' }]}
  disabledStepNames={['THEN START AGAIN']}
  focus={state.focus}
  onStepSelect={focus => setState({ focus })}
>
  {({ step }) => <div style={{ textAlign: 'center' }}>{step.name}</div>}
</StepsProgress>;
```

### With a step loading

```js
initialState = { focus: null };
<StepsProgress
  steps={[{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }, { name: 'e' }, { name: 'f' }]}
  loadingStep={{ name: 'c' }}
  focus={state.focus}
  onStepSelect={focus => setState({ focus })}
/>;
```

### All completed

```js
initialState = { focus: null };
<StepsProgress
  steps={[{ name: 'BUY POTATOES' }, { name: 'COOK POTATOES' }, { name: 'EAT POTATOES' }]}
  onStepSelect={focus => setState({ focus })}
  allCompleted
/>;
```
