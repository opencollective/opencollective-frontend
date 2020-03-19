Using [renderProps](https://reactjs.org/docs/render-props.html#using-props-other-than-render) allows this component to focus on just the label and error styles, leaving the input logic independent as a separate concern.

Default state:

```jsx
import StyledInput from 'components/StyledInput';
<StyledInputField label="Component with Label" htmlFor="example">
  {inputProps => <StyledInput type="text" placeholder="sample text" {...inputProps} />}
</StyledInputField>;
```

Disabled state:

```js
import StyledInput from 'components/StyledInput';
<StyledInputField label="Disabled Component with Label" htmlFor="disabled" disabled>
  {inputProps => <StyledInput type="text" placeholder="sample text" {...inputProps} />}
</StyledInputField>;
```

Success state:

```js
import StyledInput from 'components/StyledInput';
<StyledInputField label="Success Component with Label" htmlFor="success" success>
  {inputProps => <StyledInput type="text" placeholder="sample text" {...inputProps} />}
</StyledInputField>;
```

Error state:

```js
import StyledInput from 'components/StyledInput';
<StyledInputField label="Component with Error" htmlFor="error-example" error="Error message goes here">
  {inputProps => <StyledInput type="text" placeholder="sample text" {...inputProps} />}
</StyledInputField>;
```
