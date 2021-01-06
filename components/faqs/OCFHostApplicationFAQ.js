import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';

import { Box } from '../Grid';
import StyledLink from '../StyledLink';

import FAQ, { Content, Entry, Title } from './FAQ';

const OCFHostApplicationFAQ = props => (
  <FAQ withBorderLeft withNewButtons {...props}>
    <Entry>
      <Title>
        <FormattedMessage
          id="OCFHostApplication.faq.informationUsage.title"
          defaultMessage="How is this information used?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="OCFHostApplication.faq.informationUsage.content"
          defaultMessage="This application opens the conversation between your initiative and our team, so please provide us with as many details as you can. If there is sufficient information provided in your application, you may get accepted very quickly!"
        />
      </Content>
    </Entry>
    <Entry>
      <Title>
        <FormattedMessage
          id="OCFHostApplication.faq.missionImpact.title"
          defaultMessage="About our mission impact areas"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="OCFHostApplication.faq.missionImpact.content"
          defaultMessage="
          <b>Increasing access to educational resources and training:</b> With the advance of technology and the movement towards a society where people work together to enhance and develop the future, there has been an increase in the number of organizations and groups that are coming together to promote education.
          {lineBreak}{lineBreak}
          <b>Creating a positive social impact:</b> Sponsor’s social impact purpose is aimed at finding ways to (i) eliminate prejudice and discrimination; (ii) combat community deterioration; (iii) decrease juvenile delinquency; (iv) serve the less fortunate or distressed; (v) serve to prevent animal or child cruelty; or (vi) create a positive impact on society.
          {lineBreak}{lineBreak}
          <b>Developing tools to improve civic participation within cities or communities:</b> Sponsor host projects aimed at fostering civic participation, democratic debate and rebuilding community ties and strengths.
          "
          values={{
            // eslint-disable-next-line react/display-name
            b: chunks => <b>{chunks}</b>,
            lineBreak: <br />,
          }}
        />
      </Content>
    </Entry>
    <Box mt={3}>
      <StyledLink
        href="https://docs.opencollective.foundation/faqs/untitled"
        background="#F5FAFF"
        padding="8px 16px"
        borderRadius="100px"
        fontWeight="500"
        openInNewTab
      >
        <FormattedMessage id="moreInfo" defaultMessage="More info" /> <ArrowRight2 size="13px" />
      </StyledLink>
    </Box>
  </FAQ>
);

export default OCFHostApplicationFAQ;
