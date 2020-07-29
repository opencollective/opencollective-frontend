import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import StyledCard from '../../StyledCard';
import StyledLink from '../../StyledLink';
import { H4, P } from '../../Text';
import Illustration from '../HomeIllustration';
import SectionSubtitle from '../SectionSubtitle';
import SectionTitle from '../SectionTitle';

const messsages = defineMessages({
  'home.weAreOpenSection.openData': {
    id: 'home.weAreOpenSection.openData',
    defaultMessage: 'Open Data',
  },
  'home.weAreOpenSection.openData.linkText': {
    id: 'home.weAreOpenSection.openData.linkText',
    defaultMessage: 'Find out how',
  },
  'home.weAreOpenSection.openData.description': {
    id: 'home.weAreOpenSection.openData.description',
    defaultMessage: 'We will never lock you in. Your data is yours and can be exported anytime.',
  },
  'home.weAreOpenSection.openSource': {
    id: 'home.weAreOpenSection.openSource',
    defaultMessage: 'Open Source',
  },
  'home.weAreOpenSection.openSource.description': {
    id: 'home.weAreOpenSection.openSource.description',
    defaultMessage: 'Everything we do is open source.',
  },
  'home.weAreOpenSection.openSource.linkText': {
    id: 'home.weAreOpenSection.openSource.linkText',
    defaultMessage: 'Our code base',
  },
  'home.weAreOpenSection.openCompany': {
    id: 'home.weAreOpenSection.openCompany',
    defaultMessage: 'Open Company',
  },
  'home.weAreOpenSection.openCompany.description': {
    id: 'home.weAreOpenSection.openCompany.description',
    defaultMessage: 'Our metrics, financials, and other documents are public.',
  },
  'home.weAreOpenSection.openCompany.linkText': {
    id: 'home.weAreOpenSection.openCompany.linkText',
    defaultMessage: 'Public drive',
  },
  'home.weAreOpenSection.openFinances': {
    id: 'home.weAreOpenSection.openFinances',
    defaultMessage: 'Open Finances',
  },
  'home.weAreOpenSection.openFinances.description': {
    id: 'home.weAreOpenSection.openFinances.description',
    defaultMessage: 'We operate as an Open Collective ourselves, with transparent budgets.',
  },
  'home.weAreOpenSection.openFinances.linkText': {
    id: 'home.weAreOpenSection.openFinances.linkText',
    defaultMessage: 'See our Collectives',
  },
});

const OpenFeature = ({ id, url }) => {
  const intl = useIntl();

  return (
    <StyledCard
      width={[1, null, '448px', null, '576px']}
      minHeight={['164px', null, '192px', null, '194px']}
      py={3}
      px={[3, null, '24px', null, '32px']}
      my={[4, null, 0]}
    >
      <H4 fontSize={['15px', 'H4']} lineHeight={['25px', 'H4']} letterSpacing={['-0.008em', '-0.2px']} my={2}>
        {intl.formatMessage(messsages[`home.weAreOpenSection.${id}`])}
      </H4>
      <P
        my={3}
        fontSize={['Caption', '15px']}
        lineHeight={['19px', '25px']}
        letterSpacing={'-0.016em'}
        color="black.600"
      >
        {intl.formatMessage(messsages[`home.weAreOpenSection.${id}.description`])}
      </P>
      <Box
        mt={[
          id === 'openSource' ? '35px' : null,
          null,
          id === 'openSource' || id === 'openCompany' ? '40px' : null,
          null,
          4,
        ]}
        mb={2}
      >
        <StyledLink href={url} buttonStyle="standard" buttonSize="small">
          {intl.formatMessage(messsages[`home.weAreOpenSection.${id}.linkText`])}
        </StyledLink>
      </Box>
    </StyledCard>
  );
};

OpenFeature.propTypes = {
  id: PropTypes.string,
  url: PropTypes.string,
};

const WeAreOpen = () => (
  <Flex display="flex" flexDirection={['column', 'row']} alignItems="center" justifyContent="center" mx={[3, 4]}>
    <Container
      display="flex"
      flexDirection={'column'}
      alignItems="center"
      width={[1, '392px', null, null, '657px']}
      mr={[null, 2, 5]}
    >
      <Box textAlign={['center', 'left']} width={['288px', 1]}>
        <SectionTitle fontSize={['32px']} lineHeight={['40px']} letterSpacing={['-1.2px']} color="black.800">
          <FormattedMessage id="home.weAreOpenSection.title" defaultMessage="We are open in every way" />
        </SectionTitle>
      </Box>
      <Box display={['block', 'none']} my={3} width={['224px']} height={['144px']}>
        <Illustration src="/static/images/home/weareopen-illustration-sm.png" alt="We are open in every way" />
      </Box>
      <Box my={2} width={['288px', 1]} textAlign={['center', 'left']}>
        <SectionSubtitle
          color={['black.600', 'black.700']}
          fontSize={['16px', '20px']}
          lineHeight={['24px', '28px']}
          letterSpacing={['-0.16px', '-0.6px']}
        >
          <FormattedMessage
            id="home.weAreOpenSection.subtitle"
            defaultMessage="We not only help you be transparent, we are too!"
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
      <Illustration src="/static/images/home/weareopen-illustration-md.png" alt="We are open in every way" />
    </Box>
  </Flex>
);

export default WeAreOpen;
