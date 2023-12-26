import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Avatar from '../Avatar';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import { P } from '../Text';

export const CommentMetadata = ({ comment }) => {
  return (
    <Flex>
      <Box mr={3}>
        <LinkCollective collective={comment.fromAccount}>
          <Avatar collective={comment.fromAccount} radius={40} />
        </LinkCollective>
      </Box>
      <Flex flexDirection="column">
        <LinkCollective
          collective={comment.fromAccount}
          withHoverCard
          hoverCardProps={{
            hoverCardContentProps: { side: 'top' },
            includeAdminMembership: { accountSlug: comment.account?.slug, hostSlug: comment.account?.host?.slug },
          }}
        >
          <P color="black.800" fontWeight="500" lineHeight="22px" truncateOverflow>
            {comment.fromAccount.name}
          </P>
        </LinkCollective>
        <P fontSize="12px" color="black.600" truncateOverflow title={comment.createdAt}>
          <FormattedMessage
            id="Comment.PostedOn"
            defaultMessage="Posted on {createdAt, date, long}"
            values={{ createdAt: new Date(comment.createdAt) }}
          />
        </P>
      </Flex>
    </Flex>
  );
};

CommentMetadata.propTypes = {
  comment: PropTypes.shape({
    fromAccount: PropTypes.shape({
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }).isRequired,
    createdAt: PropTypes.string.isRequired,
    account: PropTypes.shape({
      slug: PropTypes.string,
      host: PropTypes.shape({
        slug: PropTypes.string,
      }),
    }),
  }).isRequired,
};
