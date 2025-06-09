import React from 'react';
import type { MessageDescriptor } from 'react-intl';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import type { Expense } from '../../lib/graphql/types/v2/schema';

import { Flex } from '../Grid';
import MessageBox from '../MessageBox';
import RichTextEditor from '../RichTextEditor';
import StyledButton from '../StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { P } from '../Text';
import { toast } from '../ui/useToast';

const messages = defineMessages({
  reasonPlaceholder: {
    defaultMessage: 'e.g, We never worked with this person.',
    id: 'mpLU2S',
  },
  REQUEST_RE_APPROVAL_TITLE: {
    id: 'expense.requestReApproval.btn',
    defaultMessage: 'Request re-approval',
  },
  REQUEST_RE_APPROVAL_DESCRIPTION: {
    defaultMessage:
      'Please mention the reason why this expense requires re-approval. The reason will be shared with the user and also be documented as a comment under the expense.',
    id: 'jD5/NS',
  },
  REQUEST_RE_APPROVAL_CONFIRM_BUTTON: {
    defaultMessage: 'Confirm and request re-approval',
    id: 'UrUS9j',
  },
  MARK_AS_INCOMPLETE_TITLE: {
    defaultMessage: 'Mark as incomplete',
    id: 'hu7oaH',
  },
  MARK_AS_INCOMPLETE_DESCRIPTION: {
    defaultMessage:
      'Please mention the reason why this expense has been marked as incomplete. The reason will be shared with the user and also be documented as a comment under the expense.',
    id: 'x7D8vH',
  },
  MARK_AS_INCOMPLETE_CONFIRM_BUTTON: {
    defaultMessage: 'Confirm and mark as incomplete',
    id: 'lNyyJU',
  },
  APPROVE_TITLE: {
    id: 'actions.approve',
    defaultMessage: 'Approve',
  },
  APPROVE_DESCRIPTION: {
    defaultMessage:
      'You may add a note that will be shared with the user and also be documented as a comment under the expense.',
    id: 'xmVXUM',
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
    id: 'SREb+h',
  },
  UNAPPROVE_CONFIRM_BUTTON: { id: 'expense.unapprove.btn', defaultMessage: 'Unapprove' },
  REJECT_TITLE: {
    id: 'actions.reject',
    defaultMessage: 'Reject',
  },
  REJECT_DESCRIPTION: {
    defaultMessage:
      'Please mention the reason why this expense has been rejected. The reason will be shared with the user and also be documented as a comment under the expense.',
    id: 'aOO6yW',
  },
  REJECT_CONFIRM_BUTTON: { id: 'actions.reject', defaultMessage: 'Reject' },
  HOLD_TITLE: {
    defaultMessage: 'Put expense on hold',
    id: 'FXOuRH',
  },
  HOLD_DESCRIPTION: {
    defaultMessage:
      'Expense is still approved but can not be paid out until it is released. Expense is also not displayed in ready to pay.',
    id: 'aE2FPd',
  },
  HOLD_CONFIRM_BUTTON: {
    defaultMessage: 'Put on Hold',
    id: '+pCc8I',
  },
  RELEASE_TITLE: {
    id: 'actions.release',
    defaultMessage: 'Release Hold',
  },
  RELEASE_DESCRIPTION: {
    defaultMessage: 'Expense can be paid out and is displayed in ready to pay list.',
    id: 'zIsgw6',
  },
  RELEASE_CONFIRM_BUTTON: {
    id: 'actions.release',
    defaultMessage: 'Release Hold',
  },
  MARK_AS_SPAM_TITLE: {
    id: 'actions.spam',
    defaultMessage: 'Mark as Spam',
  },
  MARK_AS_SPAM_DESCRIPTION: {
    id: 'Expense.MarkAsSpamWarning',
    defaultMessage: 'This will prevent the submitter account to post new expenses.',
  },
  MARK_AS_SPAM_CONFIRM_BUTTON: {
    id: 'actions.spam',
    defaultMessage: 'Mark as Spam',
  },
  MARK_AS_SPAM_LABEL: {
    id: 'Expense.MarkAsSpamLabel',
    defaultMessage: 'Why are you marking this expense as spam?',
  },
});

const MessagesPerType: Record<
  ConfirmProcessExpenseModalType,
  { title: MessageDescriptor; description: MessageDescriptor; confirmBtn: MessageDescriptor; label?: MessageDescriptor }
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
  HOLD: {
    title: messages.HOLD_TITLE,
    description: messages.HOLD_DESCRIPTION,
    confirmBtn: messages.HOLD_CONFIRM_BUTTON,
  },
  RELEASE: {
    title: messages.RELEASE_TITLE,
    description: messages.RELEASE_DESCRIPTION,
    confirmBtn: messages.RELEASE_CONFIRM_BUTTON,
  },
  MARK_AS_SPAM: {
    title: messages.MARK_AS_SPAM_TITLE,
    description: messages.MARK_AS_SPAM_DESCRIPTION,
    confirmBtn: messages.MARK_AS_SPAM_CONFIRM_BUTTON,
    label: messages.MARK_AS_SPAM_LABEL,
  },
};

export type ConfirmProcessExpenseModalType =
  | 'REQUEST_RE_APPROVAL'
  | 'MARK_AS_INCOMPLETE'
  | 'MARK_AS_SPAM'
  | 'APPROVE'
  | 'UNAPPROVE'
  | 'REJECT'
  | 'HOLD'
  | 'RELEASE';

type ConfirmProcessExpenseModalProps = {
  type: ConfirmProcessExpenseModalType;
  onClose: () => void;
  expense: Pick<Expense, 'id' | 'legacyId' | 'permissions'>;
};

export default function ConfirmProcessExpenseModal({ type, onClose, expense }: ConfirmProcessExpenseModalProps) {
  const intl = useIntl();

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
          await processExpense.requestReApproval({
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
        case 'HOLD': {
          await processExpense.hold({
            message,
          });
          break;
        }
        case 'RELEASE': {
          await processExpense.release({
            message,
          });
          break;
        }
        case 'MARK_AS_SPAM': {
          await processExpense.markAsSpam({
            message,
          });
          break;
        }
      }
      onClose();
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
    }
  }, [type, message, intl, processExpense]);

  return (
    <StyledModal role="alertdialog" onClose={onClose} trapFocus>
      <ModalHeader>{intl.formatMessage(MessagesPerType[type].title)}</ModalHeader>
      <ModalBody pt={2}>
        <Flex>
          <MessageBox lineHeight="20px" mb={10} type="warning" withIcon>
            {intl.formatMessage(MessagesPerType[type].description)}
          </MessageBox>
        </Flex>

        {MessagesPerType[type].label && (
          <P as="label" htmlFor="expense-ban-reason" mb={2} color="black.700" fontWeight="500">
            {intl.formatMessage(
              { id: 'OptionalFieldLabel', defaultMessage: '{field} (optional)' },
              { field: intl.formatMessage(MessagesPerType[type].label) },
            )}
          </P>
        )}

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
