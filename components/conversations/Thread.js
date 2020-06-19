import React from 'react';
import PropTypes from 'prop-types';
import styled, { css, withTheme } from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import CommentIconLib from '../icons/CommentIcon';
import { withUser } from '../UserProvider';

import Comment from './Comment';
import ThreadActivity, { getActivityIcon, isSupportedActivity } from './ThreadActivity';

const CommentIcon = styled(CommentIconLib).attrs({
  size: 16,
  color: '#9a9a9a',
})`
  margin-top: 8px;
`;

const ItemContainer = styled.div`
  width: 100%;

  ${props =>
    !props.isLast &&
    css`
      padding-bottom: 16px;
      margin-bottom: 16px;
      border-bottom: 1px dashed #d3d6da;
    `}
`;

/**
 * A thread is meant to display comments and activities in a chronological order.
 */
const Thread = ({ collective, items, onCommentDeleted, LoggedInUser, theme }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const isAdmin = LoggedInUser && LoggedInUser.canEditCollective(collective);
  return (
    <div data-cy="thread">
      {items.map((item, idx) => {
        switch (item.__typename) {
          case 'Comment':
            return (
              <Box key={`comment-${item.id}`}>
                <Flex>
                  <Flex flexDirection="column" alignItems="center" width="40px">
                    <Box mb={2}>
                      <CommentIcon />
                    </Box>
                    <Container width="1px" height="100%" background="#E8E9EB" />
                  </Flex>
                  <ItemContainer isLast={idx + 1 === items.length}>
                    <Comment
                      comment={item}
                      canDelete={isAdmin || Boolean(LoggedInUser && LoggedInUser.canEditComment(item))}
                      canEdit={Boolean(LoggedInUser && LoggedInUser.canEditComment(item))}
                      canReply={Boolean(LoggedInUser)}
                      onDelete={onCommentDeleted}
                      reactions={item.reactions}
                    />
                  </ItemContainer>
                </Flex>
              </Box>
            );
          case 'Activity':
            return !isSupportedActivity(item) ? null : (
              <Box key={`activity-${item.id}`}>
                <Flex>
                  <Flex flexDirection="column" alignItems="center" width="40px">
                    <Box mb={2}>{getActivityIcon(item, theme)}</Box>
                    <Container width="1px" height="100%" background="#E8E9EB" />
                  </Flex>
                  <ItemContainer isLast={idx + 1 === items.length}>
                    <ThreadActivity key={item.id} activity={item} />
                  </ItemContainer>
                </Flex>
              </Box>
            );
          default:
            return null;
        }
      })}
      <hr />
    </div>
  );
};

Thread.propTypes = {
  /** The list of items to display, sorted by chronoligal order */
  items: PropTypes.arrayOf(
    PropTypes.shape({
      __typename: PropTypes.oneOf(['Comment', 'Activity']),
      id: PropTypes.string.isRequired,
    }),
  ),
  /** Called when a comment get deleted */
  onCommentDeleted: PropTypes.func,
  /** Collective where the thread is created */
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }).isRequired,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
  /** @ignore from withTheme */
  theme: PropTypes.object,
};

export default withUser(withTheme(Thread));
