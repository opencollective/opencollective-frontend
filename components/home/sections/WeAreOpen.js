import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@rebass/grid';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { P, H4 } from '../../Text';
import { HomeStandardLink } from '../HomeLinks';
import Hide from '../../Hide';
import Illustration from '../HomeIllustration';
import StyledCarousel from '../../StyledCarousel';
import Container from '../../Container';
import SectionTitle from '../SectionTitle';
import SectionSubtitle from '../SectionSubtitle';
import StyledCard from '../../StyledCard';

const Wrapper = styled(Container)`
  background-image: ${props => props.openFeature && `url('/static/images/${props.openFeature}-bg-sm.png')`};
  background-size: 100% 100%;
  flex-wrap: wrap;

  @media screen and (min-width: 64em) {
    background-image: url('/static/images/weareopen-bg.png');
    background-size: 100% 100%;
  }

  @media screen and (min-width: 88em) {
    background-image: url('/static/images/weareopen-bg-lg.png');
    background-size: 100% 100%;
  }
`;

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

const openFeatures = [
  {
    id: 'openData',
    link: 'https://drive.google.com/drive/u/1/folders/1OwRpuIehFQxRnJIRAksQ1Jd2xXZrhz5L',
  },
  {
    id: 'openSource',
    url: 'https://github.com/opencollective',
  },
  {
    id: 'openCompany',
    url: 'http://drive.opencollective.com',
  },
  {
    id: 'openFinances',
    url: 'https://opencollective.com/opencollectiveinc',
  },
];

const OpenFeature = ({ id, url }) => {
  const intl = useIntl();

  return (
    <StyledCard
      width={[1, null, '448px', null, '576px']}
      height={['164px', null, '192px', null, '194px']}
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
        <HomeStandardLink href={url}>
          {intl.formatMessage(messsages[`home.weAreOpenSection.${id}.linkText`])}
        </HomeStandardLink>
      </Box>
    </StyledCard>
  );
};

OpenFeature.propTypes = {
  id: PropTypes.string,
  url: PropTypes.string,
};

const WeAreOpen = () => (
  <Container display="flex" flexDirection="column" alignItems="center" mx={[0, 4, 0, null, null, 5]}>
    <Box textAlign="center">
      <SectionTitle>
        <FormattedMessage
          id="home.weAreOpenSection.title"
          defaultMessage="We are Open in
          every way"
        />
      </SectionTitle>
      <SectionSubtitle>
        <FormattedMessage
          id="home.weAreOpenSection.subtitle"
          defaultMessage="We not only help you be transparent, we are too!"
        />
      </SectionSubtitle>
    </Box>
    <Hide md lg my={3}>
      <Illustration src="/static/images/weareopen-illustration-sm.png" alt="We are Open in every way" />
    </Hide>
    <StyledCarousel display={[null, null, 'none']} width={1}>
      {openFeatures.map(openFeature => (
        <Wrapper
          width={1}
          key={openFeature.id}
          display="flex"
          justifyContent="center"
          openFeature={openFeature.id}
          py="40px"
        >
          <Container width="90%">
            <OpenFeature {...openFeature} />
          </Container>
        </Wrapper>
      ))}
    </StyledCarousel>
    <Container display={['none', null, 'flex']} justifyContent={'center'} my={5}>
      <Illustration
        display={['none', null, 'block', null, 'none']}
        src="/static/images/weareopen-illustration-md.png"
        alt="We are Open in every way"
      />
      <Illustration
        display={['none', null, null, null, 'block']}
        src="/static/images/weareopen-illustration-md.png"
        alt="We are Open in every way"
        mr={3}
      />
    </Container>
    <Wrapper
      width={[1, null, null, null, '1376px']}
      display={['none', null, 'flex']}
      justifyContent={[null, null, null, 'center']}
      pt={[null, null, '85px', null, '80px']}
      pb={[null, null, '90px', null, '120px']}
      px={[null, null, '50px', null, '70px']}
    >
      {openFeatures.map(openFeature => {
        const id = openFeature.id;
        return (
          <Box
            key={id}
            mr={[
              null,
              null,
              id === 'openData' || id === 'openCompany' ? '10px' : null,
              null,
              id === 'openData' || id === 'openCompany' ? '33px' : null,
            ]}
            ml={[
              null,
              null,
              id === 'openSource' || id === 'openFinances' ? '10px' : null,
              null,
              id === 'openSource' || id === 'openFinances' ? '33px' : null,
            ]}
            mb={[
              null,
              null,
              id === 'openData' || id === 'openSource' ? '13px' : null,
              null,
              id === 'openData' || id === 'openSource' ? '26px' : null,
            ]}
            mt={[
              null,
              null,
              id === 'openCompany' || id === 'openFinances' ? '13px' : null,
              null,
              id === 'openCompany' || id === 'openFinances' ? '26px' : null,
            ]}
          >
            <OpenFeature {...openFeature} />
          </Box>
        );
      })}
    </Wrapper>
  </Container>
);

export default WeAreOpen;
