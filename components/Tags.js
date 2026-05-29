import React from 'react';
import { useMutation } from '@apollo/client';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { styled } from 'styled-components';

import { i18nGraphqlException } from '../lib/errors';
import { gql } from '../lib/graphql/helpers';

import { expenseTagsQuery, UNTAGGED_VALUE } from './dashboard/filters/ExpenseTagsFilter';
import { useToast } from './ui/useToast';
import EditTags, { AutocompleteEditTags } from './EditTags';
import { Flex } from './Grid';
import StyledTag from './StyledTag';

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
  const [setTags, { loading }] = useMutation(setTagsMutation);
  const tagList = expense?.tags || order?.tags;
  const { toast } = useToast();
  const intl = useIntl();

  const onChange = React.useCallback(
    async tags => {
      try {
        const referencedObject = expense ? { expense: { id: expense.id } } : { order: { id: order.id } };
        await setTags({ variables: { ...referencedObject, tags: tags.map(tag => tag.value) } });
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
      }
    },
    [expense, order],
  );

  if (expense) {
    return (
      <AutocompleteEditTags
        disabled={loading}
        value={tagList}
        query={expenseTagsQuery}
        variables={{ account: { slug: expense?.account?.slug } }}
        onChange={onChange}
      />
    );
  }
  return <EditTags disabled={loading} value={tagList} suggestedTags={suggestedTags} onChange={onChange} />;
};

const Tag = styled(StyledTag).attrs({
  variant: 'rounded-right',
})``;

const Tags = ({
  expense = null,
  order = null,
  limit = 4,
  getTagProps = undefined,
  children = undefined,
  canEdit = false,
  suggestedTags = undefined,
  showUntagged = false,
}) => {
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
    <Flex flexWrap="wrap" alignItems="flex-start" gap={2}>
      {canEdit ? (
        <TagsForAdmins expense={expense} order={order} suggestedTags={suggestedTags} />
      ) : (
        tagList && (
          <React.Fragment>
            {tagList.slice(0, limit).map(tag => renderTag({ tag }))}
            {showUntagged &&
              renderTag({
                tag: UNTAGGED_VALUE,
                label: intl.formatMessage(defineMessage({ defaultMessage: 'Untagged', id: '8/OT+O' })),
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

export default Tags;
