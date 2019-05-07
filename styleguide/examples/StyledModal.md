```js
import Modal, { ModalBody, ModalHeader, ModalFooter } from '../../../src/components/StyledModal';
import StyledButton from '../../../src/components/StyledButton';

const initalState = { show: true }

<Modal show={state.show} onClose={() => setState({ show: false }) } height="300px">
  <ModalHeader>
    Modal title goes here
  </ModalHeader>
  <ModalBody>
    Contents of the modal goes here. There will be different content types but for noew lerts use this simple version. Are you ok to use this version for now?
  </ModalBody>
  <ModalFooter>
    <StyledButton mx={20}>Cancel</StyledButton>
    <StyledButton buttonStyle="primary">Go with this version</StyledButton>
  </ModalFooter>
</Modal>
```