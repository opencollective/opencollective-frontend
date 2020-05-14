import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Flex } from '../Grid';
import StyledTag from '../StyledTag';

import ExpenseTypeTag from './ExpenseTypeTag';

const ExpenseTags = ({ expense, isLoading, limit, getTagProps, children }) => {
  return (
    <Flex flexWrap="wrap">
      {expense?.type && <ExpenseTypeTag type={expense.type} legacyId={expense.legacyId} isLoading={isLoading} />}

      {expense?.tags && (
        <React.Fragment>
          {expense.tags.slice(0, limit).map((tag, idx) => {
            const extraTagProps = getTagProps?.(tag) || {};
            const key = `${tag}-${idx}`;
            const renderedTag = (
              <StyledTag key={key} variant="rounded-right" mb="4px" mr="4px" data-cy="expense-tag" {...extraTagProps}>
                {tag}
              </StyledTag>
            );

            return children ? children({ key, tag, renderedTag, props: extraTagProps }) : renderedTag;
          })}
          {expense.tags.length > limit && (
            <StyledTag
              variant="rounded-right"
              mb="4px"
              mr="4px"
              color="black.500"
              title={expense.tags.slice(limit).join(', ')}
            >
              <FormattedMessage
                id="expenses.countMore"
                defaultMessage="+ {count} more"
                values={{ count: expense.tags.length - limit }}
              />
            </StyledTag>
          )}
        </React.Fragment>
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
  expense: PropTypes.shape({
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
  }),
};

ExpenseTags.defaultProps = {
  limit: 4,
};

export default ExpenseTags;
