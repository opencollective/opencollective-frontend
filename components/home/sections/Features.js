import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { find } from 'lodash';
import { FormattedMessage, useIntl, defineMessages } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { Pin } from '@styled-icons/octicons/Pin';
import { WbCloudy } from '@styled-icons/material/WbCloudy';
import { Bell } from '@styled-icons/fa-solid/Bell';
import { Server } from '@styled-icons/fa-solid/Server';
import { Lightbulb } from '@styled-icons/fa-solid/Lightbulb';
import { Bullhorn } from '@styled-icons/fa-solid/Bullhorn';

import DownArrowHead from '../../icons/DownArrowHeadIcon';
import Hide from '../../Hide';
import { Span } from '../../Text';
import Container from '../../Container';
import HomePrimaryLink from '../HomePrimaryLink';
import SectionTitle from '../SectionTitle';
import SectionSubtitle from '../SectionSubtitle';

const SelectFeatureButton = styled.button`
  width: 100%;
  cursor: pointer;
  color: #1869f5;
  font-size: 16px;
  letter-spacing: -0.008em;
  line-height: 22px;

  @media screen and (min-width: 64em) {
    color: #4e5052;
    width: 240px;
    padding: 10px;
    font-size: 14px;
    line-height: 24px;

    ${props =>
      props.active &&
      css`
        color: #1869f5;
        border: 1px solid #e6f3ff;
        border-radius: 8px;
        background: #ffffff;
        outline: none;
      `}

    &:hover {
      color: #1869f5;
    }
  }

  @media screen and (min-width: 88em) {
    width: 312px;
    padding: 15px 10px;
    font-size: 16px;
    line-height: 22px;
  }
`;

const FeatureListWrapper = styled(Box)`
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const FeatureList = styled(Box)`
  list-style: none;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 8px 0;
`;

const Img = styled.img`
  max-width: 100%;
`;

const Feature = styled(Span)`
  @media screen and (min-width: 64em) {
    color: ${props => props.active && '#1869F5'};
  }
