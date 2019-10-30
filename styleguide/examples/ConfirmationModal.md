```jsx noeditor
import ConfirmationModal from 'components/ConfirmationModal';
import StyledButton from 'components/StyledButton';
```

```js
import StyledButton from 'components/StyledButton';

initialState = { show: false };

<React.Fragment>
  {state.show ? (
    <ConfirmationModal
      show
      header={'Use modal'}
      body={'Are you sure you want to use this modal?'}
      onClose={() => setState({ show: false })}
      cancelLabel={'No'}
      cancelHandler={() => setState({ show: false })}
      continueLabel={'Yes'}
      continueHandler={console.log}
    />
  ) : (
    <StyledButton buttonSize="large" buttonStyle="primary" onClick={() => setState({ show: true })}>
      Use Modal
    </StyledButton>
  )}
</React.Fragment>;
```
