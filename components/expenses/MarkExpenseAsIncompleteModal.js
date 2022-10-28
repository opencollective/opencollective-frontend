import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

import { expensePageExpenseFieldsFragment } from './graphql/fragments';

const messages = defineMessages({
  reasonPlaceholder: {
    defaultMessage: 'e.g. Email Address is wrong',
  },
});

const processExpenseMutation = gql`
  mutation ProcessExpense($id: String, $legacyId: Int, $action: ExpenseProcessAction!, $message: String) {
    processExpense(expense: { id: $id, legacyId: $legacyId }, action: $action, message: $message) {
      id
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

const MarkExpenseAsIncompleteModal = ({ expense, onClose }) => {
  const intl = useIntl();
  const [message, setMessage] = React.useState();
  const mutationOptions = { context: API_V2_CONTEXT };
  const [processExpense, { loading }] = useMutation(processExpenseMutation, mutationOptions);
  const { addToast } = useToasts();

  const onConfirm = async () => {
    try {
      const variables = { id: expense.id, legacyId: expense.legacyId, action: 'MARK_AS_INCOMPLETE', message };
      await processExpense({ variables });
      onClose();
    } catch (error) {
      // Display a toast with light variant since we're in a modal
      addToast({ type: TOAST_TYPE.ERROR, variant: 'light', message: i18nGraphqlException(intl, error) });
    }
  };

  return (
    <StyledModal role="alertdialog" width="432px" onClose={onClose}>
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
          <StyledButton buttonStyle="secondary" buttonSize="small" onClick={onConfirm} minWidth={180} loading={loading}>
            <FormattedMessage defaultMessage="Confirm and mark as incomplete" />
          </StyledButton>
          <StyledButton buttonStyle="standard" buttonSize="small" onClick={onClose}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

MarkExpenseAsIncompleteModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  expense: PropTypes.shape({
    id: PropTypes.string.isRequired,
    legacyId: PropTypes.number.isRequired,
  }).isRequired,
};

export default MarkExpenseAsIncompleteModal;
