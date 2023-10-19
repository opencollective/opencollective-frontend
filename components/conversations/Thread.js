import React from 'react';
import PropTypes from 'prop-types';
import { Lock } from '@styled-icons/material/Lock';
import { FormattedMessage } from 'react-intl';
import styled, { css, withTheme } from 'styled-components';

import commentTypes from '../../lib/constants/commentTypes';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import CommentIconLib from '../icons/CommentIcon';
import StyledButton from '../StyledButton';
import { withUser } from '../UserProvider';

import Comment from './Comment';
import ThreadActivity, { getActivityIcon, isSupportedActivity } from './ThreadActivity';

const CommentIcon = styled(CommentIconLib).attrs({
  size: 16,
  color: '#9a9a9a',
})``;

const NoteIcon = styled(Lock).attrs(props => ({
  size: 16,
  color: props.theme.colors.blue[400],
}))``;

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
const Thread = ({
  collective,
  items,
  onCommentDeleted,
  LoggedInUser,
  theme,
  hasMore,
  fetchMore,
  getClickedComment,
}) => {
  const [loading, setLoading] = React.useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  const isAdmin = LoggedInUser && LoggedInUser.isAdminOfCollective(collective);

  const handleLoadMore = async () => {
    setLoading(true);
    await fetchMore();
    setLoading(false);
  };

  return (
    <div data-cy="thread">
      {items.map((item, idx) => {
        switch (item.__typename) {
          case 'Comment': {
            const isPrivateNote = item.type === commentTypes.PRIVATE_NOTE;
            return (
              <Box key={`comment-${item.id}`}>
                <Flex>
                  <Flex flexDirection="column" alignItems="center" width="40px">
                    <Box my={2}>{isPrivateNote ? <NoteIcon /> : <CommentIcon />}</Box>
                    <Container
                      width="1px"
                      height="100%"
                      background={isPrivateNote ? theme.colors.blue[400] : '#E8E9EB'}
                    />
                  </Flex>
                  <ItemContainer isLast={idx + 1 === items.length}>
                    <Comment
                      comment={item}
                      canDelete={isAdmin || Boolean(LoggedInUser && LoggedInUser.canEditComment(item))}
                      canEdit={Boolean(LoggedInUser && LoggedInUser.canEditComment(item))}
                      canReply={Boolean(LoggedInUser)}
                      onDelete={onCommentDeleted}
                      reactions={item.reactions}
                      onReplyClick={getClickedComment}
                    />
                  </ItemContainer>
                </Flex>
              </Box>
            );
          }
          case 'Activity':
            return !isSupportedActivity(item) ? null : (
              <Box key={`activity-${item.id}`}>
                <Flex>
                  <Flex flexDirection="column" alignItems="center" width="40px">
                    <Box my={2}>{getActivityIcon(item, theme)}</Box>
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
      <hr className="my-5" />
      {hasMore && fetchMore && (
        <Container margin="0.65rem">
          <StyledButton onClick={handleLoadMore} loading={loading} textTransform="capitalize">
            <FormattedMessage id="loadMore" defaultMessage="load more" /> ↓
          </StyledButton>
        </Container>
      )}
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
  /** Indicate whether there are more comments to fetch */
  hasMore: PropTypes.bool,
  /** function to fetch more comments */
  fetchMore: PropTypes.func,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
  /** @ignore from withTheme */
  theme: PropTypes.object,
  getClickedComment: PropTypes.func,
};

export default React.memo(withUser(withTheme(Thread)));
