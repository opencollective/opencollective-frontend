import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { H2, H3, P } from '../Text';

const IconWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;

  @media screen and (min-width: 40em) {
    width: 88px;
    height: 88px;
  }

  @media screen and (min-width: 88em) {
    width: 99px;
    height: 104px;
  }
`;

const features = [
  {
    id: 'nonprofits',
  },
  {
    id: 'networks',
  },
  {
    id: 'grantMakers',
  },
  {
    id: 'entity',
  },
  {
    id: 'fiscalSponsorshipService',
  },
];

const messages = defineMessages({
  'becomeAHost.networks': {
    id: 'becomeAHost.networks',
    defaultMessage: 'Networks of groups or chapters',
  },
  'becomeAHost.networks.description': {
    id: 'becomeAHost.networks.description',
    defaultMessage:
      'Who want to enable local fundraising while operating a single common legal entity, such as meetups and social movements.',
  },
  'becomeAHost.nonprofits': {
    id: 'becomeAHost.nonprofits',
    defaultMessage: 'Nonprofits and charities',
  },
  'becomeAHost.nonprofits.description': {
    id: 'becomeAHost.nonprofits.description',
    defaultMessage:
      'Who want to enable unincorporated projects that further their mission areas to receive grants and donations under their umbrella.',
  },
  'becomeAHost.entity': {
    id: 'becomeAHost.entity',
    defaultMessage: 'Any entity with a bank account',
  },
  'becomeAHost.entity.description': {
    id: 'becomeAHost.entity.description',
    defaultMessage:
      'Who runs multiple projects and wants to use the Open Collective platform features for transparent budget tracking, combining revenue streams, expense payment management, and community engagement.',
  },
  'becomeAHost.grantMakers': {
    id: 'becomeAHost.grantMakers',
    defaultMessage: 'Grantmakers and funding institutions',
  },
  'becomeAHost.grantMakers.description': {
    id: 'becomeAHost.grantMakers.description',
    defaultMessage:
      'Who want to lower the barriers for unincorporated projects and informal initiatives, while ensuring robust oversight.',
  },
  'becomeAHost.fiscalSponsorshipService': {
    id: 'becomeAHost.fiscalSponsorshipService',
    defaultMessage: 'Fiscal sponsorship service providers',
  },
  'becomeAHost.fiscalSponsorshipService.description': {
    id: 'becomeAHost.fiscalSponsorshipService.description',
    defaultMessage: 'In their chosen geography or industry area.',
  },
});

const WhoAreFiscalHosts = () => {
  const intl = useIntl();

  return (
    <Flex flexDirection="column" alignItems="center" px="16px" mt="80px">
      <Container
        display="flex"
        flexDirection={['column-reverse', 'row']}
        justifyContent="center"
        alignItems="center"
        textAlign={['center', 'left']}
        mb={[4, null, null, null, '69px']}
      >
        <Box width={['288px', '392px', '396px', null, '448px']}>
          <H2
            color="black.800"
            fontSize={['32px', null, null, null, '40px']}
            lineHeight={['40px', null, null, null, '48px']}
            letterSpacing={['-0.008em', null, null, null, '-0.04em']}
          >
            <FormattedMessage id="becomeAHost.whoAreFiscalHosts" defaultMessage="Who are Fiscal Hosts?" />
          </H2>
        </Box>
        <Box
          ml={[0, '17px', '86px', null, '77px']}
          mb="23px"
          width={['222.74px', null, null, null, '330px']}
          height={['142.48px']}
        >
          <Illustration
            src="/static/images/become-a-host/whoAreFiscalHost-illustration.png"
            alt="Who are Fiscal Hosts illustration"
          />
        </Box>
      </Container>
      <Flex
        flexWrap="wrap"
        justifyContent={['space-between', null, null, null, 'center']}
        width={[null, '648px', '704px', null, '1150px']}
        flexDirection={['column', 'row']}
      >
        {features.map(feature => (
          <Container
            key={feature.id}
            my={3}
            mx={[null, '12px', 3, null, 4]}
            ml={[
              null,
              feature.id === 'entity' || feature.id === 'networks' ? '12px' : 0,
              feature.id === 'entity' || feature.id === 'networks' ? '46px' : 0,
              null,
              feature.id === 'grantMakers' || feature.id === 'fiscalSponsorshipService' || feature.id === 'networks'
                ? '103px'
                : 0,
            ]}
            mr={[
              null,
              feature.id === 'nonprofits' || feature.id === 'grantMakers' ? '12px' : 0,
              feature.id === 'nonprofits' || feature.id === 'grantMakers' ? '46px' : 0,
              null,
              0,
            ]}
          >
            <IconWrapper my={2}>
              <Illustration
                src={`/static/images/become-a-host/${feature.id}-illustration.png`}
                alt={`${feature.id} illustration`}
              />
            </IconWrapper>
            <Box width={['288px', '306px', null, null, '297px']}>
              <H3 color="black.800" fontSize="20px" lineHeight="28px" letterSpacing="-0.008em">
                {intl.formatMessage(messages[`becomeAHost.${feature.id}`])}
              </H3>
            </Box>
            <Box mt={2} width={['288px', '306px', null, null, '289px']}>
              <P
                color="black.700"
                fontSize={['16px', '18px']}
                lineHeight={['24px', '26px']}
                fontWeight="400"
                letterSpacing="normal"
              >
                {intl.formatMessage(messages[`becomeAHost.${feature.id}.description`])}
              </P>
            </Box>
          </Container>
        ))}
      </Flex>
    </Flex>
  );
};

export default WhoAreFiscalHosts;
