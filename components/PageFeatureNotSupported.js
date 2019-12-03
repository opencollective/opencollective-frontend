import React from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { Flex } from '@rebass/grid';
import Page from './Page';
import { H1, P } from './Text';

const messages = defineMessages({
  title: {
    id: 'FeatureNotSupported.title',
    defaultMessage: 'Feature not supported',
  },
  description: {
    id: 'FeatureNotSupported.description',
    defaultMessage:
      'This feature is not activated for this collective. Please contact support@opencollective.com for more details.',
  },
});

/**
 * A page to show when the feature is not supported by the collective.
 * Ensures the page is not referenced by robots.
 */
const PageFeatureNotSupported = props => {
  const { formatMessage } = useIntl();
  const title = formatMessage(messages.title);
  return (
    <Page noRobots title={title} {...props}>
      <Flex flexDirection="column" justifyContent="center" alignItems="center" px={2} py={[5, 6]}>
        <H1 mb={3}>{title}</H1>
        <P fontSize="64px" mt={3} mb={5}>
          🙈️
        </P>
        <P>{formatMessage(messages.description)}</P>
      </Flex>
    </Page>
  );
};

export default PageFeatureNotSupported;