`;

const features = [
  {
    id: 'shareBudget',
    mobileScreenshot: '/static/images/share-budget-mobile-screenshot.svg',
    desktopScreenshot: '/static/images/share-budget-desktop-screenshot.svg',
  },
  {
    id: 'receiveDonations',
    mobileScreenshot: '/static/images/share-budget-mobile-screenshot.svg',
    desktopScreenshot: '/static/images/share-budget-desktop-screenshot.svg',
  },
  {
    id: 'submitExpenses',
    mobileScreenshot: '/static/images/share-budget-mobile-screenshot.svg',
    desktopScreenshot: '/static/images/share-budget-desktop-screenshot.svg',
  },
  {
    id: 'approveExpenses',
    mobileScreenshot: '/static/images/share-budget-mobile-screenshot.svg',
    desktopScreenshot: '/static/images/share-budget-desktop-screenshot.svg',
  },
  {
    id: 'postUpdates',
    mobileScreenshot: '/static/images/share-budget-mobile-screenshot.svg',
    desktopScreenshot: '/static/images/share-budget-desktop-screenshot.svg',
  },
  {
    id: 'receiveMonthlyReports',
    mobileScreenshot: '/static/images/share-budget-mobile-screenshot.svg',
    desktopScreenshot: '/static/images/share-budget-desktop-screenshot.svg',
  },
];

const messages = defineMessages({
  'home.feature.shareBudget': {
    id: 'home.feature.shareBudget',
    defaultMessage: 'Share your budget',
  },
  'home.feature.receiveDonations': {
    id: 'home.feature.receiveDonations',
    defaultMessage: 'Receive Donations',
  },
  'home.feature.submitExpenses': {
    id: 'home.feature.submitExpenses',
    defaultMessage: 'Submit Expenses',
  },
  'home.feature.approveExpenses': {
    id: 'home.feature.approveExpenses',
    defaultMessage: 'Approve Expenses',
  },
  'home.feature.postUpdates': {
    id: 'home.feature.postUpdates',
    defaultMessage: 'Post Updates',
  },
  'home.feature.receiveMonthlyReports': {
    id: 'home.feature.receiveMonthlyReports',
    defaultMessage: 'Receive monthly reports',
  },
});

const getFeatureIcon = featureId => {
  switch (featureId) {
    case 'shareBudget':
      return <Bullhorn size="32" />;
    case 'receiveDonations':
      return <Pin size="32" />;
    case 'submitExpenses':
      return <WbCloudy size="32" />;
    case 'approveExpenses':
      return <Bell size="32" />;
    case 'postUpdates':
      return <Server size="32" />;
    case 'receiveMonthlyReports':
      return <Lightbulb size="32" />;
  }
};

const getActiveFeatureImgSrc = id => {
  return find(features, ['id', id]).desktopScreenshot;
};

const Features = () => {
  const [activeFeature, setActiveFeature] = useState('receiveDonations');
  const intl = useIntl();

  return (
    <Flex mx={[3, 4]} flexDirection="column" textAlign="center" my={[4, null, 0]}>
      <Hide sm md lg>
        <SectionTitle>
          <FormattedMessage id="home.featureSection.mobileTitle" defaultMessage="Features" />
        </SectionTitle>
      </Hide>
      <Hide xs>
        <SectionTitle>
          <FormattedMessage id="home.featureSection.title" defaultMessage="How to use Open Collective?" />
        </SectionTitle>
      </Hide>
      <SectionSubtitle>
        <FormattedMessage
          id="home.featureSection.subTitle"
          defaultMessage="Discover all the possibilities of what you can do with the platform’s features."
        />
      </SectionSubtitle>
      <Flex flexDirection={[null, null, 'row-reverse']} mt={3} justifyContent="center">
        <FeatureListWrapper as="ul" width={[null, null, '240px', null, '312px']}>
          {features.map(feature => (
            <FeatureList mr={[null, null, null, null, 2]} as="li" key={feature.id}>
              <SelectFeatureButton
                width={1}
                onClick={() => setActiveFeature(feature.id)}
                active={activeFeature === feature.id}
              >
                <Flex alignItems="center" justifyContent="space-between" width={1}>
                  <Container display="flex" alignItems="center">
                    <Span mr={[3, null, 3]}>{getFeatureIcon(feature.id)}</Span>
                    <Feature
                      color={['black.700', null, null]}
                      active={activeFeature === feature.id}
                      fontWeight="bold"
                      letterSpacing={'-0.008em'}
                      textAlign="left"
                    >
                      {intl.formatMessage(messages[`home.feature.${feature.id}`])}
                    </Feature>
                  </Container>
                  <Span display={[null, null, 'none']}>
                    <DownArrowHead size="32" color="blue.600" />
                  </Span>
                </Flex>
              </SelectFeatureButton>
              {activeFeature === feature.id && (
                <Box width={1} display={[null, null, 'none']} mt={2}>
                  <Hide sm md lg>
                    <Img
                      src={feature.mobileScreenshot}
                      alt={intl.formatMessage(messages[`home.feature.${feature.id}`])}
                    />
                  </Hide>
                  <Hide xs>
                    <Img
                      src={feature.desktopScreenshot}
                      alt={intl.formatMessage(messages[`home.feature.${feature.id}`])}
                    />
                  </Hide>
                </Box>
              )}
            </FeatureList>
          ))}
        </FeatureListWrapper>
        <Box display={['none', 'none', 'block']} mr={4}>
          <Img
            src={getActiveFeatureImgSrc(activeFeature)}
            alt={intl.formatMessage(messages[`home.feature.${activeFeature}`])}
          />
        </Box>
      </Flex>
      <Container display={['none', 'none', 'flex']} justifyContent="center" mt={5} mb={4} width={1}>
        <HomePrimaryLink href="#" width="304px" display="block">
          <FormattedMessage id="home.readPlatformDocumentation" defaultMessage="Read the platform documentation" />
        </HomePrimaryLink>
      </Container>
    </Flex>
  );
};

export default Features;
