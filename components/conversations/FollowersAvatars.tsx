import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box } from '../Grid';
import LinkCollective from '../LinkCollective';
import { Span } from '../Text';
import { withUser } from '../UserProvider';

const messages = defineMessages({
  andXOthers: {
    id: 'conversation.followers.rest',
    defaultMessage: '{usersList} and {count, plural, one {one other} other {# others}}',
  },
});

const getFollwersNotDisplayedNames = (followers, maxNbDisplayed) => {
  if (followers.length <= maxNbDisplayed) {
    return null;
  } else {
    return followers
      .slice(maxNbDisplayed)
      .map(c => c.name)
      .join(', ');
  }
};

/**
 * A small list of avatars with a count next to it.
 */
const FollowersAvatars = ({ followers, totalCount, avatarRadius = 24, maxNbDisplayed = 5 }) => {
  const { formatMessage } = useIntl();

  if (!followers || !followers.length) {
    return null;
  }

  const nbNotDisplayed = totalCount - maxNbDisplayed;
  const nbNotFetched = totalCount - followers.length;
  const usersNotDisplayedNames = getFollwersNotDisplayedNames(followers, maxNbDisplayed);
  return (
    <Container display="flex" alignItems="center" fontSize="12px">
      {followers.slice(0, maxNbDisplayed).map(collective => (
        <Box key={collective.id} mr={[-2, 2]}>
          <LinkCollective collective={collective}>
            <Avatar collective={collective} radius={avatarRadius} />
          </LinkCollective>
        </Box>
      ))}
      {nbNotDisplayed > 0 && (
        <Span
          color="black.500"
          title={
            followers.length < totalCount
              ? formatMessage(messages.andXOthers, { count: nbNotFetched, usersList: usersNotDisplayedNames })
              : usersNotDisplayedNames
          }
        >
          +&nbsp;{nbNotDisplayed}
        </Span>
      )}
    </Container>
  );
};

FollowersAvatars.propTypes = {
  /** Max number of followers to display */
  maxNbDisplayed: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  avatarRadius: PropTypes.number.isRequired,
  followers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
    }),
  ),
};

export default withUser(FollowersAvatars);
