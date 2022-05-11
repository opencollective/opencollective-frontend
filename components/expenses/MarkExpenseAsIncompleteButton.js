import React from 'react';
import PropTypes from 'prop-types';
import { Flag as FlagIcon } from '@styled-icons/fa-solid/Flag';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';
import { P, Span } from '../Text';

const messages = defineMessages({
  reasonPlaceholder: {
    defaultMessage: 'e.g. Email Address is wrong',
  },
});

const MarkExpenseAsIncompleteModal = props => {
  const intl = useIntl();
  const [message, setMessage] = React.useState();

  const onConfirm = () => props.onSubmit('MARK_AS_INCOMPLETE', { message });

  return (
    <StyledModal role="alertdialog" width="432px" onClose={props.onClose}>
      <ModalHeader>
        <FormattedMessage defaultMessage="Mark as incomplete" />
      </ModalHeader>
      <ModalBody pt={2}>
        <P color="black.700" lineHeight="20px">
          <FormattedMessage defaultMessage="Please mention the reason why this expense has been marked as incomplete. The reason will be shared with the user and also be documented as a comment under the expense." />
        </P>
        <Box>
          <StyledInputField
            name="reason"
            label={<FormattedMessage defaultMessage="Please specify the reason" />}
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
                placeholder={intl.formatMessage(messages.reasonPlaceholder)}
                onChange={e => setMessage(e.target.value)}
              />
            )}
          </StyledInputField>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Flex gap="16px" justifyContent="flex-end">
          <StyledButton buttonStyle="secondary" buttonSize="small" onClick={onConfirm}>
            <FormattedMessage defaultMessage="Confirm and mark as incomplete" />
          </StyledButton>
          <StyledButton buttonStyle="standard" buttonSize="small" onClick={props.onClose}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
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
