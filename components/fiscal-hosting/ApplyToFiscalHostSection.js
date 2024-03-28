import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledCarousel from '../StyledCarousel';
import StyledLink from '../StyledLink';
import { P } from '../Text';

import { HOSTS } from './constants';

const ApplyLink = styled(StyledLink)`
  border-radius: 16px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const messages = defineMessages({
  'fiscalHosting.hosts.OSC': {
    id: 'fiscalHosting.hosts.OSC',
    defaultMessage:
      'A US 501(c)(6) nonprofit entity serving as fiscal host to open source projects and related communities around the world.',
  },
  'fiscalHosting.hosts.socialchangenestcollective': {
    id: 'fiscalHosting.hosts.socialchangenestcollective',
    defaultMessage:
      'A UK host for mutual aid groups and social movements, providing tools, strategy, and back office support to scale up and get on with changing the world.',
  },
  'fiscalHosting.hosts.allForClimate': {
    id: 'fiscalHosting.hosts.allForClimate',
    defaultMessage:
      'Dedicated to movements for climate and social justice, host to many local Extinction Rebellion chapters and related communities.',
  },
  'fiscalHosting.hosts.OCE': {
    id: 'fiscalHosting.hosts.OCE',
    defaultMessage:
      'A Brussels-based nonprofit hosting groups across Europe, including open source projects and community social action.',
  },
  'fiscalHosting.hosts.OCN': {
    id: 'fiscalHosting.hosts.OCN',
    defaultMessage: 'Offering kiwi impact projects fundholding options through a charity or a company structure.',
  },
});

const groupHostsIntoSections = hosts =>
  hosts.reduce(
    (rows, key, index) => (index % 3 === 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows,
    [],
  );

const Host = ({ id, name, logo, bgImage, location, color, collectivePath }) => {
  const intl = useIntl();
  return (
    <ApplyLink as={Link} href={collectivePath}>
      <Container
        textAlign="center"
        display="flex"
        flexDirection="column"
        alignItems="center"
        mx={[null, 2, null, null, 3]}
        my={3}
      >
        <Container
          width={['288px', '205px', '270px', null, '360px']}
          height={['210px', '218px', '218px', null, '256px']}
          background={`url("/static/images/become-a-host/${bgImage}.png") no-repeat`}
          backgroundSize={['contain', 'cover', '100% 100%']}
          display="flex"
          justifyContent="center"
          alignItems="center"
          borderRadius="8px"
        >
          <Avatar radius="96px" src={logo} name={name} type="ORGANIZATION" />
        </Container>
        <Container
          textAlign="center"
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          width={['288px', '205px', '270px', null, '360px']}
        >
          <P
            fontSize={['15px', '18px']}
            lineHeight={['23px', '27px']}
            color={color || 'black.600'}
            lineSpacing={['-0.12px', '-0.2px']}
            fontWeight="normal"
            mt="16px"
            mb="12px"
          >
            {location}
          </P>
          <Box mb={2}>
            <P
              fontSize={['15px', '24px']}
              lineHeight={['23px', '32px']}
              color={color || 'black.800'}
              letterSpacing={['-0.12px', '-0.8px']}
              fontWeight="bold"
              wordWrap="break-word"
              textAlign="left"
            >
              {name}
            </P>
          </Box>
          <Box my={2}>
            <P
              fontSize={['15px', '16px', null, null, '18px']}
              textAlign="left"
              lineHeight={['25px', '24px', null, null, '27px']}
              letterSpacing={['-0.016em', '-0.16px', null, null, '-0.2px']}
              color={color || 'black.600'}
            >
              {intl.formatMessage(messages[`fiscalHosting.hosts.${id}`])}
            </P>
          </Box>
        </Container>
      </Container>
    </ApplyLink>
  );
};

Host.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  picture: PropTypes.string,
  location: PropTypes.string,
  collectivePath: PropTypes.string,
  logo: PropTypes.string,
  bgImage: PropTypes.string,
  color: PropTypes.string,
};

const ApplyToHostDesktopCarousel = ({ display, controllerPosition }) => (
  <StyledCarousel controllerPosition={controllerPosition} width={1} display={display}>
    {groupHostsIntoSections(HOSTS).map((groupedHost, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <Container display={['none', 'flex']} key={index.toString()} justifyContent="center" width={1}>
        {groupedHost.map(host => (
          <Fragment key={host.id}>
            <Host {...host} />
          </Fragment>
        ))}
      </Container>
    ))}
  </StyledCarousel>
);

ApplyToHostDesktopCarousel.propTypes = {
  display: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  controllerPosition: PropTypes.string,
};

export const ApplyToHostMobileCarousel = ({ color }) => (
  <StyledCarousel display={[null, 'none']} width={1}>
    {HOSTS.map(host => (
      <Host key={host.id} color={color} {...host} />
    ))}
  </StyledCarousel>
);

ApplyToHostMobileCarousel.propTypes = {
  color: PropTypes.string,
};

export const ApplyToHostGrid = ({ color }) => (
  <Grid gridGap={[1, null, null, null, '48px']} gridTemplateColumns={'repeat(3, 1fr)'}>
    {HOSTS.map(host => (
      <Host key={host.id} color={color} {...host} />
    ))}
  </Grid>
);

ApplyToHostGrid.propTypes = {
  color: PropTypes.string,
};

const ApplyToFiscalHosts = () => (
  <Flex my={4} flexDirection="column" mx={[3, 4]} alignItems="center">
    <SectionTitle textAlign="center" mb="8px">
      <FormattedMessage id="fiscalHosting.applyToFiscalHost" defaultMessage="Apply to one of our Fiscal Hosts" />
    </SectionTitle>
    <Container width={['286px', '648px', '705px', null, '936px']} textAlign="center" mb={4}>
      <SectionDescription textAlign="center" my="0">
        <FormattedMessage
          id="fiscalHosting.applyToFiscalHost.description"
          defaultMessage="<orgsAroundTheWorldLink>Organizations around the world</orgsAroundTheWorldLink> are using Open Collective to host multiple projects, groups and communities. Find out more about them! Or you can <createYourOwnFiscalHostLink>create your own fiscal host</createYourOwnFiscalHostLink>."
          values={{
            orgsAroundTheWorldLink: getI18nLink({
              as: Link,
              href: '/search?isHost=true',
            }),
            createYourOwnFiscalHostLink: getI18nLink({
              as: Link,
              href: '/become-a-host',
            }),
          }}
        />
      </SectionDescription>
    </Container>
    <ApplyToHostMobileCarousel />
    <Flex mt={2} width={1} maxWidth="1200px">
      <ApplyToHostDesktopCarousel display={['none', 'block', 'none']} controllerPosition="bottom" />
      <ApplyToHostDesktopCarousel display={['none', null, 'block']} controllerPosition="side" />
    </Flex>
  </Flex>
);

export default ApplyToFiscalHosts;
