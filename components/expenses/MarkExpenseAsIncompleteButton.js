import React from 'react';
import PropTypes from 'prop-types';
import { Flag as FlagIcon } from '@styled-icons/fa-solid/Flag';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';
import { P, Span } from '../Text';

const MarkExpenseAsIncompleteModal = props => {
  const [message, setMessage] = React.useState();

  const onConfirm = () => props.onSubmit('MARK_AS_INCOMPLETE', { message });

  return (
    <StyledModal role="alertdialog" width="432px" onClose={props.onClose}>
      <ModalHeader>Mark as incomplete</ModalHeader>
      <ModalBody pt={2}>
        <P color="black.700" lineHeight="20px">
          Please mention the reason why this expense has been marked as incomplete. The reason will be shared with the
          user and also be documented as a comment under the expense.
        </P>
        <Box>
          <StyledInputField
            name="reason"
            label="Please specify the reason"
            labelFontSize="13px"
            labelFontWeight={600}
            labelColor="black.700"
            required
            mt={3}
          >
            {inputProps => (
              <StyledTextarea
                {...inputProps}
                minHeight={100}
                placeholder="e.g. Email Address is wrong"
                onChange={e => setMessage(e.target.value)}
              />
            )}
          </StyledInputField>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Flex gap="16px" justifyContent="flex-end">
          <StyledButton buttonStyle="secondary" buttonSize="small" onClick={onConfirm}>
            Confirm and mark as incomplete
          </StyledButton>
          <StyledButton buttonStyle="standard" buttonSize="small" onClick={props.onClose}>
            Cancel
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

MarkExpenseAsIncompleteModal.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const MarkExpenseAsIncompleteButton = ({ onSubmit, ...props }) => {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <React.Fragment>
      <StyledButton buttonStyle="secondary" data-cy="incomplete-button" {...props} onClick={() => setShowModal(true)}>
        <FlagIcon size={14} />
        <Span marginLeft="6px">
          <FormattedMessage id="actions.markAsIncomplete" defaultMessage="Mark as Incomplete" />
        </Span>
      </StyledButton>
      {showModal && <MarkExpenseAsIncompleteModal onSubmit={onSubmit} onClose={() => setShowModal(false)} />}
    </React.Fragment>
  );
};

MarkExpenseAsIncompleteButton.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default MarkExpenseAsIncompleteButton;
