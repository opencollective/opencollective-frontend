```js
import Modal, { ModalBody, ModalHeader, ModalFooter } from 'components/StyledModal';
import StyledButton from 'components/StyledButton';

const [show, setShow] = React.useState(false);

<React.Fragment>
  {show ? (
    <Modal show onClose={() => setShow(false)}>
      <ModalHeader>Modal title goes here</ModalHeader>
      <ModalBody>
        Contents of the modal goes here. There will be different content types but for noew lerts use this simple
        version. Are you ok to use this version for now?
      </ModalBody>
      <ModalFooter>
        <StyledButton mx={20} onClick={() => setShow(false)}>
          Cancel
        </StyledButton>
        <StyledButton
          buttonStyle="primary"
          onClick={() => {
            alert('ok!');
            setShow(false);
          }}
        >
          Go with this version
        </StyledButton>
      </ModalFooter>
    </Modal>
  ) : (
    <StyledButton buttonSize="large" buttonStyle="primary" onClick={() => setShow(true)}>
      Show modal
    </StyledButton>
  )}
</React.Fragment>;
```
