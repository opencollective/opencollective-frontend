import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { isEmpty } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  CommentType,
  CreatePrivateNoteMutation,
  CreatePrivateNoteMutationVariables,
} from '../../lib/graphql/types/v2/graphql';

import CreateExpenseFAQ from '../faqs/CreateExpenseFAQ';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Image from '../Image';
import MessageBox from '../MessageBox';
import RichTextEditor from '../RichTextEditor';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { ExpenseForm } from './useExpenseForm';

import invoiceIllustrationStatic from '../../public/static/images/invoice-animation-static.jpg';

const I18nMessages = defineMessages({
  notePlaceholder: { defaultMessage: 'Add a note for the admins.' },
});

type SubmittedExpenseProps = {
  form: ExpenseForm;
  expenseId: number;
};

export function SubmittedExpense(props: SubmittedExpenseProps) {
  const { toast } = useToast();
  const intl = useIntl();

  const [privateNote, setPrivateNote] = React.useState('');
  const [lastPrivateNoteId, setLastPrivateNoteId] = React.useState(null);

  const [createPrivateNote, createPrivateNoteMutation] = useMutation<
    CreatePrivateNoteMutation,
    CreatePrivateNoteMutationVariables
  >(
    gql`
      mutation CreatePrivateNote($comment: CommentCreateInput!) {
        createComment(comment: $comment) {
          id
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  const onAddPrivateNoteClick = React.useCallback(async () => {
    try {
      const result = await createPrivateNote({
        variables: {
          comment: {
            expense: {
              legacyId: props.expenseId,
            },
            html: privateNote,
            type: CommentType.PRIVATE_NOTE,
          },
        },
      });
      setPrivateNote('');
      setLastPrivateNoteId(result.data.createComment.id);
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Note added!" />,
      });
    } catch (e) {
      toast({
        variant: 'error',
        message: i18nGraphqlException(intl, e),
      });
    }
  }, [createPrivateNote, privateNote, props.expenseId, intl, toast]);

  return (
    <div className="flex flex-col overflow-scroll overflow-x-hidden pb-2">
      <div>
        <div className="mb-8 flex items-center gap-2 text-xl font-bold">
          <Image
            alt={intl.formatMessage({ id: 'Expense.Type.Invoice', defaultMessage: 'Invoice' })}
            src={invoiceIllustrationStatic}
            width={48}
            height={48}
          />
          <FormattedMessage defaultMessage="Your expense has been submitted successfully!" />
        </div>

        <h2 className="mb-3 font-bold">
          <FormattedMessage defaultMessage="What's next?" />
        </h2>
        <ol className="mb-4 list-inside list-decimal text-sm text-slate-700">
          <li>
            <FormattedMessage
              defaultMessage="This expense needs to be approved by an admin of {collective}"
              values={{ collective: props.form.options.account.name }}
            />
          </li>
          {props.form.options.host && (
            <li>
              <FormattedMessage
                defaultMessage="This expense will then be reviewed by an administrator from {host}"
                values={{ host: props.form.options.host.name }}
              />
            </li>
          )}
        </ol>

        <MessageBox my={4} type="info">
          <FormattedMessage defaultMessage="You can find and track your expense in your dashboard." />
        </MessageBox>

        <div className="mb-3 font-bold">
          <FormattedMessage defaultMessage="Is there anything else you wish to communicate to the admins who will review this expense?" />{' '}
          <PrivateInfoIcon />
        </div>
        <RichTextEditor
          key={lastPrivateNoteId}
          withBorders
          version="simplified"
          editorMinHeight={72}
          fontSize="13px"
          placeholder={intl.formatMessage(I18nMessages.notePlaceholder)}
          onChange={e => setPrivateNote(e.target.value)}
        />
        <Button
          loading={createPrivateNoteMutation.loading}
          disabled={isEmpty(privateNote)}
          className="mt-3"
          variant="default"
          onClick={onAddPrivateNoteClick}
        >
          <FormattedMessage defaultMessage="Add a note" />
        </Button>

        <div className="mt-8">
          <CreateExpenseFAQ defaultOpen />
        </div>
      </div>
    </div>
  );
}
