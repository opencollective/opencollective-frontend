import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import { IncognitoAvatar } from './Avatar';
import { Flex } from './Grid';
import Page from './Page';

const messages = defineMessages({
  title: {
    id: 'profile.guest',
    defaultMessage: 'Guest',
  },
  description: {
    id: 'GuestProfile.description',
    defaultMessage: 'This contributor has not joined Open Collective yet',
  },
});

const GuestUserProfile = ({ account }) => {
  const intl = useIntl();
  const title = intl.formatMessage(messages.title);
  const description = intl.formatMessage(messages.description);
  return (
    <Page noRobots title={title} description={description} collective={{ account }}>
      <Flex justifyContent="center" alignItems="center" flexDirection="column" my={[4, 5]}>
        <IncognitoAvatar />
        <h1>{title}</h1>
        <p>{description}</p>
        <p>¯\_(ツ)_/¯</p>
      </Flex>
    </Page>
  );
};

GuestUserProfile.propTypes = {
  account: PropTypes.object,
};

export default GuestUserProfile;
