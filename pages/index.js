import React from 'react';

import Page from '../components/Page';
import MakeCommunitySection from '../components/home/sections/MakeCommunity';
import WhatCanYouDoSection from '../components/home/sections/WhatCanYouDo';
import FeaturesSection from '../components/home/sections/Features';
import OCUsersSection from '../components/home/sections/OCUsers';
import FiscalHostSection from '../components/home/sections/FiscalHost';
import WeAreOpenSection from '../components/home/sections/WeAreOpen';
import LearnMoreSection from '../components/home/sections/LearnMore';
import JoinUsSection from '../components/home/sections/JoinUs';

class NewHomePage extends React.Component {
  render() {
    return (
      <Page menuItems={{ pricing: true, howItWorks: true }}>
        <MakeCommunitySection />
        <WhatCanYouDoSection />
        <FeaturesSection />
        <OCUsersSection />
        <FiscalHostSection />
        <WeAreOpenSection />
        <LearnMoreSection />
        <JoinUsSection />
      </Page>
    );
  }
}

export default NewHomePage;
