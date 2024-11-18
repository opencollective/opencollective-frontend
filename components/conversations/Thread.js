import React from 'react';
import PropTypes from 'prop-types';
import { NotepadText } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import styled, { withTheme } from 'styled-components';

import { CommentType } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import CommentIconLib from '../icons/CommentIcon';
import StyledButton from '../StyledButton';
import { Separator } from '../ui/Separator';
import { withUser } from '../UserProvider';

import { getActivityIcon, isSupportedActivity } from './activity-helpers';
import Comment from './Comment';
import SmallThread from './SmallThread';
import ThreadActivity from './ThreadActivity';

const CommentIcon = styled(CommentIconLib).attrs({
  size: 16,
  color: '#9a9a9a',
})``;

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
      {items.map(item =>
        item.__typename === 'Comment' ? (
          <React.Fragment key={`${item.__typename}-${item.id}`}>
            <div className={cn('flex', item.type === CommentType.PRIVATE_NOTE && 'bg-amber-50')}>
              <Flex flexDirection="column" alignItems="center" flex="0 0 40px">
                <Box my={2}>
                  {item.type === CommentType.PRIVATE_NOTE ? (
                    <NotepadText className="text-amber-500" size={20} />
                  ) : (
                    <CommentIcon />
                  )}
                </Box>
                <Container width="1px" height="100%" background="#E8E9EB" />
              </Flex>
              <div className="flex-grow p-4 pl-0">
                <Comment
                  comment={item}
                  canDelete={isAdmin || Boolean(LoggedInUser && LoggedInUser.canEditComment(item))}
                  canEdit={Boolean(LoggedInUser && LoggedInUser.canEditComment(item))}
                  canReply={Boolean(LoggedInUser)}
                  onDelete={onCommentDeleted}
                  reactions={item.reactions}
                  onReplyClick={getClickedComment}
                />
              </div>
            </div>
            <Separator />
          </React.Fragment>
        ) : item.__typename === 'Activity' ? (
          !isSupportedActivity(item) ? null : (
            <React.Fragment key={`${item.__typename}-${item.id}`}>
              <Flex>
                <Flex flexDirection="column" alignItems="center" width="40px">
                  <Box my={2}>{getActivityIcon(item, theme)}</Box>
                  <Container width="1px" height="100%" background="#E8E9EB" />
                </Flex>
                <div className="p-4 pl-0">
                  <ThreadActivity key={item.id} activity={item} />
                </div>
              </Flex>
              <Separator />
            </React.Fragment>
          )
        ) : null,
      )}
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

const DefaultThreadVariant = React.memo(withUser(withTheme(Thread)));

/**
 *
 * @param {import('./types').ThreadPropsWithVariant} props
 */
export default function ThreadComponent(props) {
  // eslint-disable-next-line react/prop-types
  if (props.variant === 'small') {
    return <SmallThread {...props} />;
  }

  return <DefaultThreadVariant {...props} />;
}
