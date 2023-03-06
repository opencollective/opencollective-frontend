import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledCarousel from '../StyledCarousel';
import { H3, P } from '../Text';

import { WHO_IS_FISCAL_HOSTING_FOR } from './constants';

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

const CarouselWrapper = styled(Container)`
  @media screen and (min-width: 40em) {
    margin-right: 0;
    margin-left: 0;
  }

  @media screen and (min-width: 48em) {
    margin-right: 32px;
    margin-left: 32px;
  }
`;

const PotentialUserContainer = styled(Container)`
  width: 288px;

  @media screen and (min-width: 40em) {
    width: 250px;
  }

  @media screen and (min-width: 48em) {
    width: 288px;
  }
`;

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
      'Of foundations or other funders, joining to support an impact area, who need money to sit in a neutral space.',
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
    id: 'fiscalHosting.companiesGivingBack',
    defaultMessage: 'Companies giving back',
  },
  'fiscalHosting.grantMakingInstitution.description': {
    id: 'fiscalHosting.grantMakingInstitution.description',
    defaultMessage:
      'Who may be restricted to funding registered charities, seeking to partner with a fiscal host in order reach less formal communities.',
  },
});

const PotentialUser = ({ id }) => {
  const intl = useIntl();
  return (
    <PotentialUserContainer
      display="flex"
      flexDirection="column"
      alignItems={['center', 'flex-start']}
      my={[0, null, null, null, 4]}
      width="288px"
    >
      <Flex flexDirection={['row', 'column']} width={1} alignItems={['center', 'flex-start']} mb={[3, 0]}>
        <IconWrapper my={[0, 2]}>
          <NextIllustration
            width={60}
            height={60}
            src={`/static/images/fiscal-hosting/${id}.png`}
            alt={`${id} illustration`}
          />
        </IconWrapper>
        <H3 ml={['16px', 0]} fontSize="20px" lineHeight="28px" letterSpacing="-0.6px" mb={2} color="black.800">
          {intl.formatMessage(messages[`fiscalHosting.${id}`])}
        </H3>
      </Flex>
      <Box width={1}>
        <P
          color={['black.700', 'black.600', 'black.700']}
          fontSize={['18px', '16px', null, null, '18px']}
          lineHeight={['26px', '24px', null, null, '27px']}
          letterSpacing={['-0.12px', '-0.16px']}
          mb={[0, 3]}
          fontWeight={['500', 'normal']}
        >
          {intl.formatMessage(messages[`fiscalHosting.${id}.description`])}
        </P>
      </Box>
    </PotentialUserContainer>
  );
};

PotentialUser.propTypes = {
  id: PropTypes.string,
};

const PotentialUsers = ({ users }) => {
  return (
    <Wrapper
      gridTemplateColumns={['100%', 'repeat(2, 1fr)', null, null, 'repeat(3, 1fr)']}
      placeItems="center"
      alignItems="flex-start"
    >
      {users.map(user => (
        <PotentialUser key={user.id} id={user.id} />
      ))}
    </Wrapper>
  );
};

PotentialUsers.propTypes = {
  users: PropTypes.array,
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
          mr={[null, 2, 0, null, 5]}
        >
          <Box my={3}>
            <NextIllustration
              width={224}
              height={144}
              src="/static/images/fiscal-hosting/who-is-fiscalHosting-illustration.png"
              alt="Who is fiscal hosting for illustration"
            />
          </Box>

          <Box width={['288px', '392px', '528px', null, '657px']} mr={[null, '29px', 0, null, '93px']}>
            <Box textAlign={['center', 'left']}>
              <SectionTitle>
                <FormattedMessage
                  id="fiscalHosting.whoIsFiscalHostingFor.title"
                  defaultMessage="Who is fiscal hosting for?"
                />
              </SectionTitle>
            </Box>

            <Box my={2} textAlign={['center', 'left']}>
              <SectionDescription>
                <FormattedMessage
                  id="fiscalHosting.whoIsFiscalHostingFor.subtitle"
                  defaultMessage="There are multiple cases where fiscal hosting can be valuable for a project."
                />
              </SectionDescription>
            </Box>
          </Box>
        </Container>
      </Flex>
      <CarouselWrapper
        my={4}
        display={[null, 'flex']}
        flexDirection={[null, 'column']}
        justifyContent="center"
        alignItems="center"
      >
        <StyledCarousel display={['block', 'none']} width="100%" maxWidth="1200px">
          {[...WHO_IS_FISCAL_HOSTING_FOR.firstCategories, ...WHO_IS_FISCAL_HOSTING_FOR.secondCategories].map(user => (
            <PotentialUser id={user.id} key={user.id} />
          ))}
        </StyledCarousel>

        <StyledCarousel display={['none', 'block']} width="100%" maxWidth="1200px" controllerPosition="side">
          {Object.keys(WHO_IS_FISCAL_HOSTING_FOR).map((categories, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <PotentialUsers key={index.toString()} users={WHO_IS_FISCAL_HOSTING_FOR[categories]} />
          ))}
        </StyledCarousel>
      </CarouselWrapper>
    </React.Fragment>
  );
};
export default WhoIsFiscalHosting;
