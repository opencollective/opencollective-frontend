import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { SectionTitle } from '../marketing/Text';
import StyledCarousel from '../StyledCarousel';
import { H4, P, Span } from '../Text';

const SelectFeatureButton = styled.button`
  width: 100%;
  cursor: pointer;
  color: #1869f5;
  border: none;
  outline: none;
  background: #fff;
  padding: 0;

  @media screen and (min-width: 40em) {
    color: ${themeGet('colors.black.700')};
    width: 272px;
    padding: 3px;

    ${props =>
      props.active &&
      css`
        color: #dc5f7d;
        border: 1px solid #e6f3ff;
        border-radius: 8px;
        background: #ffffff;
        outline: none;
        padding: 8px;
        box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
      `}

    &:hover {
      color: #1869f5;
    }
  }

  @media screen and (min-width: 64em) {
    width: 270px;
  }

  @media screen and (min-width: 88em) {
    width: 320px;
  }
`;

const FeatureListWrapper = styled(Box)`
  margin: 0;
  padding: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const FeatureList = styled(Box)`
  list-style: none;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 14px 0;
`;

const features = [
  {
    id: 'acceptAndSpendFunds',
    learnMoreLink: '#',
  },
  {
    id: 'sustainabilityDesign',
    learnMoreLink: '#',
  },
  {
    id: 'networkingAndSolidarity',
    learnMoreLink: '#',
  },
  {
    id: 'automaticReporting',
    learnMoreLink: '#',
  },
  {
    id: 'organizeFinance',
    learnMoreLink: '#',
  },
];

const messages = defineMessages({
  'fiscalHosting.feature.acceptAndSpendFunds': {
    id: 'fiscalHosting.feature.acceptAndSpendFunds',
    defaultMessage: 'Accept and spend funds immediately',
  },
  'fiscalHosting.feature.acceptAndSpendFunds.tabName': {
    id: 'fiscalHosting.feature.acceptAndSpendFunds.tabName',
    defaultMessage: 'Accept and spend funds',
  },
  'fiscalHosting.feature.acceptAndSpendFunds.description': {
    id: 'fiscalHosting.feature.acceptAndSpendFunds.description',
    defaultMessage:
      'You can often get approved very quickly, even instantly, ready to receive and disburse funds and get operational. Compared with traditional fiscal sponsorship or setting up your own entity, activating with a fiscal host is super streamlined.',
  },

  'fiscalHosting.feature.sustainabilityDesign': {
    id: 'fiscalHosting.feature.sustainabilityDesign',
    defaultMessage: 'Designed for ongoing sustainability',
  },
  'fiscalHosting.feature.sustainabilityDesign.tabName': {
    id: 'fiscalHosting.feature.sustainabilityDesign.tabName',
    defaultMessage: 'Ongoing sustainability',
  },
  'fiscalHosting.feature.sustainabilityDesign.description': {
    id: 'fiscalHosting.feature.sustainabilityDesign.description',
    defaultMessage:
      'If your project doesn’t have an expiration date, neither should your funding. A standard crowdfunding campaign is over once it’s over. A single grant is spent once it’s spent. But fiscal hosting helps you combine different income streams and form ongoing relationships with funders.',
  },

  'fiscalHosting.feature.networkingAndSolidarity': {
    id: 'fiscalHosting.feature.networkingAndSolidarity',
    defaultMessage: 'Networking & solidarity',
  },
  'fiscalHosting.feature.networkingAndSolidarity.tabName': {
    id: 'fiscalHosting.feature.networkingAndSolidarity',
    defaultMessage: 'Networking & solidarity',
  },
  'fiscalHosting.feature.networkingAndSolidarity.description': {
    id: 'fiscalHosting.feature.networkingAndSolidarity.description',
    defaultMessage:
      'A fiscal host is by definition a community of projects with something in common. They can provide services to their community as a whole, and enable connections between projects. Whether it’s about joining budgets or joining voices, join a host that’s more than the sum of its parts.',
  },

  'fiscalHosting.feature.automaticReporting': {
    id: 'fiscalHosting.feature.automaticReporting',
    defaultMessage: 'Automatic reporting & transparency',
  },
  'fiscalHosting.feature.automaticReporting.tabName': {
    id: 'fiscalHosting.feature.automaticReporting.tabName',
    defaultMessage: 'Reporting & transparency',
  },
  'fiscalHosting.feature.automaticReporting.description': {
    id: 'fiscalHosting.feature.automaticReporting.description',
    defaultMessage:
      'No need to spend hours creating reports for funders. The Open Collective platform has automated quantitative reporting built in. Just sent the funder a link to your page! There are great tools for qualitative reporting too, like posting blogs and newsletters, which also serve to keep your wider community engaged and up to date.',
  },

  'fiscalHosting.feature.organizeFinance': {
    id: 'fiscalHosting.feature.organizeFinance',
    defaultMessage: 'Organize your finances, all in one place',
  },
  'fiscalHosting.feature.organizeFinance.tabName': {
    id: 'fiscalHosting.feature.organizeFinance.tabName',
    defaultMessage: 'Your finances in one place',
  },
  'fiscalHosting.feature.organizeFinance.description': {
    id: 'fiscalHosting.feature.organizeFinance.description',
    defaultMessage:
      'No more messy spreadsheets! Income from credit card transactions, bank transfers, PayPal, even ticket sales, grants, and sponsorships are all tracked automatically in one transparent budget. With a robust yet user-friendly system for submitting and approving expenses, tracking outgoing funds is a breeze, too.',
  },
});

const FeatureTitle = ({ id, intl, activeFeature, ...props }) => {
  const iconUrl =
    activeFeature === id
      ? `/static/images/fiscal-hosting/${id}-icon-pink.png`
      : `/static/images/fiscal-hosting/${id}-icon.png`;

  return (
    <Container alignItems="center" justifyContent={['center', 'space-between']} width={1} {...props}>
      <Container display="flex" alignItems="center">
        <Box width={[null, '48px']} height={[null, '48px']} mr={[3, 2]}>
          <NextIllustration width={50} height={50} src={iconUrl} alt={`${id} icon`} preload="true" />
        </Box>
        <Span
          color={['black.800', 'black.900']}
          active={id === activeFeature}
          fontWeight="500"
          textAlign={['center', 'left']}
          fontSize={['20px', '16px', null, null, '18px']}
          lineHeight={['28px', '24px', null, null, '27px']}
          letterSpacing={['-0.6px', '-0.16px', null, null, '-0.2px']}
        >
          {intl.formatMessage(messages[`fiscalHosting.feature.${id}.tabName`])}
        </Span>
      </Container>
    </Container>
  );
};

FeatureTitle.propTypes = {
  id: PropTypes.string.isRequired,
  activeFeature: PropTypes.string,
  intl: PropTypes.any.isRequired,
};

const FeatureDescription = ({ intl, id, ...props }) => (
  <Box {...props}>
    <P
      fontSize={['16px', null, null, null, '18px']}
      lineHeight={['24px', null, null, null, '27px']}
      color={['black.600', 'black.700']}
      letterSpacing={['-0.04px', '-0.16px']}
      textAlign={['center', 'left']}
    >
      {intl.formatMessage(messages[`fiscalHosting.feature.${id}.description`])}{' '}
    </P>
  </Box>
);

FeatureDescription.propTypes = {
  id: PropTypes.string.isRequired,
  intl: PropTypes.any.isRequired,
  learnMoreLink: PropTypes.string,
};

const Feature = ({ id, learnMoreLink, intl }) => (
  <Container width={1} display="flex" mr={2} flexDirection="column">
    <FeatureTitle intl={intl} id={id} activeFeature={id} display={['flex', 'none']} />
    <Container mb={[2, 3, 5]} ml={[null, null, 4]} width={[null, null, '400px', null, '624px']} textAlign="left">
      <H4 display={['none', 'block']} letterSpacing="-0.4px" fontWeight="bold" color="black.800" my={3}>
        {intl.formatMessage(messages[`fiscalHosting.feature.${id}`])}
      </H4>
      <FeatureDescription learnMoreLink={learnMoreLink} intl={intl} id={id} display={['none', 'block']} />
    </Container>
    <Container mt={['14px', 0]} width={[null, '392px', '466px', null, '756px']}>
      <NextIllustration
        loading="eager"
        width={756}
        height={502}
        preload="true"
        src={`/static/images/fiscal-hosting/${id}-screenshot.png`}
        alt={intl.formatMessage(messages[`fiscalHosting.feature.${id}`])}
      />
    </Container>
    <FeatureDescription intl={intl} id={id} learnMoreLink={learnMoreLink} display={['block', 'none']} mt={2} />
  </Container>
);

Feature.propTypes = {
  id: PropTypes.string.isRequired,
  intl: PropTypes.any.isRequired,
  learnMoreLink: PropTypes.string,
};

const HowToUseOpenCollective = () => {
  const [activeFeature, setActiveFeature] = useState(features[0]);
  const intl = useIntl();

  return (
    <Flex mx={[3, 4]} flexDirection="column" textAlign="center" my={[4, null, 0, null, '112px']}>
      <SectionTitle mb="0">
        <FormattedMessage id="fiscalHosting.howCanAFiscalHostHelp" defaultMessage="How can a fiscal host help?" />
      </SectionTitle>
      <Flex
        flexDirection={['column', 'row-reverse']}
        alignItems={[null, 'flex-start']}
        mt={[3, null, 4]}
        justifyContent="center"
      >
        <FeatureListWrapper as="ul" display={['none', 'flex']}>
          {features.map(feature => (
            <FeatureList ml={[null, 4, null, 6]} mr={[null, null, null, null, 2]} as="li" key={feature.id}>
              <SelectFeatureButton
                width={1}
                onClick={() => setActiveFeature(feature)}
                active={activeFeature.id === feature.id}
              >
                <FeatureTitle intl={intl} id={feature.id} activeFeature={activeFeature.id} display={['none', 'flex']} />
              </SelectFeatureButton>
            </FeatureList>
          ))}
        </FeatureListWrapper>
        <StyledCarousel display={[null, 'none']} width={1}>
          {features.map(feature => (
            <Fragment key={feature.id}>
              <Feature id={feature.id} learnMoreLink={feature.learnMoreLink} intl={intl} />
            </Fragment>
          ))}
        </StyledCarousel>
        <Container display={['none', 'block']} height="672px">
          <Feature id={activeFeature.id} learnMoreLink={activeFeature.learnMoreLink} intl={intl} />
        </Container>
      </Flex>
    </Flex>
  );
};

export default HowToUseOpenCollective;
