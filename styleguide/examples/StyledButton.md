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
const [buttonSize, setButtonSize] = React.useState('medium');
<React.Fragment>
  <StyledButton buttonSize={buttonSize} mb={4} mx="auto" display="block">
    {buttonSize}
  </StyledButton>

  <fieldset onChange={event => setButtonSize(event.target.value)}>
    <label htmlFor="small-button">
      <input type="radio" name="buttonSize" value="small" id="small-button" defaultChecked={buttonSize === 'small'} />
      small
    </label>

    <label htmlFor="medium-button">
      <input
        type="radio"
        name="buttonSize"
        value="medium"
        id="medium-button"
        defaultChecked={buttonSize === 'medium'}
      />
      medium
    </label>

    <label htmlFor="large-button">
      <input type="radio" name="buttonSize" value="large" id="large-button" defaultChecked={buttonSize === 'large'} />
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
const [loading, setLoading] = React.useState(false);
const [nbClicks, setNbClicks] = React.useState(0);

<StyledButton
  buttonSize="large"
  width={300}
  loading={loading}
  onClick={() => {
    setLoading(true);
    setNbClicks(nbClicks + 1);
    setTimeout(() => setLoading(false), 2000);
  }}
>
  Clicked {nbClicks} times
</StyledButton>;
```

### As link

```jsx
<StyledButton asLink>I'm a link!</StyledButton>
```
