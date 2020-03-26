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

### Warning

```jsx padded
<StyledButton buttonStyle="warning" buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonStyle="warning" buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonStyle="warning" buttonSize="large" loading>
  Loading
</StyledButton>
```

### Warning secondary

```jsx padded
<StyledButton buttonStyle="warningSecondary" buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonStyle="warningSecondary" buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonStyle="warningSecondary" buttonSize="large" loading>
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

### Danger secondary

```jsx padded
<StyledButton buttonStyle="dangerSecondary" buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonStyle="dangerSecondary" buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonStyle="dangerSecondary" buttonSize="large" loading>
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

### Success secondary

```jsx padded
<StyledButton buttonStyle="successSecondary" buttonSize="large" disabled>
  Disabled
</StyledButton>
<StyledButton buttonStyle="successSecondary" buttonSize="large">
  Default
</StyledButton>
<StyledButton buttonStyle="successSecondary" buttonSize="large" loading>
  Loading
</StyledButton>
```

### Defaults to the `medium` button size

```jsx
import { Flex } from '@rebass/grid';
const [buttonSize, setButtonSize] = React.useState('medium');
<React.Fragment>
  <Flex mb={4} flexWrap="wrap" justifyContent="space-evenly">
    <StyledButton buttonSize={buttonSize} buttonStyle="standard" m={2} display="block">
      {buttonSize}
    </StyledButton>
    <StyledButton buttonSize={buttonSize} buttonStyle="primary" m={2} display="block">
      {buttonSize}
    </StyledButton>
    <StyledButton buttonSize={buttonSize} buttonStyle="secondary" m={2} display="block">
      {buttonSize}
    </StyledButton>
    <StyledButton buttonSize={buttonSize} buttonStyle="dark" m={2} display="block">
      {buttonSize}
    </StyledButton>
    <StyledButton buttonSize={buttonSize} buttonStyle="warning" m={2} display="block">
      {buttonSize}
    </StyledButton>
    <StyledButton buttonSize={buttonSize} buttonStyle="warningSecondary" m={2} display="block">
      {buttonSize}
    </StyledButton>
    <StyledButton buttonSize={buttonSize} buttonStyle="danger" m={2} display="block">
      {buttonSize}
    </StyledButton>
    <StyledButton buttonSize={buttonSize} buttonStyle="dangerSecondary" m={2} display="block">
      {buttonSize}
    </StyledButton>
    <StyledButton buttonSize={buttonSize} buttonStyle="success" m={2} display="block">
      {buttonSize}
    </StyledButton>
    <StyledButton buttonSize={buttonSize} buttonStyle="successSecondary" m={2} display="block">
      {buttonSize}
    </StyledButton>
  </Flex>

  <fieldset onChange={event => setButtonSize(event.target.value)}>
    <label htmlFor="small-button">
      <input type="radio" name="buttonSize" value="Small" id="small-button" defaultChecked={buttonSize === 'small'} />
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

### Borderless (link)

Use the `asLink` prop. Works best with secondary button styles.

```jsx padded
import { Flex } from '@rebass/grid';
<React.Fragment>
  <h4>Default</h4>
  <Flex justifyContent="space-evenly">
    <StyledButton disabled asLink>
      Disabled
    </StyledButton>
    <StyledButton asLink>Default</StyledButton>
    <StyledButton loading asLink>
      Loading
    </StyledButton>
  </Flex>
  <h4>Secondary</h4>
  <Flex justifyContent="space-evenly">
    <StyledButton buttonStyle="secondary" disabled asLink>
      Disabled
    </StyledButton>
    <StyledButton buttonStyle="secondary" asLink>
      Default
    </StyledButton>
    <StyledButton buttonStyle="secondary" loading asLink>
      Loading
    </StyledButton>
  </Flex>
  <h4>Success secondary</h4>
  <Flex justifyContent="space-evenly">
    <StyledButton buttonStyle="successSecondary" disabled asLink>
      Disabled
    </StyledButton>
    <StyledButton buttonStyle="successSecondary" asLink>
      Default
    </StyledButton>
    <StyledButton buttonStyle="successSecondary" loading asLink>
      Loading
    </StyledButton>
  </Flex>
  <h4>Danger secondary</h4>
  <Flex justifyContent="space-evenly">
    <StyledButton buttonStyle="dangerSecondary" disabled asLink>
      Disabled
    </StyledButton>
    <StyledButton buttonStyle="dangerSecondary" asLink>
      Default
    </StyledButton>
    <StyledButton buttonStyle="dangerSecondary" loading asLink>
      Loading
    </StyledButton>
  </Flex>
</React.Fragment>;
```

### Async button

Button is not clickable when loading

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
