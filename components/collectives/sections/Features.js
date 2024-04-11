import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight } from '@styled-icons/feather/ArrowRight';
import { themeGet } from '@styled-system/theme-get';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import { SectionDescription, SectionTitle } from '../../marketing/Text';
import StyledCarousel from '../../StyledCarousel';
import StyledLink from '../../StyledLink';
import { H4, P, Span } from '../../Text';
import NextIllustration from '../HomeNextIllustration';

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
    width: 220px;
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
    width: 247px;
  }

  @media screen and (min-width: 88em) {
    width: 317px;
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

const LearnMoreLink = styled(StyledLink)`
  color: #dc5f7d;
  &:hover {
    color: #dc5f7d;
  }
`;

const LineBreak = styled.br`
  @media screen and (min-width: 40em) {
    display: none;
  }
`;

const features = [
  {
    id: 'shareBudget',
    learnMoreLink: 'https://docs.opencollective.com/help/collectives/budget',
  },
  {
    id: 'receiveContributions',
    learnMoreLink: 'https://docs.opencollective.com/help/financial-contributors/financial-contributors',
  },
  {
    id: 'manageExpenses',
    learnMoreLink: 'https://docs.opencollective.com/help/expenses-and-getting-paid/expenses',
  },
  {
    id: 'engageCommunity',
    learnMoreLink: 'https://docs.opencollective.com/help/collectives/conversations',
  },
  {
    id: 'celebrateSupporters',
    learnMoreLink: null,
  },
  {
    id: 'getMonthlyReports',
    learnMoreLink: null,
  },
];

const messages = defineMessages({
  'home.feature.shareBudget': {
    id: 'home.feature.shareBudget',
    defaultMessage: 'Share your budget',
  },
  'home.feature.shareBudget.description': {
    id: 'home.feature.shareBudget.description',
    defaultMessage:
      'Everyone can see where money comes from and where it goes. Clarity and accountability without any spreadsheets or extra work!',
  },
  'home.feature.receiveContributions': {
    id: 'home.feature.receiveContributions',
    defaultMessage: 'Receive Contributions',
  },
  'home.feature.receiveContributions.description': {
    id: 'home.feature.receiveContributions.description',
    defaultMessage:
      'Accept payments by credit card, bank transfer, and Paypal. Define custom tiers and set goals to motivate your supporters to give.',
  },
  'home.feature.manageExpenses': {
    id: 'home.feature.manageExpenses',
    defaultMessage: 'Manage Expenses',
  },
  'home.feature.manageExpenses.description': {
    id: 'home.feature.manageExpenses.description',
    defaultMessage:
      'Contributors and vendors can easily submit receipts and invoices. You approve or reject them, and once paid your balance updates automatically.',
  },
  'home.feature.engageCommunity': {
    id: 'home.feature.engageCommunity',
    defaultMessage: 'Engage your community',
  },
  'home.feature.engageCommunity.description': {
    id: 'home.feature.engageCommunity.description',
    defaultMessage:
      'Post Updates to engage supporters and share your progress and the impact of their funding. Use Conversations as a community discussion forum.',
  },
  'home.feature.celebrateSupporters': {
    id: 'home.feature.celebrateSupporters',
    defaultMessage: 'Celebrate your supporters',
  },
  'home.feature.celebrateSupporters.description': {
    id: 'home.feature.celebrateSupporters.description',
    defaultMessage:
      'Leaderboard of your top funders, plus highlight how your whole community contributes in different ways.',
  },
  'home.feature.getMonthlyReports': {
    id: 'home.feature.getMonthlyReports',
    defaultMessage: 'Get monthly reports',
  },
  'home.feature.getMonthlyReports.description': {
    id: 'home.feature.getMonthlyReports.description',
    defaultMessage:
      'A summary of your group’s activities, progress on your budget goals, new contributors, and expense details, with all transaction data and receipts/invoices attached.',
  },
});

const FeatureTitle = ({ id, intl, activeFeature, ...props }) => {
  const iconUrl =
    activeFeature === id ? `/static/images/home/${id}-icon.png` : `/static/images/home/${id}-icon-black.png`;

  return (
    <Flex alignItems="center" justifyContent={['center', 'space-between']} width={1} {...props}>
      <Container display="flex" alignItems="center">
        <Box display={['none', 'block']} width={[null, '48px']} height={[null, '48px']} mr={[3, 2]}>
          <NextIllustration width={50} height={50} src={iconUrl} alt={`${id} icon`} />
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
          {intl.formatMessage(messages[`home.feature.${id}`])}
        </Span>
      </Container>
    </Flex>
  );
};

FeatureTitle.propTypes = {
  id: PropTypes.string.isRequired,
  activeFeature: PropTypes.string,
  intl: PropTypes.any.isRequired,
};

const FeatureDescription = ({ intl, id, learnMoreLink, ...props }) => (
  <Box {...props}>
    <P
      fontSize={['16px', null, null, null, '18px']}
      lineHeight={['24px', null, null, null, '27px']}
      color={['black.600', 'black.700']}
      letterSpacing={['-0.04px', '-0.16px']}
      textAlign={['center', 'left']}
    >
      {intl.formatMessage(messages[`home.feature.${id}.description`])}{' '}
      {learnMoreLink && (
        <React.Fragment>
          <LineBreak />
          <LearnMoreLink href={learnMoreLink} openInNewTab>
            <FormattedMessage defaultMessage="Learn more" id="TdTXXf" />
            <Span display={[null, 'none']}>
              {' '}
              <ArrowRight size="24" />
            </Span>
            <Span display={['none', 'inline-block']}>...</Span>
          </LearnMoreLink>
        </React.Fragment>
      )}
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
    <FeatureTitle intl={intl} id={id} activeFeature={id} display={[null, 'none']} />
    <Container mb={[2, 3, 5]} ml={[null, null, 4]} width={[null, null, '400px', null, '624px']} textAlign="left">
      <H4 display={['none', 'block']} letterSpacing="-0.4px" fontWeight="bold" color="primary.900" my={3}>
        {intl.formatMessage(messages[`home.feature.${id}`])}
      </H4>
      <FeatureDescription learnMoreLink={learnMoreLink} intl={intl} id={id} display={['none', 'block']} />
    </Container>
    <Container width={[null, '392px', '466px', null, '756px']}>
      <NextIllustration
        loading="eager"
        width={756}
        height={575}
        src={`/static/images/home/${id}-screenshot.png`}
        alt={intl.formatMessage(messages[`home.feature.${id}`])}
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

const Features = ({ sectionTitle, sectionSubtitle }) => {
  const [activeFeature, setActiveFeature] = useState(features[0]);
  const intl = useIntl();

  return (
    <Flex mx={[3, 4]} flexDirection="column" textAlign="center" my={[4, null, 0]}>
      <SectionTitle mb={3}>
        {sectionTitle || (
          <FormattedMessage id="home.featureSection.title" defaultMessage="How to use Open Collective" />
        )}
      </SectionTitle>
      <SectionDescription>
        {sectionSubtitle || (
          <FormattedMessage id="home.featureSection.subTitle" defaultMessage="Discover our features." />
        )}
      </SectionDescription>
      <Flex
        flexDirection={['column', 'row-reverse']}
        alignItems={[null, 'flex-start', null, null, 'center']}
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
                <FeatureTitle intl={intl} id={feature.id} activeFeature={activeFeature.id} />
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

Features.propTypes = {
  sectionTitle: PropTypes.string,
  sectionSubtitle: PropTypes.string,
};

export default Features;
