import React from 'react';
import { FormattedMessage } from 'react-intl';

import Illustration from '../collectives/HomeIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledLink from '../StyledLink';
import { H3, P } from '../Text';

const MoreFeatures = () => (
  <Flex
    mt={[null, null, null, null, '180px']}
    mb="80px"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
  >
    <Container display="flex" flexDirection="column" alignItems="center" mx={3}>
      <Box mb={['24px', 3, null, null, '24px']} width={['288px', 1]}>
        <SectionTitle textAlign="center">
          <FormattedMessage id="howItWorks.muchMore" defaultMessage="And so much more!" />
        </SectionTitle>
      </Box>
      <Box width={['288px', 1]}>
        <SectionDescription textAlign="center">
          <FormattedMessage
            id="home.weAreOpenSection.subtitle"
            defaultMessage="We not only help you be transparent, we are too!"
          />
        </SectionDescription>
      </Box>
    </Container>
    <Flex
      mx={3}
      gridGap={['48px', '72px 40px', '72px 112px', null, '124px 112px']}
      placeSelf="center"
      justifyContent="center"
      flexWrap="wrap"
      alignItems={['center', null, null, 'flex-start']}
      mt={['27px', '56px', null, null, '69px']}
      maxWidth="1200px"
    >
      <Container display="flex" flexDirection="column" alignItems="flex-start">
        <Box width="56px" height="56px" mb={3}>
          <Illustration src={`/static/images/how-it-works/event-illustration.png`} alt="Event Icon" />
        </Box>
        <Box width="288px">
          <H3 fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" color="black.800" mb={3}>
            <FormattedMessage id="Events" defaultMessage="Events" />
          </H3>
          <P fontSize="18px" lineHeight="26px" color="black.700" fontWeight="500">
            <FormattedMessage
              id="howItWorks.events.description"
              defaultMessage="Host online or offline events, with ticket sale revenue going straight to your transparent budget."
            />
          </P>
        </Box>
      </Container>
      <Container display="flex" flexDirection="column" alignItems="flex-start">
        <Box width="56px" height="56px" mb={3}>
          <Illustration src={`/static/images/how-it-works/projects-illustration.png`} alt="Event Icon" />
        </Box>
        <Box width="288px">
          <H3 fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" color="black.800" mb={3}>
            <FormattedMessage id="Projects" defaultMessage="Projects" />
          </H3>
          <P fontSize="18px" lineHeight="26px" color="black.700" fontWeight="500">
            <FormattedMessage
              id="howItWorks.projects.description"
              defaultMessage="Manage a grant or raise money for a specific purpose, with flexible tools for segregating your budget."
            />
          </P>
        </Box>
      </Container>
      <Container display="flex" flexDirection="column" alignItems="flex-start">
        <Box width="56px" height="56px" mb={3}>
          <Illustration src={`/static/images/how-it-works/virtualCard-illustration.png`} alt="Event Icon" />
        </Box>
        <Box width="288px">
          <H3 fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" color="black.800" mb={3}>
            <FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />
          </H3>
          <P fontSize="18px" lineHeight="26px" color="black.700" fontWeight="500">
            <FormattedMessage
              id="howItWorks.virtualCards.description"
              defaultMessage="Spend money anywhere you’d use a credit or debit card online, linked directly to your Open Collective funds (this beta feature is only available to certain fiscal hosts)."
            />
          </P>
        </Box>
      </Container>
      <Container display="flex" flexDirection="column" alignItems="flex-start">
        <Box width="56px" height="56px" mb={3}>
          <Illustration src={`/static/images/how-it-works/embeddable-illustration.png`} alt="Event Icon" />
        </Box>
        <Box width="288px">
          <H3 fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" color="black.800" mb={3}>
            <FormattedMessage id="howItWorks.embeddable" defaultMessage="Embeddable" />
          </H3>
          <P fontSize="18px" lineHeight="26px" color="black.700" fontWeight="500">
            <FormattedMessage
              id="howItWorks.embeddable.description"
              defaultMessage="You can display the Open Collective contribution component directly on your own website, meaning people don’t need to leave your page to pay."
            />
          </P>
        </Box>
      </Container>
      <Container display="flex" flexDirection="column" alignItems="flex-start">
        <Box width="56px" height="56px" mb={3}>
          <Illustration src={`/static/images/how-it-works/extraSecurity-illustration.png`} alt="Event Icon" />
        </Box>
        <Box width="288px">
          <H3 fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" color="black.800" mb={3}>
            <FormattedMessage id="howItWorks.extraSecurity" defaultMessage="Extra security" />
          </H3>
          <P fontSize="18px" lineHeight="26px" color="black.700" fontWeight="500">
            <FormattedMessage
              id="howItWorks.extraSecurity.description"
              defaultMessage="Optional 2-factor authentication. As a tool for managing money, we take security very seriously."
            />
          </P>
        </Box>
      </Container>
    </Flex>
    <Box mt="74px">
      <StyledLink
        width="100%"
        buttonStyle="marketingSecondary"
        buttonSize="medium"
        href="https://docs.opencollective.com/help/"
        fontWeight="500"
      >
        <FormattedMessage defaultMessage="Learn more" id="TdTXXf" />
      </StyledLink>
    </Box>
  </Flex>
);

export default MoreFeatures;
