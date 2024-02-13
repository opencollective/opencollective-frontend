import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import Features from '../components/collectives/sections/Features';
import JoinUs from '../components/collectives/sections/JoinUs';
import MoreFeatures from '../components/how-it-works/AndSoMuchMoreSection';
import HowOCIsDifferent from '../components/how-it-works/HowOCIsDifferentSection';
import HowOCWorks from '../components/how-it-works/HowOCWorksSection';
import MoreAboutFiscalHosting from '../components/how-it-works/MoreAboutFHSection';
import Page from '../components/Page';

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.howItWorks',
    defaultMessage: 'How Open Collective works',
  },
  feature: {
    id: 'howItWorks.features',
    defaultMessage: 'Discover our features',
  },
  'feature.subtitle': {
    id: 'howItWorks.features.subtitle',
    defaultMessage: 'Collective budget management made simple',
  },
});

const HowItWorks = () => {
  const { formatMessage } = useIntl();
  return (
    <Page description={formatMessage(messages.defaultTitle)}>
      <HowOCWorks />
      <HowOCIsDifferent />
      <MoreAboutFiscalHosting />
      <Features
        sectionTitle={formatMessage(messages.feature)}
        sectionSubtitle={formatMessage(messages['feature.subtitle'])}
      />
      <MoreFeatures />
      <JoinUs />
    </Page>
  );
};

// ignore unused exports default
// next.js export
export default HowItWorks;
