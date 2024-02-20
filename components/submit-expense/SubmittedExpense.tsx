import React, { useEffect } from 'react';
import { gql, useApolloClient, useLazyQuery, useMutation } from '@apollo/client';
import { isEmpty } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  CommentType,
  CreatePrivateNoteMutation,
  CreatePrivateNoteMutationVariables,
} from '../../lib/graphql/types/v2/graphql';

import { getVariablesFromQuery } from '../../pages/expense';
import Expense from '../expenses/Expense';
import { expensePageQuery } from '../expenses/graphql/queries';
import CreateExpenseFAQ from '../faqs/CreateExpenseFAQ';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Image from '../Image';
import RichTextEditor from '../RichTextEditor';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import invoiceIllustrationStatic from '../../public/static/images/invoice-animation-static.jpg';

const I18nMessages = defineMessages({
  notePlaceholder: { defaultMessage: 'Add a note for the admins.' },
});

type SubmittedExpenseProps = {
  expenseId: number;
};

export function SubmittedExpense(props: SubmittedExpenseProps) {
  const { toast } = useToast();
  const intl = useIntl();
  const client = useApolloClient();
  const [getExpense, { data, loading, error, startPolling, stopPolling, refetch, fetchMore }] = useLazyQuery(
    expensePageQuery,
    {
      context: API_V2_CONTEXT,
    },
  );

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
      await refetch();
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
  }, [createPrivateNote, privateNote, props.expenseId, refetch, intl, toast]);

  useEffect(() => {
    if (props.expenseId) {
      getExpense({ variables: getVariablesFromQuery({ ExpenseId: props.expenseId }) });
    }
  }, [props.expenseId, getExpense]);

  return (
    <div className="grid grid-flow-col grid-cols-2 gap-4 overflow-scroll pb-2">
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

        <div className="mb-3 font-bold">
          <FormattedMessage defaultMessage="Attach a note (Optional)" /> <PrivateInfoIcon />
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
      <div>
        <Expense
          data={data}
          loading={loading || (!data && !error)}
          error={error}
          refetch={refetch}
          client={client}
          fetchMore={fetchMore}
          legacyExpenseId={props.expenseId}
          startPolling={startPolling}
          stopPolling={stopPolling}
        />
      </div>
    </div>
  );
}
