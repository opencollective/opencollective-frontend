### Standard button

```js
<React.Fragment>
  <StyledButton mr={3} buttonSize="large" disabled>
    Disabled
  </StyledButton>
  <StyledButton mr={3} buttonSize="large">
    Default
  </StyledButton>
  <StyledButton mr={3} buttonSize="large" loading>
    Loading
  </StyledButton>
</React.Fragment>
```

### Primary button

```js
<React.Fragment>
  <StyledButton mr={3} buttonStyle="primary" buttonSize="large" disabled>
    Disabled
  </StyledButton>
  <StyledButton mr={3} buttonStyle="primary" buttonSize="large">
    Default
  </StyledButton>
  <StyledButton mr={3} buttonStyle="primary" buttonSize="large" loading>
    Loading
  </StyledButton>
</React.Fragment>
```

### Defaults to the `medium` button size

```js
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
