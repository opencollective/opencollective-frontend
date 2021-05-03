import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import SectionSubtitle from '../home/SectionSubtitle';
import SectionTitle from '../home/SectionTitle';
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

const OCPotentialUsers = [
  {
    id: 'community',
    desktopItemOrder: 2,
  },
  {
    id: 'grantRecipients',
    desktopItemOrder: 1,
  },
  {
    id: 'timeLimited',
    desktopItemOrder: 4,
  },
  {
    id: 'unincorporatedGroup',
    desktopItemOrder: 3,
  },
  {
    id: 'crowdFunding',
    desktopItemOrder: 5,
  },
  {
    id: 'youngActivists',
    desktopItemOrder: 6,
  },
];

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
});

const WhoIsFiscalHosting = () => {
  const intl = useIntl();

  return (
    <React.Fragment>
      <Flex
        display="flex"
        mt={[null, null, '120px']}
        flexDirection={['column', 'row']}
        alignItems="center"
        justifyContent="center"
        mx={[3, 4]}
      >
        <Container
          display="flex"
          flexDirection={'column'}
          alignItems="center"
          width={[1, '392px', null, null, '657px']}
          mr={[null, 2, 5]}
        >
          <Box textAlign={['center', 'left']} width={['288px', 1]}>
            <SectionTitle fontSize="32px" lineHeight="40px" letterSpacing="-1.2px" color="black.800">
              <FormattedMessage
                id="fiscalHosting.whoIsFiscalHostingFor.title"
                defaultMessage="Who is fiscal hosting for?"
              />
            </SectionTitle>
          </Box>
          <Box display={['block', 'none']} my={3}>
            <NextIllustration
              width={224}
              height={144}
              src="/static/images/home/weareopen-illustration-md.png"
              alt="Who is fiscal hosting for illustration"
            />
          </Box>
          <Box my={2} width={['288px', 1]} textAlign={['center', 'left']}>
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
        </Container>
        <Box
          display={['none', 'block']}
          width={['224px', null, null, null, '336px']}
          height={['144px', null, null, null, '216px']}
          my={5}
          ml={[null, null, 5]}
        >
          <NextIllustration
            width={336}
            height={216}
            src="/static/images/home/weareopen-illustration-md.png"
            alt="We are open in every way"
          />
        </Box>
      </Flex>
      <Container
        mx={[3, 4]}
        my={4}
        display={[null, 'flex']}
        flexDirection={[null, 'column']}
        justifyContent="center"
        alignItems="center"
      >
        <Container
          width={[null, '650px', '704px', null, '1150px']}
          display="flex"
          flexDirection={['column', 'row']}
          alignItems={['center', null, null, null, 'baseline']}
          my={4}
          ml={[3, 0]}
          flexWrap={[null, 'wrap']}
          justifyContent="space-between"
        >
          {OCPotentialUsers.map(user => (
            <React.Fragment key={user.id}>
              <Container
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                my={[2, null, null, null, 4]}
                order={[null, user.desktopItemOrder]}
              >
                {/* <IconWrapper my={2}>
                  <NextIllustration
                    width={60}
                    height={60}
                    src={`/static/images/home/${channel.id}-illustration.png`}
                    alt={`${channel.id} illustration`}
                  />
                </IconWrapper> */}
                <Box width={['288px', '306px', null, null, '289px']}>
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
            </React.Fragment>
          ))}
        </Container>
      </Container>
    </React.Fragment>
  );
};
export default WhoIsFiscalHosting;
