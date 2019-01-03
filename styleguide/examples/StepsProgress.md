### Default styling

By default, component take the entire width of its container.

Following example has a resizable container.

```js
initialState = { focus: null };
<div style={{ resize: 'horizontal', padding: '15px', overflow: 'auto', width: '80%', maxWidth: '95%' }}>
  <StepsProgress
    steps={['BUY POTATOES', 'COOK POTATOES', 'EAT POTATOES']}
    focus={state.focus}
    onStepSelect={focus => setState({ focus })}
  >
    {({ step }) => <div style={{ textAlign: 'center' }}>{step}</div>}
  </StepsProgress>
</div>;
```

### Without labels

```js
initialState = { focus: null };
<StepsProgress steps={['a', 'b', 'c', 'd', 'e']} focus={state.focus} onStepSelect={focus => setState({ focus })} />;
```

### With disabled steps

```js
initialState = { focus: null };
<StepsProgress
  steps={['a', 'b', 'c', 'd', 'e']}
  disabledSteps={['c', 'd']}
  focus={state.focus}
  onStepSelect={focus => setState({ focus })}
/>;
```

### With a step loading

```js
initialState = { focus: null };
<StepsProgress
  steps={['a', 'b', 'c']}
  loadingStep="b"
  focus={state.focus}
  onStepSelect={focus => setState({ focus })}
/>;
```
