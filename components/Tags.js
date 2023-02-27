import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import ExpenseTypeTag from './expenses/ExpenseTypeTag';
import { Flex } from './Grid';
import StyledInputTags from './StyledInputTags';
import StyledTag from './StyledTag';
import { TOAST_TYPE, useToasts } from './ToastProvider';

const setTagsMutation = gql`
  mutation SetTags($order: OrderReferenceInput, $expense: ExpenseReferenceInput, $tags: [String!]!) {
    setTags(expense: $expense, order: $order, tags: $tags) {
      order {
        id
        tags
      }
      expense {
        id
        tags
      }
    }
  }
`;

/**
 * Display expense tags, with the ability to edit them. Triggers a migration whenever a tag changes.
 */
const TagsForAdmins = ({ expense, order, suggestedTags }) => {
  const [setTags, { loading }] = useMutation(setTagsMutation, { context: API_V2_CONTEXT });
  const tagList = expense?.tags || order?.tags;
  const { addToast } = useToasts();
  const intl = useIntl();
  return (
    <StyledInputTags
      disabled={loading}
      value={tagList}
      suggestedTags={suggestedTags}
      onChange={async tags => {
        try {
          const referencedObject = expense ? { expense: { id: expense.id } } : { order: { id: order.id } };
          await setTags({ variables: { ...referencedObject, tags: tags.map(tag => tag.value) } });
        } catch (e) {
          addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
        }
      }}
    />
  );
};

TagsForAdmins.propTypes = {
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  expense: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
  }),
  order: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
  }),
};

const Tag = styled(StyledTag).attrs({
  mb: '4px',
  mr: '4px',
  variant: 'rounded-right',
})``;

const Tags = ({ expense, order, isLoading, limit, getTagProps, children, canEdit, suggestedTags, showUntagged }) => {
  const intl = useIntl();
  const tagList = expense?.tags || order?.tags;

  const renderTag = ({ tag, label }) => {
    const extraTagProps = getTagProps?.(tag) || {};

    const renderedTag = (
      <Tag key={tag} data-cy="expense-tag" {...extraTagProps}>
        {label ?? tag}
      </Tag>
    );

    return children ? children({ key: tag, tag, renderedTag, props: extraTagProps }) : renderedTag;
  };
  return (
    <Flex flexWrap="wrap" alignItems="flex-start">
      {expense?.type && <ExpenseTypeTag type={expense.type} legacyId={expense.legacyId} isLoading={isLoading} />}

      {canEdit ? (
        <TagsForAdmins expense={expense} order={order} suggestedTags={suggestedTags} />
      ) : (
        tagList && (
          <React.Fragment>
            {tagList.slice(0, limit).map(tag => renderTag({ tag }))}
            {showUntagged &&
              renderTag({
                tag: 'untagged',
                label: intl.formatMessage(defineMessage({ defaultMessage: 'Untagged' })),
              })}

            {tagList.length > limit && (
              <Tag color="black.600" title={tagList.slice(limit).join(', ')}>
                <FormattedMessage
                  id="expenses.countMore"
                  defaultMessage="+ {count} more"
                  values={{ count: tagList.length - limit }}
                />
              </Tag>
            )}
          </React.Fragment>
        )
      )}
    </Flex>
  );
};

Tags.propTypes = {
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
    id: PropTypes.string,
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
  }),
  order: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
  }),
  /** Whether to show an "Untagged" tag (when used for filtering) */
  showUntagged: PropTypes.bool,
};

Tags.defaultProps = {
  limit: 4,
};

export default Tags;
