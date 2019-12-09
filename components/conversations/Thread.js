import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled, { css } from 'styled-components';

import { MessageSquare } from '@styled-icons/feather/MessageSquare';

import { withUser } from '../UserProvider';
import Comment from './Comment';
import Container from '../Container';

const CommentIcon = styled(MessageSquare).attrs({
  size: 16,
  color: '#9a9a9a',
})`
  transform: scaleX(-1);
  margin-top: 8px;
`;

const CommentContainer = styled.div`
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
const Thread = ({ items, onCommentDeleted, LoggedInUser }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div>
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
                  <CommentContainer isLast={idx + 1 === items.length}>
                    <Comment
                      comment={item}
                      canEdit={Boolean(LoggedInUser && LoggedInUser.canEditComment(item))}
                      onDelete={onCommentDeleted}
                    />
                  </CommentContainer>
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
      __typename: PropTypes.oneOf(['Comment']),
    }),
  ),
  /** Called when a comment get deleted */
  onCommentDeleted: PropTypes.func,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
};

export default withUser(Thread);
