```js
import ConfirmationModal from 'components/ConfirmationModal';
import StyledButton from 'components/StyledButton';

const [show, setShow] = React.useState(false);

<React.Fragment>
  {show ? (
    <ConfirmationModal
      show
      header={'Use modal'}
      body={'Are you sure you want to use this modal?'}
      onClose={() => setShow(false)}
      cancelLabel={'No'}
      cancelHandler={() => setShow(false)}
      continueLabel={'Yes'}
      continueHandler={console.log}
    />
  ) : (
    <StyledButton buttonSize="large" buttonStyle="primary" onClick={() => setShow(true)}>
      Show modal
    </StyledButton>
  )}
</React.Fragment>;
```
