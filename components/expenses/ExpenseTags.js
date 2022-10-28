import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import StyledInputTags from '../StyledInputTags';
import StyledTag from '../StyledTag';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

import ExpenseTypeTag from './ExpenseTypeTag';

const editExpenseTagsMutation = gql`
  mutation EditExpenseTags($id: String!, $tags: [String!]!) {
    editExpense(expense: { id: $id, tags: $tags }) {
      id
      tags
    }
  }
`;

/**
 * Display expense tags, with the ability to edit them. Triggers a migration whenever a tag changes.
 */
const ExpenseTagsForAdmins = ({ expense, suggestedTags }) => {
  const [submitTags, { loading }] = useMutation(editExpenseTagsMutation, { context: API_V2_CONTEXT });
  const { addToast } = useToasts();
  const intl = useIntl();
  return (
    <StyledInputTags
      disabled={loading}
      value={expense.tags}
      suggestedTags={suggestedTags}
      onChange={async tags => {
        try {
          await submitTags({ variables: { id: expense.id, tags: tags.map(tag => tag.value) } });
        } catch (e) {
          addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
        }
      }}
    />
  );
};

ExpenseTagsForAdmins.propTypes = {
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  expense: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

const ExpenseTag = styled(StyledTag).attrs({
  mb: '4px',
  mr: '4px',
  variant: 'rounded-right',
})``;

const ExpenseTags = ({ expense, isLoading, limit, getTagProps, children, canEdit, suggestedTags, showUntagged }) => {
  const intl = useIntl();

  const renderTag = ({ tag, label }) => {
    const extraTagProps = getTagProps?.(tag) || {};

    const renderedTag = (
      <ExpenseTag key={tag} data-cy="expense-tag" {...extraTagProps}>
        {label ?? tag}
      </ExpenseTag>
    );

    return children ? children({ key: tag, tag, renderedTag, props: extraTagProps }) : renderedTag;
  };
  return (
    <Flex flexWrap="wrap" alignItems="flex-start">
      {expense?.type && <ExpenseTypeTag type={expense.type} legacyId={expense.legacyId} isLoading={isLoading} />}

      {canEdit ? (
        <ExpenseTagsForAdmins expense={expense} suggestedTags={suggestedTags} />
      ) : (
        expense?.tags && (
          <React.Fragment>
            {expense.tags.slice(0, limit).map(tag => renderTag({ tag }))}
            {showUntagged &&
              renderTag({
                tag: 'untagged',
                label: intl.formatMessage(defineMessage({ defaultMessage: 'Untagged' })),
              })}

            {expense.tags.length > limit && (
              <ExpenseTag color="black.600" title={expense.tags.slice(limit).join(', ')}>
                <FormattedMessage
                  id="expenses.countMore"
                  defaultMessage="+ {count} more"
                  values={{ count: expense.tags.length - limit }}
                />
              </ExpenseTag>
            )}
          </React.Fragment>
        )
      )}
    </Flex>
  );
};

ExpenseTags.propTypes = {
  isLoading: PropTypes.bool,
  /** Max number of tags to display */
  limit: PropTypes.number,
  /** A render func that gets passed the tag */
  children: PropTypes.func,
  /** A function to build the tag props dynamically */
  getTagProps: PropTypes.func,
  /** Whether current user can edit the tags */
  canEdit: PropTypes.bool,
  /** If canEdit is true, this array is used to display suggested tags */
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  expense: PropTypes.shape({
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
  }),
  /** Whether to show an "Untagged" tag (when used for filtering) */
  showUntagged: PropTypes.bool,
};

ExpenseTags.defaultProps = {
  limit: 4,
};

export default ExpenseTags;
