import React from 'react';
import { defineMessages, FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import { Expense } from '../../lib/graphql/types/v2/graphql';

import { Flex } from '../Grid';
import RichTextEditor from '../RichTextEditor';
import StyledButton from '../StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const messages = defineMessages({
  reasonPlaceholder: {
    defaultMessage: 'e.g. Email Address is wrong',
  },
  REQUEST_RE_APPROVAL_TITLE: {
    id: 'expense.requestReApproval.btn',
    defaultMessage: 'Request re-approval',
  },
  REQUEST_RE_APPROVAL_DESCRIPTION: {
    defaultMessage:
      'Please mention the reason why this expense requires re-approval. The reason will be shared with the user and also be documented as a comment under the expense.',
  },
  REQUEST_RE_APPROVAL_CONFIRM_BUTTON: {
    defaultMessage: 'Confirm and request re-approval',
  },
  MARK_AS_INCOMPLETE_TITLE: {
    defaultMessage: 'Mark as incomplete',
  },
  MARK_AS_INCOMPLETE_DESCRIPTION: {
    defaultMessage:
      'Please mention the reason why this expense has been marked as incomplete. The reason will be shared with the user and also be documented as a comment under the expense.',
  },
  MARK_AS_INCOMPLETE_CONFIRM_BUTTON: {
    defaultMessage: 'Confirm and mark as incomplete',
  },
  APPROVE_TITLE: {
    id: 'actions.approve',
    defaultMessage: 'Approve',
  },
  APPROVE_DESCRIPTION: {
    defaultMessage:
      'You may add a note that will be shared with the user and also be documented as a comment under the expense.',
  },
  APPROVE_CONFIRM_BUTTON: {
    id: 'actions.approve',
    defaultMessage: 'Approve',
  },
  UNAPPROVE_TITLE: {
    id: 'expense.unapprove.btn',
    defaultMessage: 'Unapprove',
  },
  UNAPPROVE_DESCRIPTION: {
    defaultMessage:
      'Please mention the reason why this expense has been unapproved. The reason will be shared with the user and also be documented as a comment under the expense.',
  },
  UNAPPROVE_CONFIRM_BUTTON: { id: 'expense.unapprove.btn', defaultMessage: 'Unapprove' },
  REJECT_TITLE: {
    id: 'actions.reject',
    defaultMessage: 'Reject',
  },
  REJECT_DESCRIPTION: {
    defaultMessage:
      'Please mention the reason why this expense has been rejected. The reason will be shared with the user and also be documented as a comment under the expense.',
  },
  REJECT_CONFIRM_BUTTON: { id: 'actions.reject', defaultMessage: 'Reject' },
});

const MessagesPerType: Record<
  ConfirmProcessExpenseModalType,
  { title: MessageDescriptor; description: MessageDescriptor; confirmBtn: MessageDescriptor }
> = {
  REQUEST_RE_APPROVAL: {
    title: messages.REQUEST_RE_APPROVAL_TITLE,
    description: messages.REQUEST_RE_APPROVAL_DESCRIPTION,
    confirmBtn: messages.REQUEST_RE_APPROVAL_CONFIRM_BUTTON,
  },
  MARK_AS_INCOMPLETE: {
    title: messages.MARK_AS_INCOMPLETE_TITLE,
    description: messages.MARK_AS_INCOMPLETE_DESCRIPTION,
    confirmBtn: messages.MARK_AS_INCOMPLETE_CONFIRM_BUTTON,
  },
  APPROVE: {
    title: messages.APPROVE_TITLE,
    description: messages.APPROVE_DESCRIPTION,
    confirmBtn: messages.APPROVE_CONFIRM_BUTTON,
  },
  UNAPPROVE: {
    title: messages.UNAPPROVE_TITLE,
    description: messages.UNAPPROVE_DESCRIPTION,
    confirmBtn: messages.UNAPPROVE_CONFIRM_BUTTON,
  },
  REJECT: {
    title: messages.REJECT_TITLE,
    description: messages.REJECT_DESCRIPTION,
    confirmBtn: messages.REJECT_CONFIRM_BUTTON,
  },
};

export type ConfirmProcessExpenseModalType =
  | 'REQUEST_RE_APPROVAL'
  | 'MARK_AS_INCOMPLETE'
  | 'APPROVE'
  | 'UNAPPROVE'
  | 'REJECT';

export type ConfirmProcessExpenseModalProps = {
  type: ConfirmProcessExpenseModalType;
  onClose: () => void;
  expense: Pick<Expense, 'id' | 'legacyId' | 'permissions'>;
};

export default function ConfirmProcessExpenseModal({ type, onClose, expense }: ConfirmProcessExpenseModalProps) {
  const intl = useIntl();
  const { addToast } = useToasts();

  const [message, setMessage] = React.useState<string>();
  const [uploading, setUploading] = React.useState(false);

  const processExpense = useProcessExpense({
    expense,
  });

  const onConfirm = React.useCallback(async () => {
    try {
      switch (type) {
        case 'MARK_AS_INCOMPLETE': {
          await processExpense.markAsIncomplete({
            message,
          });
          break;
        }
        case 'REQUEST_RE_APPROVAL': {
          await processExpense.unapprove({
            message,
          });
          break;
        }
        case 'APPROVE': {
          await processExpense.approve({
            message,
          });
          break;
        }
        case 'UNAPPROVE': {
          await processExpense.unapprove({
            message,
          });
          break;
        }
        case 'REJECT': {
          await processExpense.reject({
            message,
          });
          break;
        }
      }
      onClose();
    } catch (error) {
      addToast({ type: TOAST_TYPE.ERROR, variant: 'light', message: i18nGraphqlException(intl, error) });
    }
  }, [type, message, intl, processExpense]);

  return (
    <StyledModal role="alertdialog" width="432px" onClose={onClose} trapFocus>
      <ModalHeader>{intl.formatMessage(MessagesPerType[type].title)}</ModalHeader>
      <ModalBody pt={2}>
        <P mb={3} color="black.700" lineHeight="20px">
          {intl.formatMessage(MessagesPerType[type].description)}
        </P>
        <RichTextEditor
          data-cy="confirm-action-text"
          kind="COMMENT"
          version="simplified"
          withBorders
          editorMinHeight={150}
          placeholder={intl.formatMessage(messages.reasonPlaceholder)}
          fontSize="13px"
          onChange={e => setMessage(e.target.value)}
          setUploading={setUploading}
        />
      </ModalBody>
      <ModalFooter>
        <Flex gap="16px" justifyContent="flex-end">
          <StyledButton
            data-cy="confirm-action-button"
            disabled={uploading}
            buttonStyle="secondary"
            buttonSize="small"
            onClick={onConfirm}
            minWidth={180}
            loading={uploading || processExpense.loading}
          >
            {intl.formatMessage(MessagesPerType[type].confirmBtn)}
          </StyledButton>
          <StyledButton buttonStyle="standard" buttonSize="small" onClick={onClose}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
}
