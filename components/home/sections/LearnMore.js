import React, { Fragment } from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../../Container';
import { Box } from '../../Grid';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
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

const IllustrationWrapper = styled(Box)`
  background-image: url('/static/images/home/donate-button-bg-sm.png');
  background-size: 100% 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const learningChannels = [
  {
    id: 'slack',
    name: 'Slack',
    link: 'https://slack.opencollective.com',
  },
  {
    id: 'documentation',
    name: 'Documentation',
    link: 'https://docs.opencollective.com',
  },
  {
    id: 'openSourceCode',
    name: 'Open Source code',
    link: 'https://github.com/opencollective/opencollective',
  },
  {
    id: 'blog',
    name: 'Blog',
    link: 'https://blog.opencollective.com',
  },
  {
    id: 'openFinances',
    name: 'Open Finances',
    link: '#',
  },
  {
    id: 'openCompany',
    name: 'Open Company',
    link: '#',
  },
];

const messages = defineMessages({
  'home.learnMore.documentation': {
    id: 'home.learnMore.documentation',
    defaultMessage: 'Support your community with fundholding and fiscal sponsorship services. Learn more',
  },
  'home.learnMore.documentation.buttonText': {
    id: 'home.learnMore.buttonText',
    defaultMessage: 'View our documentation {arrowIcon}',
  },
  'home.learnMore.blog': {
    id: 'home.learnMore.blog',
    defaultMessage: 'Come meet the team, chat with the community, and share your questions and stories.',
  },
  'home.learnMore.blog.buttonText': {
    id: 'home.learnMore.blog.buttonText',
    defaultMessage: 'Visit our blog {arrowIcon}',
  },
  'home.learnMore.slack': {
    id: 'home.learnMore.slack',
    defaultMessage: 'Come meet the team, chat with the community, and share your questions and stories.',
  },
  'home.learnMore.slack.buttonText': {
    id: 'home.learnMore.slack.buttonText',
    defaultMessage: 'Join our slack {arrowIcon}',
  },
  'home.learnMore.openSourceCode': {
    id: 'home.learnMore.OpenSourceCode',
    defaultMessage: 'Everything we do is open source.',
  },
  'home.learnMore.openSourceCode.buttonText': {
    id: 'home.learnMore.openSourceCode.buttonText',
    defaultMessage: 'See our code base {arrowIcon}',
  },
  'home.learnMore.openFinances': {
    id: 'home.learnMore.openFinances',
    defaultMessage: 'We operate as an Open Collective ourselves, with transparent budgets.',
  },
  'home.learnMore.openFinances.buttonText': {
    id: 'home.learnMore.openFinances.buttonText',
    defaultMessage: 'See our Collectives {arrowIcon}',
  },
  'home.learnMore.openCompany': {
    id: 'home.learnMore.openCompany',
    defaultMessage: 'Our metrics, financials, and other documents are public.',
  },
  'home.learnMore.openCompany.buttonText': {
    id: 'home.learnMore.openCompany.buttonText',
    defaultMessage: 'See our public company {arrowIcon}',
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
        alignItems={['flex-start', 'center', null, null, 'baseline']}
        my={4}
        ml={[3, 0]}
        flexWrap={[null, 'wrap']}
        justifyContent="space-between"
      >
        {learningChannels.map(channel => (
          <Fragment key={channel.id}>
            <Container display="flex" flexDirection="column" alignItems="flex-start" my={[2, null, null, null, 4]}>
              <IconWrapper my={2}>
                <Illustration
                  src={`/static/images/home/${channel.id}-illustration.png`}
                  alt={`${channel.id} illustration`}
                />
              </IconWrapper>
              <Box width={['288px', '306px', null, null, '289px']} height={[null, null, null, null, null]}>
                <H3 fontSize={['20px']} lineHeight={['28px']} letterSpacing={['-0.6px']} mb={2} color="black.800">
                  {channel.name}
                </H3>
                <P
                  color={['black.700', 'black.600']}
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
                  fontSize={['15px']}
                  lineHeight={['23px']}
                  letterSpacing="-0.12px"
                  my={2}
                >
                  {intl.formatMessage(messages[`home.learnMore.${channel.id}.buttonText`], {
                    arrowIcon: <ArrowRight2 size="15" color="#DC5F7D" />,
                  })}
                </StyledLink>
              </Box>
            </Container>
          </Fragment>
        ))}
      </Container>
      <Container display="flex" flexDirection={['column', 'row']} alignItems="center" justifyContent="center">
        <Box width={['288px', '332px', null, null, '360px']} textAlign={['center', 'left']} mr={[null, 4]}>
          <H3 color="color.800" fontSize={['24px']} lineHeight={['32px']} letterSpacing={['-0.12px']} my={2}>
            <FormattedMessage id="home.contributeToPlatform" defaultMessage="Contribute to the platform!" />
          </H3>
          <P color="color.700" fontSize={['18px']} lineHeight={['27px']} letterSpacing={['-0.2px']} my={3}>
            <FormattedMessage
              id="home.contributeToPlatform.description"
              defaultMessage="Open Collective is free for charitable initiatives. We rely on generosity of contributors like you to make this possible."
            />
          </P>
        </Box>
        <IllustrationWrapper width={['287px']} height={['300px']} my={3} ml={[null, 4]}>
          <Link route="/create">
            <StyledButton buttonStyle="dark" minWidth={'97'}>
              <FormattedMessage id="home.donate" defaultMessage="Donate" />
            </StyledButton>
          </Link>
        </IllustrationWrapper>
      </Container>
    </Container>
  );
};

export default LearnMore;
