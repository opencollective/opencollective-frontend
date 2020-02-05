import React, { Fragment } from 'react';
import styled from 'styled-components';
import { Box } from '@rebass/grid';
import { FormattedMessage, useIntl, defineMessages } from 'react-intl';

import { H3, P } from '../../Text';
import { HomeStandardLink } from '../HomeLinks';
import Container from '../../Container';
import SectionTitle from '../SectionTitle';
import Illustration from '../HomeIllustration';

const IconWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;

  @media screen and (min-width: 88em) {
    width: 56px;
    height: 56px;
  }
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

const messages = defineMessages({
  'home.learnMore.documentation': {
    id: 'home.learnMore.documentation',
    defaultMessage:
      'Discover how to create an open collective, how to become a fiscal sponsor, how to use our software, our API and much more.',
  },
  'home.learnMore.documentation.buttonText': {
    id: 'home.learnMore.buttonText',
    defaultMessage: 'View our documentation',
  },
  'home.learnMore.blog': {
    id: 'home.learnMore.blog',
    defaultMessage:
      'Stay up to date with the latest news, collectives and sponsors’ stories. Our newsletter and updates are regularly published as well.',
  },
  'home.learnMore.blog.buttonText': {
    id: 'home.learnMore.blog.buttonText',
    defaultMessage: 'Visit our blog',
  },
  'home.learnMore.slack': {
    id: 'home.learnMore.slack',
    defaultMessage: 'Come meet us, chat with us and share your stories.',
  },
  'home.learnMore.slack.buttonText': {
    id: 'home.learnMore.slack.buttonText',
    defaultMessage: 'Join our slack',
  },
});

const LearnMore = () => {
  const intl = useIntl();

  return (
    <Container
      mx={[3, 4]}
      my={4}
      display={[null, null, 'flex']}
      alignItems="center"
      justifyContent={[null, null, 'space-between', 'space-around', 'center']}
    >
      <Container mr={[null, null, null, null, 7]}>
        <SectionTitle>
          <FormattedMessage id="home.learnMore" defaultMessage="Learn more" />
        </SectionTitle>
        <Box width={[1, null, '359px']}>
          <P fontSize="15px" fontHeight="25px" letterSpacing="-0.016em" color="black.600">
            <FormattedMessage
              id="home.learMoreSection.subtitle"
              defaultMessage="Our mission is to help organize the world in open circles, where everyone can contribute. We are starting with financial contributions, enabling communities to raise money while staying true to who they are."
            />
          </P>
        </Box>
      </Container>
      <Container display="flex" flexDirection={['column']} my={4}>
        {learningChannels.map(channel => (
          <Fragment key={channel.id}>
            <Container display="flex" alignItems="center" my={2}>
              <IconWrapper mr={4}>
                <Illustration
                  src={`/static/images/${channel.id}-illustration.png`}
                  alt={`${channel.id} illustration`}
                />
              </IconWrapper>
              <Box width={['208px', null, '367px', null, '416px']}>
                <H3
                  fontSize={['15px', 'H5']}
                  lineHeight={['25px', '28px']}
                  letterSpacing={['-0.008em', '-0.2px']}
                  mb={2}
                >
                  {channel.name}
                </H3>
                <P
                  color="rgba(68, 51, 68, 0.7)"
                  fontSize={['Caption', '15px']}
                  lineHeight={['19px', '25px']}
                  letterSpacing="-0.016em"
                  mb={3}
                >
                  {intl.formatMessage(messages[`home.learnMore.${channel.id}`])}
                </P>
                <HomeStandardLink href={channel.link}>
                  {intl.formatMessage(messages[`home.learnMore.${channel.id}.buttonText`])}
                </HomeStandardLink>
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
