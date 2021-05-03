import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import SectionSubtitle from '../home/SectionSubtitle';
import SectionTitle from '../home/SectionTitle';
import StyledLink from '../StyledLink';
import { H3, P } from '../Text';

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

const learningChannels = [
  {
    id: 'slack',
    name: 'Slack',
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
    defaultMessage: 'Our code is open source. You can contribute! Check it out on GitHub.',
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

const WhoIsFiscalHosting = () => {
  const intl = useIntl();

  return (
    <React.Fragment>
      <Flex
        display="flex"
        mt={[null, null, '120px']}
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent="center"
        mx={[3, 4]}
      >
        <Container
          display="flex"
          flexDirection={'column'}
          alignItems="center"
          width={[1, '392px', null, null, '657px']}
          mr={[null, 2, 5]}
        >
          <Box textAlign={['center', 'left']} width={['288px', 1]}>
            <SectionTitle fontSize="32px" lineHeight="40px" letterSpacing="-1.2px" color="black.800">
              <FormattedMessage
                id="fiscalHosting.whoIsFiscalHostingFor.title"
                defaultMessage="Who is fiscal hosting for?"
              />
            </SectionTitle>
          </Box>
          <Box display={['block', 'none']} my={3}>
            <NextIllustration
              width={224}
              height={144}
              src="/static/images/home/weareopen-illustration-md.png"
              alt="Who is fiscal hosting for illustration"
            />
          </Box>
          <Box my={2} width={['288px', 1]} textAlign={['center', 'left']}>
            <SectionSubtitle
              color={['black.600', 'black.700']}
              fontSize={['16px', '20px']}
              lineHeight={['24px', '28px']}
              letterSpacing={['-0.16px', '-0.6px']}
            >
              <FormattedMessage
                id="fiscalHosting.whoIsFiscalHostingFor.subtitle"
                defaultMessage="There are multiple cases where fiscal hosting can be valuable for a project."
              />
            </SectionSubtitle>
          </Box>
        </Container>
        <Box
          display={['none', 'block']}
          width={['224px', null, null, null, '336px']}
          height={['144px', null, null, null, '216px']}
          my={5}
          ml={[null, null, 5]}
        >
          <NextIllustration
            width={336}
            height={216}
            src="/static/images/home/weareopen-illustration-md.png"
            alt="We are open in every way"
          />
        </Box>
      </Flex>
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
            <React.Fragment key={channel.id}>
              <Container
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                my={[2, null, null, null, 4]}
                order={[null, channel.desktopItemOrder]}
              >
                <IconWrapper my={2}>
                  <NextIllustration
                    width={60}
                    height={60}
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
                </Box>
              </Container>
            </React.Fragment>
          ))}
        </Container>
      </Container>
    </React.Fragment>
  );
};
export default WhoIsFiscalHosting;
