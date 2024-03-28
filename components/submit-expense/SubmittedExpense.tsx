import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { includes, isEmpty } from 'lodash';
import { ExternalLink } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  CommentType,
  CreatePrivateNoteMutation,
  CreatePrivateNoteMutationVariables,
  ExpenseStatus,
  SubmittedExpenseFromDashboardQuery,
  SubmittedExpenseFromDashboardQueryVariables,
} from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import CreateExpenseFAQ from '../faqs/CreateExpenseFAQ';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Image from '../Image';
import LinkCollective from '../LinkCollective';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import RichTextEditor from '../RichTextEditor';
import StyledLink from '../StyledLink';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

const I18nMessages = defineMessages({
  notePlaceholder: { defaultMessage: 'Add a note for the admins.' },
});

type SubmittedExpenseProps = {
  expenseId: number;
};

export function SubmittedExpense(props: SubmittedExpenseProps) {
  const { toast } = useToast();
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();

  const query = useQuery<SubmittedExpenseFromDashboardQuery, SubmittedExpenseFromDashboardQueryVariables>(
    gql`
      query SubmittedExpenseFromDashboard($expenseLegacyId: Int!) {
        expense(expense: { legacyId: $expenseLegacyId }) {
          id
          legacyId
          status
          recurringExpense {
            id
          }
          draft
          host {
            id
            slug
            legacyId
            name
          }
          account {
            id
            slug
            legacyId
            name
            isAdmin
          }
          requiredLegalDocuments
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      skip: !props.expenseId,
      variables: {
        expenseLegacyId: props.expenseId,
      },
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

  if (query.loading) {
    return <Loading />;
  }

  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  const expense = query.data.expense;

  const isInvite = expense.status === ExpenseStatus.DRAFT && !expense.recurringExpense;

  const requiresTaxDocuments = expense.account?.isAdmin && includes(expense.requiredLegalDocuments, 'US_TAX_FORM');

  return (
    <div className="flex flex-col gap-8 overflow-scroll overflow-x-hidden px-6 py-4 sm:flex-row sm:px-16">
      <div className="flex-1">
        <div className="mb-8 text-xl font-bold">
          {isInvite ? (
            <FormattedMessage id="InviteOnItsWay" defaultMessage="Your invite is on its way" />
          ) : (
            <FormattedMessage defaultMessage="Your expense has been submitted successfully!" />
          )}
        </div>

        {isInvite ? (
          <div className="mb-8 flex gap-2">
            <Image
              alt={intl.formatMessage({ id: 'Expense.Type.Invoice', defaultMessage: 'Invoice' })}
              src="/static/images/pidgeon.png"
              width={112}
              height={112}
            />
            <div className="text-sm">
              <FormattedMessage
                id="Expense.InviteIsOnItsWay.Description"
                defaultMessage="An invitation to submit this expense has been sent to {email}. Once they confirm and finish the process, it will appear on the expenses list."
                values={{
                  email: expense.draft?.payee?.email || expense.draft?.payee?.name,
                }}
              />
            </div>
          </div>
        ) : null}

        <h2 className="mb-3 font-bold">
          <FormattedMessage defaultMessage="What's next?" />
        </h2>
        <ol className="mb-4 list-inside list-decimal text-sm text-slate-700">
          {requiresTaxDocuments && (
            <li>
              <FormattedMessage defaultMessage="Submit your tax form." />{' '}
              <StyledLink
                className="whitespace-nowrap"
                href="https://docs.opencollective.com/help/expenses-and-getting-paid/tax-information"
                openInNewTab
              >
                <FormattedMessage id="ContributeCard.SeeMore" defaultMessage="See More" />
                <ExternalLink size={16} className="ml-1 inline align-text-top" />
              </StyledLink>
            </li>
          )}
          <li>
            <FormattedMessage
              defaultMessage="This expense needs to be approved by an admin of {collective}"
              values={{
                collective: <LinkCollective openInNewTab className="underline" collective={expense.account} />,
              }}
            />
          </li>
          {expense.host && (
            <li>
              <FormattedMessage
                defaultMessage="After that, this expense needs to be reviewed and paid by an admin of {host}"
                values={{ host: <LinkCollective openInNewTab className="underline" collective={expense.host} /> }}
              />
            </li>
          )}
        </ol>

        {!isInvite && (
          <MessageBox my={4} type="info">
            <FormattedMessage
              defaultMessage="You can find and track your expense in your dashboard. <Link>Go to expense</Link>."
              values={{
                Link: chunks => (
                  <StyledLink
                    className="whitespace-nowrap"
                    href={`/dashboard/${LoggedInUser.collective.slug}/submitted-expenses?openExpenseId=${expense.legacyId}`}
                    openInNewTab
                  >
                    {chunks}
                    <ExternalLink size={16} className="ml-1 inline align-text-top" />
                  </StyledLink>
                ),
              }}
            />
          </MessageBox>
        )}

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
      </div>

      <div className="flex-1">
        <CreateExpenseFAQ defaultOpen />
      </div>
    </div>
  );
}
