import React, { Fragment } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../../Container';
import { Box } from '../../Grid';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import { flicker } from '../../StyledKeyframes';
import StyledLink from '../../StyledLink';
import { H3, P } from '../../Text';
import Illustration from '../HomeIllustration';

const IconWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 56px;
  height: 56px;

  @media screen and (min-width: 88em) {
    width: 56px;
    height: 56px;
  }
`;

const DonateButtonBGHover = styled.img.attrs({ src: '/static/images/home/donateButton-bg-withStar.png' })`
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.2s;
`;

const DonateButtonBG = styled.img.attrs({ src: '/static/images/home/donateButton-bg.png' })`
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
`;

const DonateButtonWrapper = styled(Box)`
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:hover {
    ${DonateButtonBGHover} {
      opacity: 1;
      animation: ${flicker({ minOpacity: 0.7 })} 1s infinite;
      animation-delay: 0.2s;
    }
  }
`;

const DonateButton = styled(StyledButton)`
  pointer-events: auto;
`;

const learningChannels = [
  {
    id: 'slack',
    name: 'Slack',
    link: 'https://slack.opencollective.com',
    desktopItemOrder: 2,
  },
  {
    id: 'documentation',
    name: 'Documentation',
    link: 'https://docs.opencollective.com',
    desktopItemOrder: 1,
  },
  {
    id: 'openSourceCode',
    name: 'Open Source code',
    link: 'https://github.com/opencollective/opencollective',
    desktopItemOrder: 4,
  },
  {
    id: 'blog',
    name: 'Blog',
    link: 'https://blog.opencollective.com',
    desktopItemOrder: 3,
  },
  {
    id: 'openFinances',
    name: 'Open Finances',
    link: 'https://opencollective.com/opencollective',
    desktopItemOrder: 5,
  },
  {
    id: 'openCompany',
    name: 'Open Company',
    link: 'https://drive.opencollective.com',
    desktopItemOrder: 6,
  },
];

const messages = defineMessages({
  'home.learnMore.documentation': {
    id: 'home.learnMore.documentation',
    defaultMessage: 'Support your community with fundholding and fiscal sponsorship services.',
  },
  'home.learnMore.documentation.buttonText': {
    id: 'home.learnMore.buttonText',
    defaultMessage: 'View our documentation',
  },
  'home.learnMore.blog': {
    id: 'home.learnMore.blog',
    defaultMessage: 'Case studies, news, and how groups around the world use Open Collective.',
  },
  'home.learnMore.blog.buttonText': {
    id: 'home.learnMore.blog.buttonText',
    defaultMessage: 'Visit our blog',
  },
  'home.learnMore.slack': {
    id: 'home.learnMore.slack',
    defaultMessage: 'Come meet the team, chat with the community, and share your questions and stories.',
  },
  'home.learnMore.slack.buttonText': {
    id: 'home.learnMore.slack.buttonText',
    defaultMessage: 'Join our slack',
  },
  'home.learnMore.openSourceCode': {
    id: 'home.learnMore.OpenSourceCode',
    defaultMessage:
      'Our code base is open source, you can branch or contribute in different ways in GitHub. Check it out!',
  },
  'home.learnMore.openSourceCode.buttonText': {
    id: 'home.learnMore.openSourceCode.buttonText',
    defaultMessage: 'See our code base',
  },
  'home.learnMore.openFinances': {
    id: 'home.learnMore.openFinances',
    defaultMessage: 'We operate as an Open Collective ourselves, with transparent budgets.',
  },
  'home.learnMore.openFinances.buttonText': {
    id: 'home.learnMore.openFinances.buttonText',
    defaultMessage: 'See our Collectives',
  },
  'home.learnMore.openCompany': {
    id: 'home.learnMore.openCompany',
    defaultMessage: 'Our metrics, financials, and other documents are public.',
  },
  'home.learnMore.openCompany.buttonText': {
    id: 'home.learnMore.openCompany.buttonText',
    defaultMessage: 'See our public company',
  },
});

const LearnMore = () => {
  const intl = useIntl();

  return (
    <Container
      mx={[3, 4]}
      my={4}
      display={[null, 'flex']}
      flexDirection={[null, 'column']}
      justifyContent="center"
      alignItems="center"
    >
      <Container
        width={[null, '650px', '704px', null, '1150px']}
        display="flex"
        flexDirection={['column', 'row']}
        alignItems={['center', null, null, null, 'baseline']}
        my={4}
        ml={[3, 0]}
        flexWrap={[null, 'wrap']}
        justifyContent="space-between"
      >
        {learningChannels.map(channel => (
          <Fragment key={channel.id}>
            <Container
              display="flex"
              flexDirection="column"
              alignItems="flex-start"
              my={[2, null, null, null, 4]}
              order={[null, channel.desktopItemOrder]}
            >
              <IconWrapper my={2}>
                <Illustration
                  src={`/static/images/home/${channel.id}-illustration.png`}
                  alt={`${channel.id} illustration`}
                />
              </IconWrapper>
              <Box width={['288px', '306px', null, null, '289px']}>
                <H3 fontSize="20px" lineHeight="28px" letterSpacing="-0.6px" mb={2} color="black.800">
                  {channel.name}
                </H3>
                <P
                  color={['black.700', 'black.600', 'black.700']}
                  fontSize={['15px', '16px', null, null, '18px']}
                  lineHeight={['23px', '24px', null, null, '27px']}
                  letterSpacing={['-0.12px', '-0.16px']}
                  mb={3}
                >
                  {intl.formatMessage(messages[`home.learnMore.${channel.id}`])}
                </P>
                <StyledLink
                  href={channel.link}
                  color="#DC5F7D"
                  fontSize="15px"
                  lineHeight="23px"
                  letterSpacing="-0.12px"
                  my={2}
                >
                  {intl.formatMessage(messages[`home.learnMore.${channel.id}.buttonText`])}&nbsp;→
                </StyledLink>
              </Box>
            </Container>
          </Fragment>
        ))}
      </Container>
      <Container display="flex" flexDirection={['column', 'row']} alignItems="center" justifyContent="center">
        <Box width={['288px', '332px', null, null, '360px']} textAlign={['center', 'left']} mr={[null, 4]}>
          <H3 color="color.800" fontSize="24px" lineHeight="32px" letterSpacing="-0.12px" my={2}>
            <FormattedMessage id="home.contributeToPlatform" defaultMessage="Contribute to the platform!" />
          </H3>
          <P color="color.700" fontSize="18px" lineHeight="27px" letterSpacing="-0.2px" my={3}>
            <FormattedMessage
              id="home.contributeToPlatform.description"
              defaultMessage="Open Collective is free for charitable initiatives. We rely on generosity of contributors like you to make this possible."
            />
          </P>
        </Box>
        <DonateButtonWrapper width="287px" height="300px" my={3} ml={[null, 4]}>
          <DonateButtonBG />
          <DonateButtonBGHover />
          <Link route="/opencollective/donate">
            <DonateButton buttonStyle="dark" minWidth={'97'}>
              <FormattedMessage id="home.donate" defaultMessage="Donate" />
            </DonateButton>
          </Link>
        </DonateButtonWrapper>
      </Container>
    </Container>
  );
};

export default LearnMore;
