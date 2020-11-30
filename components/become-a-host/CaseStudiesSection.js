import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledCarousel from '../StyledCarousel';
import StyledLink from '../StyledLink';
import { H2, H3, P } from '../Text';

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
  'becomeAHost.caseStudies.foundation': {
    id: 'becomeAHost.caseStudies.foundation',
    defaultMessage:
      'The Open Collective Platform provides the tools to more effectively manage group finances. They can offer their donors tax-deductible status without needing to incorporate a legal entity.',
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
    learnMorePath: '#',
    bgImage: '/static/images/become-a-host/wwc.png',
    logo: '/static/images/become-a-host/wwc-logo.png',
  },
  {
    id: 'socialchangenestcollective',
    name: 'Social Change Nest',
    collectivePath: '/socialchangenestcollective',
    learnMorePath: '#',
    bgImage: '/static/images/become-a-host/socialchangenest.png',
    logo: '/static/images/become-a-host/socialchangenest-logo.png',
  },
  {
    id: 'foundation',
    name: 'Open Collective Foundation',
    collectivePath: '/foundation',
    learnMorePath: '#',
    bgImage: '/static/images/become-a-host/ocf.png',
    logo: '/static/images/become-a-host/ocf-logo.png',
  },
  {
    id: 'opensource',
    name: 'Open Source Collective',
    collectivePath: '/opensource',
    learnMorePath: '#',
    bgImage: '/static/images/become-a-host/osc.png',
    logo: '/static/images/become-a-host/osc-logo.png',
  },
  {
    id: 'allforclimate-collective',
    name: 'All for Climate',
    collectivePath: '/allforclimate-collective',
    learnMorePath: '#',
    bgImage: '/static/images/become-a-host/allforclimate-collective.png',
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
        background={`url("${bgImage}") no-repeat`}
        backgroundSize="contain"
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
        mt={['12px', 0, '24px']}
        width={[1, '206px', '306px', null, '360px']}
      >
        <H3
          fontSize={['18px', '24px']}
          lineHeight={['26px', '32px']}
          color="black.800"
          letterSpacing={[null, '-0.008em']}
        >
          {name}
        </H3>
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
      <Box mt={4} alignSelf={[null, null, null, null, 'end']}>
        <StyledLink buttonStyle="standard" buttonSize="medium" href={learnMorePath} fontWeight="500">
          <FormattedMessage id="LearnMore" defaultMessage="Learn more" />
        </StyledLink>
      </Box>
    </Container>
  );
};

CaseStudy.propTypes = {
  bgImage: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
};

const CaseStudies = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" px="16px" my={4}>
      <H2 fontSize={['24px']} lineHeight={['32px']} color="black.800" letterSpacing="-0.008em" mb={[4, 3]}>
        <FormattedMessage id="becomeAHost.caseStudies" defaultMessage="Case studies" />
      </H2>

      {/* <Flex justifyContent="center" alignItems="center"> */}
      <StyledCarousel width="288px" options={caseStudies} display={[null, 'none']}>
        {caseStudies.map(caseStudy => (
          <CaseStudy key={caseStudy.id} {...caseStudy} />
        ))}
      </StyledCarousel>
      {/* </Flex> */}

      <Container display={['none', 'flex']} flexWrap="wrap" justifyContent="center">
        {caseStudies.map(caseStudy => (
          <CaseStudy key={caseStudy.id} {...caseStudy} />
        ))}
      </Container>
    </Flex>
  );
};

export default CaseStudies;
