import React, { useState, Fragment } from 'react';
import styled from 'styled-components';
import { Box, Flex } from '@rebass/grid';
import { FormattedMessage, useIntl, defineMessages } from 'react-intl';
import { File } from '@styled-icons/boxicons-regular/File';
import { Leaf } from '@styled-icons/fa-solid/Leaf';
import { Slack } from '@styled-icons/fa-brands/Slack';
import { ArrowRight } from '@styled-icons/feather/ArrowRight';

import { H3, Span, P } from '../../Text';
import DownArrowHead from '../../icons/DownArrowHeadIcon';
import Container from '../../Container';
import SectionTitle from '../SectionTitle';
import SectionSubtitle from '../SectionSubtitle';
import StyledLink from '../../StyledLink';

const IconWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
`;

const learningChannels = [
  {
    id: 'documentation',
    name: 'Documentation',
    link: 'https://docs.opencollective.com',
  },
  {
    id: 'blog',
    name: 'Blog',
    link: 'https://blog.opencollective.com',
  },
  {
    id: 'slack',
    name: 'Slack channel',
    link: 'https://opencollective.slack.com',
  },
];

const getChannelIcon = channel => {
  switch (channel) {
    case 'documentation':
      return <File size="32" color="#fff" />;
    case 'blog':
      return <Leaf size="32" color="#fff" />;
    case 'slack':
      return <Slack size="32" color="#fff" />;
  }
};

const getBackgroundColor = channel => {
  switch (channel) {
    case 'documentation':
      return 'blue.600';
    case 'blog':
      return '#16B86C';
    case 'slack':
      return '#D60940';
    case 'github':
      return '#5C48E0';
  }
};

const messages = defineMessages({
  'home.learnMore.documentation': {
    id: 'home.learnMore.documentation',
    defaultMessage:
      'Discover how to create an open collective, how to become a fiscal sponsor, how to use our software, our API and much more.',
  },
  'home.learnMore.blog': {
    id: 'home.learnMore.blog',
    defaultMessage:
      'Discover how to create an open collective, how to become a fiscal sponsor, how to use our software, our API and much more.',
  },
  'home.learnMore.slack': {
    id: 'home.learnMore.slack',
    defaultMessage: 'Come meet us, chat with us and share your stories.',
  },
});

const LearnMore = () => {
  const [activeChannel, setActiveChannel] = useState('documentation');
  const intl = useIntl();

  return (
    <Container mx={[3, 4]} my={5} display={[null, null, 'flex']} flexDirection="column" alignItems="center">
      <SectionTitle>
        <FormattedMessage id="home.learMoreSection.title" defaultMessage="Learn more" />
      </SectionTitle>
      <Box width={[1, null, '767px']}>
        <SectionSubtitle textAlign="center">
          <FormattedMessage
            id="home.learMoreSection.subtitle"
            defaultMessage="Our mission is to help organize the world as circles –open circles– where everyone can contribute. We are starting with financial contributions, enabling communities to raise money while staying true to who they are.  Find out more!"
          />
        </SectionSubtitle>
      </Box>
      <Flex flexDirection="column" display={[null, null, 'none']}>
        {learningChannels.map(channel => (
          <Container key={channel.id} my={2} onClick={() => setActiveChannel(channel.id)}>
            <Flex justifyContent="space-between" alignItems="center">
              <Container display="flex" alignItems="center">
                <IconWrapper backgroundColor={getBackgroundColor(channel.id)} p={2} mr={[3, null, 3]}>
                  {getChannelIcon(channel.id)}
                </IconWrapper>
                <H3 fontSize={['H5']} lineHeight={['28px']} letterSpacing={['-0.2px']}>
                  {channel.name}
                </H3>
              </Container>
              {activeChannel !== channel.id && (
                <Span color="blue.600">
                  <DownArrowHead size="32" />
                </Span>
              )}
            </Flex>
            {activeChannel === channel.id && (
              <Container my={3}>
                <Box mb={3}>
                  <P color="#2E3033" fontSize={['15px']} lineHeight={['25px']} letterSpacing={['-0.012em']}>
                    {intl.formatMessage(messages[`home.learnMore.${channel.id}`])}
                  </P>
                </Box>
                <StyledLink href={channel.link} color="blue.600">
                  <Span mr={2} fontSize={'13px'} lineHeight={'16px'}>
                    <FormattedMessage
                      id="home.learnMoreSection.documentation"
                      defaultMessage="View our documentation"
                    />
                  </Span>
                  <Span>
                    <ArrowRight size="14" />
                  </Span>
                </StyledLink>
              </Container>
            )}
          </Container>
        ))}
      </Flex>
      <Container display={['none', null, 'flex']} flexDirection="column" my={4}>
        {learningChannels.map(channel => (
          <Fragment key={channel.id}>
            <Container display="flex">
              <IconWrapper
                backgroundColor={getBackgroundColor(channel.id)}
                p={2}
                mr={[3, null, 5]}
                width={[null, null, '104px']}
                height={[null, null, '136px']}
              >
                {getChannelIcon(channel.id)}
              </IconWrapper>
              <Box width="384px">
                <H3 fontSize={['H5']} lineHeight={['28px']} letterSpacing={['-0.2px']} mb={3}>
                  {channel.name}
                </H3>
                <P color="#2E3033" fontSize={['15px']} lineHeight={['25px']} letterSpacing={['-0.012em']} mb={4}>
                  {intl.formatMessage(messages[`home.learnMore.${channel.id}`])}
                </P>
                <StyledLink href={channel.link} color="blue.600">
                  <Span mr={2} fontSize={'13px'} lineHeight={'16px'}>
                    <FormattedMessage
                      id="home.learnMoreSection.documentation"
                      defaultMessage="View our documentation"
                    />
                  </Span>
                  <ArrowRight size="14" />
                </StyledLink>
              </Box>
            </Container>
            <br></br>
          </Fragment>
        ))}
      </Container>
    </Container>
  );
};

export default LearnMore;
