```jsx noeditor
// See https://github.com/styleguidist/react-styleguidist/issues/1278
import Modal, { ModalBody, ModalHeader, ModalFooter } from 'components/StyledModal';
import StyledButton from 'components/StyledButton';
```

```js
import Modal, { ModalBody, ModalHeader, ModalFooter } from 'components/StyledModal';
import StyledButton from 'components/StyledButton';

initialState = { show: false };

<React.Fragment>
  {state.show ? (
    <Modal show onClose={() => setState({ show: false })}>
      <ModalHeader>Modal title goes here</ModalHeader>
      <ModalBody>
        Contents of the modal goes here. There will be different content types but for noew lerts use this simple
        version. Are you ok to use this version for now?
      </ModalBody>
      <ModalFooter>
        <StyledButton mx={20} onClick={() => setState({ show: false })}>
          Cancel
        </StyledButton>
        <StyledButton buttonStyle="primary">Go with this version</StyledButton>
      </ModalFooter>
    </Modal>
  ) : (
    <StyledButton buttonSize="large" buttonStyle="primary" onClick={() => setState({ show: true })}>
      Show modal
    </StyledButton>
  )}
</React.Fragment>;
```
