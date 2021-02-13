import React from 'react';
import PropTypes from 'prop-types';
import { size } from 'lodash';
import NextLink from 'next/link';
import { defineMessages, FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import CommentIcon from '../icons/CommentIcon';
import LinkCollective from '../LinkCollective';
import StyledCard from '../StyledCard';
import { H5, P } from '../Text';

import FollowersAvatars from './FollowersAvatars';

const messages = defineMessages({
  commentsCount: {
    id: 'comments.count',
    defaultMessage: '{n, plural, one {# comment} other {# comments}}',
  },
});

const ConversationListItem = ({ conversation, collectiveSlug }) => {
  const { formatMessage } = useIntl();
  const { id, slug, title, summary, createdAt, fromCollective, followers, stats } = conversation;
  const hasFollowers = followers && size(followers.nodes) > 0;
  const hasComments = stats && stats.commentsCount > 0;
  return (
    <Flex>
      <Box mr={3}>
        <LinkCollective collective={fromCollective}>
          <Avatar collective={fromCollective} radius={40} />
        </LinkCollective>
      </Box>
      <div>
        <NextLink href={`${collectiveSlug}/conversations/${slug}-${id}`}>
          <H5 wordBreak="break-word" mb={2}>
            {title}
          </H5>
        </NextLink>
        <P color="black.500" fontSize="12px">
          <FormattedMessage
            id="update.publishedAtBy"
            defaultMessage="Published on {date} by {author}"
            values={{
              date: <FormattedDate value={createdAt} day="numeric" month="long" year="numeric" />,
              author: <LinkCollective collective={fromCollective} />,
            }}
          />
        </P>
        <P
          color="black.700"
          mt={2}
          fontSize="13px"
          dangerouslySetInnerHTML={{ __html: summary }}
          data-cy="conversation-preview"
        />
        {(hasFollowers || hasComments) && (
          <Flex mt={3} alignItems="center">
            {hasFollowers && (
              <Box mr={3}>
                <FollowersAvatars
                  followers={followers.nodes}
                  totalCount={followers.totalCount}
                  maxNbDisplayed={3}
                  avatarRadius={24}
                />
              </Box>
            )}
            {hasComments && (
              <Container
                display="flex"
                alignItems="center"
                color="black.500"
                title={formatMessage(messages.commentsCount, { n: stats.commentsCount })}
                fontSize="12px"
                data-cy="replies-count"
              >
                <CommentIcon size="1em" color="#9D9FA3" />
                &nbsp;
                {stats.commentsCount}
              </Container>
            )}
          </Flex>
        )}
      </div>
    </Flex>
  );
};

ConversationListItem.propTypes = {
  collectiveSlug: PropTypes.string.isRequired,
  conversation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    fromCollective: PropTypes.shape({
      type: PropTypes.string,
      slug: PropTypes.string.isRequired,
    }).isRequired,
    followers: PropTypes.shape({
      totalCount: PropTypes.number,
      nodes: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
        }),
      ),
    }),
    stats: PropTypes.shape({
      commentsCount: PropTypes.number,
    }),
  }),
};

/**
 * Displays a list of conversations
 */
const ConversationsList = ({ collectiveSlug, conversations }) => {
  if (!conversations || conversations.length === 0) {
    return null;
  }

  return (
    <StyledCard>
      {conversations.map((conversation, idx) => (
        <Container key={conversation.id} borderTop={!idx ? undefined : '1px solid'} borderColor="black.300" p={3}>
          <ConversationListItem collectiveSlug={collectiveSlug} conversation={conversation} />
        </Container>
      ))}
    </StyledCard>
  );
};

ConversationsList.propTypes = {
  collectiveSlug: PropTypes.string.isRequired,
  conversations: PropTypes.arrayOf(PropTypes.object),
};

export default ConversationsList;
