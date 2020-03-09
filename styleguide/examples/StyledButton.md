## Styles

### Standard

```jsx padded
<StyledButton  buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonSize="large" loading>
  Loading
</StyledButton>
```

### Primary

```jsx padded
<StyledButton buttonStyle="primary" buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonStyle="primary" buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonStyle="primary" buttonSize="large" loading>
  Loading
</StyledButton>
```

### Secondary

```jsx padded
<StyledButton buttonStyle="secondary" buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonStyle="secondary" buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonStyle="secondary" buttonSize="large" loading>
  Loading
</StyledButton>
```

### Dark

```jsx padded
<StyledButton buttonStyle="dark" buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonStyle="dark" buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonStyle="dark" buttonSize="large" loading>
  Loading
</StyledButton>
```

### Danger

```jsx padded
<StyledButton buttonStyle="danger" buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonStyle="danger" buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonStyle="danger" buttonSize="large" loading>
  Loading
</StyledButton>
```

### Success

```jsx padded
<StyledButton buttonStyle="success" buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonStyle="success" buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonStyle="success" buttonSize="large" loading>
  Loading
</StyledButton>
```

### Defaults to the `medium` button size

```jsx
initialState = { buttonSize: 'medium' };
<React.Fragment>
  <StyledButton buttonSize={state.buttonSize} mb={4} mx="auto" display="block">
    {state.buttonSize}
  </StyledButton>

  <fieldset onChange={event => setState({ buttonSize: event.target.value })}>
    <label htmlFor="small-button">
      <input
        type="radio"
        name="buttonSize"
        value="small"
        id="small-button"
        defaultChecked={state.buttonSize === 'small'}
      />
      small
    </label>

    <label htmlFor="medium-button">
      <input
        type="radio"
        name="buttonSize"
        value="medium"
        id="medium-button"
        defaultChecked={state.buttonSize === 'medium'}
      />
      medium
    </label>

    <label htmlFor="large-button">
      <input
        type="radio"
        name="buttonSize"
        value="large"
        id="large-button"
        defaultChecked={state.buttonSize === 'large'}
      />
      large
    </label>
  </fieldset>
</React.Fragment>;
```

### Advanced customization

```jsx padded
<StyledButton buttonStyle="primary" bg="green.700">
  A green button
</StyledButton>
```

### Button is not clickable when loading

```jsx padded
initialState = { loading: false, nbClicks: 0 };

<StyledButton
  buttonSize="large"
  width={300}
  loading={state.loading}
  onClick={() => {
    setState(state => ({ loading: true, nbClicks: state.nbClicks + 1 }));
    setTimeout(() => setState({ loading: false }), 2000);
  }}
>
  Clicked {state.nbClicks} times
</StyledButton>;
```

### As link

```jsx
<StyledButton asLink>I'm a link!</StyledButton>
<StyledButton asLink>I'm a link!</StyledButton>
```
