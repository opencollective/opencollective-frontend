import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledCarousel from '../StyledCarousel';
import StyledLink from '../StyledLink';
import { P } from '../Text';

const CollectiveNameLink = styled(StyledLink)`
  &:hover {
    text-decoration: underline !important;
    color: #313233;
  }
`;

const messages = defineMessages({
  'becomeAHost.caseStudies.wwcode': {
    id: 'becomeAHost.caseStudies.wwcode',
    defaultMessage:
      'Whenever we start a new meetup chapter, we pair it with an Open Collective so they have the means to raise money under our umbrella.',
  },
  'becomeAHost.caseStudies.socialchangenestcollective': {
    id: 'becomeAHost.caseStudies.socialchangenestcollective',
    defaultMessage:
      'We have been able to support over 150 Mutual Aid groups to get going quickly by providing them with fiscal hosting back office support.',
  },
  'becomeAHost.caseStudies.opensource': {
    id: 'becomeAHost.caseStudies.opensource',
    defaultMessage:
      'We provide financial and legal infrastructure for thousands of open source projects. We’re an API between the world of distributed collaboration and the world of accounting and invoices.',
  },
  'becomeAHost.caseStudies.allforclimate-collective': {
    id: 'becomeAHost.caseStudies.allforclimate-collective',
    defaultMessage:
      'A fiscal sponsor for your local climate justice group, we act as a shared administrative back office so that local groups can focus on their actions.',
  },
});

const caseStudies = [
  {
    id: 'wwcode',
    name: 'Women Who Code',
    collectivePath: '/wwcode',
    learnMorePath: 'https://opencollective.com/wwcodeinc',
    bgImage: 'wwc',
    logo: '/static/images/become-a-host/wwc-logo.png',
  },
  {
    id: 'socialchangenestcollective',
    name: 'Social Change Nest',
    collectivePath: '/socialchangenestcollective',
    learnMorePath: 'https://opencollective.com/the-social-change-nest',
    bgImage: 'socialchangenest',
    logo: '/static/images/become-a-host/socialchangenest-logo.png',
  },
  {
    id: 'opensource',
    name: 'Open Source Collective',
    collectivePath: '/opensource',
    learnMorePath: 'https://oscollective.org/',
    bgImage: 'osc',
    logo: '/static/images/become-a-host/osc-logo.png',
  },
  {
    id: 'allforclimate-collective',
    name: 'All for Climate',
    collectivePath: '/allforclimate-collective',
    learnMorePath: 'https://opencollective.com/allforclimate',
    bgImage: 'allforclimate-collective',
    logo: '/static/images/become-a-host/climate-logo.png',
  },
];

const CaseStudy = ({ bgImage, name, id, logo, learnMorePath }) => {
  const intl = useIntl();

  return (
    <Container
      display="flex"
      flexDirection="column"
      alignItems="center"
      mr={[null, 3, null, null, '36px']}
      my={[null, 3, null, null, 4]}
    >
      <Container
        width={[1, '205px', '306px', null, '360px']}
        height={['210px', '218px', null, null, '256px']}
        background={[
          `url("/static/images/become-a-host/${bgImage}.png") no-repeat`,
          `url("/static/images/become-a-host/${bgImage}-sm.png") no-repeat`,
          `url("/static/images/become-a-host/${bgImage}.png") no-repeat`,
        ]}
        backgroundSize={['contain', 'cover', 'contain']}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Avatar radius="96px" src={logo} name={name} type="ORGANIZATION" />
      </Container>
      <Container
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        mt={['12px', 3, '24px']}
        width={[1, '206px', '306px', null, '360px']}
      >
        <CollectiveNameLink
          href={learnMorePath}
          fontWeight="700"
          fontSize={['18px', '24px']}
          lineHeight={['26px', '32px']}
          color="black.800"
          letterSpacing={[null, '-0.008em']}
        >
          {name}
        </CollectiveNameLink>

        <P
          fontSize={['15px', '16px', null, null, '18px']}
          lineHeight={['22px', '24px', null, null, '26px']}
          color="black.700"
          fontWeight={['500', '400']}
          mt="12px"
        >
          &ldquo;{intl.formatMessage(messages[`becomeAHost.caseStudies.${id}`])}&ldquo;
        </P>
      </Container>
    </Container>
  );
};

CaseStudy.propTypes = {
  bgImage: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  logo: PropTypes.string,
  learnMorePath: PropTypes.string,
};

const CaseStudies = () => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      px="16px"
      my={[4, null, null, null, '118px']}
    >
      <Box width={['288px', '648px', null, null, '1152px']} mb="8px">
        <SectionTitle textAlign="center">
          <FormattedMessage defaultMessage="Who is using Open Collective?" />
        </SectionTitle>
      </Box>
      <Box mb={[4, 3]} width={['288px', '648px']}>
        <SectionDescription textAlign="center">
          <FormattedMessage
            id="home.OCUsersSection.subtitle"
            defaultMessage={'Communities around the world are using Open Collective. Find out more about them!'}
          />
        </SectionDescription>
      </Box>

      <StyledCarousel width="288px" options={caseStudies} display={[null, 'none']}>
        {caseStudies.map(caseStudy => (
          <CaseStudy key={caseStudy.id} {...caseStudy} />
        ))}
      </StyledCarousel>

      <Container display={['none', 'flex']} flexWrap="wrap" justifyContent="center">
        {caseStudies.map(caseStudy => (
          <CaseStudy key={caseStudy.id} {...caseStudy} />
        ))}
      </Container>
      <Box mt={4}>
        <StyledLink buttonStyle="marketingSecondary" buttonSize="medium" href="/search?isHost=true" fontWeight="500">
          <FormattedMessage id="becomeAHost.discoverMore" defaultMessage="Discover more hosts" />
        </StyledLink>
      </Box>
    </Flex>
  );
};

export default CaseStudies;
