import Container from './Container';
import { Span } from './Text';
import StyledInput from './StyledInput';

const StyledInputGroup = ({ prepend, ...inputProps }) => (
  <Container border="1px solid #D5DAE0" borderRadius="4px" display="flex" alignItems="center">
    <Container bg="#F7F8FA" borderRadius="4px 0 0 4px" py={2} px={3} mr={1}>
      <Span color="#C2C6CC" fontSize="14px">{prepend}</Span>
    </Container>
    <StyledInput type="text" overflow="scroll" fontSize="14px" {...inputProps} />
  </Container>
);

export default StyledInputGroup;
