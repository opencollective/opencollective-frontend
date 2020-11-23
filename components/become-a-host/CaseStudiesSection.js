import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
// import Link from '../Link';
import StyledCarousel from '../StyledCarousel';
import { H2, H3, P } from '../Text';

const messages = defineMessages({
  'becomeAHost.caseStudies.womenWhoCode': {
    id: 'becomeAHost.caseStudies.womenWhoCode',
    defaultMessage:
      'Whenever we start a new meetup chapter, we pair it with an Open Collective so they have the means to raise money under our umbrella.',
  },
  'becomeAHost.caseStudies.socialChangeNest': {
    id: 'becomeAHost.caseStudies.socialChangeNest',
    defaultMessage:
      'We have been able to support over 150 Mutual Aid groups to get going quickly by providing them with fiscal hosting back office support.',
  },
  'becomeAHost.caseStudies.OCF': {
    id: 'becomeAHost.caseStudies.OCF',
    defaultMessage:
      'The Open Collective Platform provides the tools to more effectively manage group finances. They can offer their donors tax-deductible status without needing to incorporate a legal entity.',
  },
  'becomeAHost.caseStudies.OSC': {
    id: 'becomeAHost.caseStudies.OSC',
    defaultMessage:
      'We provide financial and legal infrastructure for thousands of open source projects. We’re an API between the world of distributed collaboration and the world of accounting and invoices.',
  },
  'becomeAHost.caseStudies.climate': {
    id: 'becomeAHost.caseStudies.climate',
    defaultMessage:
      'A fiscal sponsor for your local climate justice group, we act as a shared administrative back office so that local groups can focus on their actions.',
  },
});

const caseStudies = [
  {
    id: 'womenWhoCode',
    name: 'Women Who Code',
    collectivePath: '/wwcodeatl',
    learnMorePath: '/wwcodeinc',
    bgImage: '/static/images/home/oc-users-womenwhocode.png',
  },
  {
    id: 'socialChangeNest',
    name: 'Social Change Nest',
    collectivePath: '#',
    learnMorePath: '#',
    bgImage: '/static/images/home/oc-users-womenwhocode.png',
  },
  {
    id: 'OCF',
    name: 'Open Collective Foundation',
    collectivePath: '/foundation',
    learnMorePath: '#',
    bgImage: '/static/images/home/oc-users-extinctionrebllion.png',
  },
  {
    id: 'OSC',
    name: 'Open Source Collective',
    collectivePath: '/opensource',
    learnMorePath: '#',
    bgImage: '/static/images/home/oc-users-extinctionrebllion.png',
  },
  {
    id: 'climate',
    name: 'All for Climate',
    collectivePath: '#',
    learnMorePath: '#',
    bgImage: '/static/images/home/oc-users-extinctionrebllion.png',
  },
];

const CaseStudy = ({ bgImage, name, id }) => {
  const intl = useIntl();

  return (
    <Container
      display="flex"
      flexDirection="column"
      alignItems="center"
      mr={[null, 3, null, null, '36px']}
      my={[null, 3]}
    >
      <Box
        width={[1, '205px', '306px', null, '360px']}
        height={['210px', '218px', null, null, '256px']}
        background={`url("${bgImage}") no-repeat`}
        backgroundSize="contain"
      ></Box>
      <Container
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        mt={['16px', 0]}
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
