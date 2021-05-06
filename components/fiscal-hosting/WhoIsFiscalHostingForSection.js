import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import SectionSubtitle from '../home/SectionSubtitle';
import SectionTitle from '../home/SectionTitle';
import StyledCarousel from '../StyledCarousel';
import { H3, P } from '../Text';

const IconWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 56px;
  height: 56px;

  @media screen and (min-width: 88em) {
    width: 56px;
    height: 56px;
  }
`;

const Wrapper = styled(Grid)`
  justify-items: center;
`;

const OCPotentialUsers = {
  firstCategories: [
    {
      id: 'community',
    },
    {
      id: 'grantRecipients',
    },
    {
      id: 'timeLimited',
    },
    {
      id: 'unincorporatedGroup',
    },
    {
      id: 'crowdFunding',
    },
    {
      id: 'youngActivists',
    },
  ],
  secondCategories: [
    {
      id: 'newlyFormingCharity',
    },
    {
      id: 'distributeCollaboration',
    },
    {
      id: 'founderCoalition',
    },
    {
      id: 'companiesGivingBack',
    },
    {
      id: 'grantMakingInstitution',
    },
  ],
};

const messages = defineMessages({
  'fiscalHosting.community': {
    id: 'fiscalHosting.community',
    defaultMessage: 'Emergent community responses',
  },
  'fiscalHosting.community.description': {
    id: 'fiscalHosting.community.description',
    defaultMessage: 'To current events, like a pandemic, who need to get operational immediately.',
  },
  'fiscalHosting.grantRecipients': {
    id: 'fiscalHosting.grantRecipients',
    defaultMessage: 'Grant recipients or applicants',
  },
  'fiscalHosting.grantRecipients.description': {
    id: 'fiscalHosting.grantRecipients.description',
    defaultMessage: 'Who need a place to receive the funds and hold them as they are spent down.',
  },
  'fiscalHosting.timeLimited': {
    id: 'fiscalHosting.timeLimited',
    defaultMessage: 'Time-limited projects',
  },
  'fiscalHosting.timeLimited.description': {
    id: 'fiscalHosting.timeLimited.description',
    defaultMessage:
      "Where it doesn't make sense to set up a whole new organization only to wind it up six months later.",
  },
  'fiscalHosting.unincorporatedGroup': {
    id: 'fiscalHosting.unincorporatedGroup',
    defaultMessage: 'An unincorporated group',
  },
  'fiscalHosting.unincorporatedGroup.description': {
    id: 'fiscalHosting.unincorporatedGroup.description',
    defaultMessage:
      'Like a meetup, needing to fundraise, collect membership dues, or sign a contract with a venue or sponsor.',
  },
  'fiscalHosting.crowdFunding': {
    id: 'fiscalHosting.crowdFunding',
    defaultMessage: 'A crowdfunding campaign',
  },
  'fiscalHosting.crowdFunding.description': {
    id: 'fiscalHosting.crowdFunding.description',
    defaultMessage: 'Seeking a place to hold the money and a way to offer accountability to their backers.',
  },
  'fiscalHosting.youngActivists': {
    id: 'fiscalHosting.youngActivists',
    defaultMessage: 'Young activists and change-makers',
  },
  'fiscalHosting.youngActivists.description': {
    id: 'fiscalHosting.youngActivists.description',
    defaultMessage: 'Who may lack the experience to manage their own legal entity.',
  },
  'fiscalHosting.newlyFormingCharity': {
    id: 'fiscalHosting.newlyFormingCharity',
    defaultMessage: 'A newly-forming charity',
  },
  'fiscalHosting.newlyFormingCharity.description': {
    id: 'fiscalHosting.newlyFormingCharity.description',
    defaultMessage:
      'Who wants to enable tax-deductible donations and philanthropic grants, without waiting to get charity status themselves.',
  },
  'fiscalHosting.distributeCollaboration': {
    id: 'fiscalHosting.distributeCollaboration',
    defaultMessage: 'A distributed collaboration',
  },
  'fiscalHosting.distributeCollaboration.description': {
    id: 'fiscalHosting.distributeCollaboration.description',
    defaultMessage:
      'Like an open source software project, which isn’t owned by anyone and wants resources held in common.',
  },
  'fiscalHosting.founderCoalition': {
    id: 'fiscalHosting.founderCoalition',
    defaultMessage: 'Funder coalitions',
  },
  'fiscalHosting.founderCoalition.description': {
    id: 'fiscalHosting.founderCoalition.description',
    defaultMessage:
      'Like an open source software project, which isn’t owned by anyone and wants resources held in common.',
  },
  'fiscalHosting.companiesGivingBack': {
    id: 'fiscalHosting.companiesGivingBack',
    defaultMessage: 'Companies giving back',
  },
  'fiscalHosting.companiesGivingBack.description': {
    id: 'fiscalHosting.companiesGivingBack.description',
    defaultMessage:
      'Can work with a nonprofit fiscal host to separate funds from the commercial side and coordinate grants and sponsorships.',
  },
  'fiscalHosting.grantMakingInstitution': {
    id: 'fiscalHosting.grantMakingInstitution',
    defaultMessage: 'Companies giving back',
  },
  'fiscalHosting.grantMakingInstitution.description': {
    id: 'fiscalHosting.grantMakingInstitution.description',
    defaultMessage:
      'Who may be restricted to funding registered charities, seeking to partner with a fiscal host in order reach less formal communities.',
  },
});

const PotentialUsers = ({ users }) => {
  const intl = useIntl();

  return (
    <Wrapper
      gridTemplateColumns={['100%', 'repeat(2, 1fr)', null, null, 'repeat(3, 1fr)']}
      placeItems="center"
      alignItems="center"
    >
      {users.map(user => (
        <Container
          key={user.id}
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          my={[2, null, null, null, 4]}
        >
          <IconWrapper my={2}>
            <NextIllustration
              width={60}
              height={60}
              src={`/static/images/fiscal-hosting/${user.id}.png`}
              alt={`${user.id} illustration`}
            />
          </IconWrapper>
          <Box width={['288px', null, null, null, '289px']}>
            <H3 fontSize="20px" lineHeight="28px" letterSpacing="-0.6px" mb={2} color="black.800">
              {intl.formatMessage(messages[`fiscalHosting.${user.id}`])}
            </H3>
            <P
              color={['black.700', 'black.600', 'black.700']}
              fontSize={['15px', '16px', null, null, '18px']}
              lineHeight={['23px', '24px', null, null, '27px']}
              letterSpacing={['-0.12px', '-0.16px']}
              mb={3}
            >
              {intl.formatMessage(messages[`fiscalHosting.${user.id}.description`])}
            </P>
          </Box>
        </Container>
      ))}
    </Wrapper>
  );
};

const WhoIsFiscalHosting = () => {
  return (
    <React.Fragment>
      <Flex
        display="flex"
        mt={[null, null, '120px', null, '240px']}
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent="center"
        mx={[3, 4]}
      >
        <Container
          display="flex"
          flexDirection={['column', 'row-reverse']}
          alignItems="center"
          justifyContent="center"
          mr={[null, 2, 5]}
        >
          <Box my={3}>
            <NextIllustration
              width={224}
              height={144}
              src="/static/images/fiscal-hosting/who-is-fiscalHosting-illustration.png"
              alt="Who is fiscal hosting for illustration"
            />
          </Box>

          <Box width={['288px', '392px', null, null, '657px']} mr={[null, '29px', '93px']}>
            <Box textAlign={['center', 'left']}>
              <SectionTitle fontSize="32px" lineHeight="40px" letterSpacing="-1.2px" color="black.800">
                <FormattedMessage
                  id="fiscalHosting.whoIsFiscalHostingFor.title"
                  defaultMessage="Who is fiscal hosting for?"
                />
              </SectionTitle>
            </Box>

            <Box my={2} textAlign={['center', 'left']}>
              <SectionSubtitle
                color={['black.600', 'black.700']}
                fontSize={['16px', '20px']}
                lineHeight={['24px', '28px']}
                letterSpacing={['-0.16px', '-0.6px']}
              >
                <FormattedMessage
                  id="fiscalHosting.whoIsFiscalHostingFor.subtitle"
                  defaultMessage="There are multiple cases where fiscal hosting can be valuable for a project."
                />
              </SectionSubtitle>
            </Box>
          </Box>
        </Container>
      </Flex>
      <Container
        mx={[null, 4]}
        my={4}
        display={[null, 'flex']}
        flexDirection={[null, 'column']}
        justifyContent="center"
        alignItems="center"
      >
        <StyledCarousel options={Object.keys(OCPotentialUsers)} width="100%">
          {Object.keys(OCPotentialUsers).map((categories, index) => (
            <PotentialUsers key={index.toString()} users={OCPotentialUsers[categories]} />
          ))}
        </StyledCarousel>
      </Container>
    </React.Fragment>
  );
};
export default WhoIsFiscalHosting;
