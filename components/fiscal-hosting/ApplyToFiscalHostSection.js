import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import SectionSubTitle from '../home/SectionSubtitle';
import SectionTitle from '../home/SectionTitle';
import Link from '../Link';
import StyledCarousel from '../StyledCarousel';
import StyledLink from '../StyledLink';
import { P, Span } from '../Text';

const Img = styled.img`
  max-width: 100%;
`;

const ImgWrapper = styled(Box)`
  border-radius: 8px;
  &:hover {
    box-shadow: 0px 8px 12px rgba(20, 20, 20, 0.16);
  }
`;

const messages = defineMessages({
  'fiscalHosting.hosts.opensource': {
    id: 'fiscalHosting.hosts.opensource',
    defaultMessage:
      'A US 501(c)(3) nonprofit entity with a broad mission covering most charitable activities in the United States.',
  },
  'fiscalHosting.hosts.meetups': {
    id: 'fiscalHosting.hosts.meetups',
    defaultMessage:
      'A US 501(c)(6) nonprofit entity serving as fiscal host to open source projects and related communities around the world.',
  },
  'fiscalHosting.hosts.movements': {
    id: 'fiscalHosting.hosts.movements',
    defaultMessage:
      'A UK host for mutual aid groups and social movements, providing tools, strategy, and back office support to scale up and get on with changing the world.',
  },
});

const hosts = [
  {
    id: 'opensource',
    name: 'Open Collective Foundation',
    location: '🇺🇸 United States',
    collectivePath: '/foundation',
    learnMorePath: '/discover?show=open%20source',
    picture: '/static/images/home/oc-users-babel.png',
  },
  {
    id: 'meetups',
    name: 'Women Who Code',
    location: '🇺🇸 United States',
    collectivePath: '/wwcodeatl',
    learnMorePath: '/wwcodeinc',
    picture: '/static/images/home/oc-users-womenwhocode.png',
  },
  {
    id: 'movements',
    name: 'Extinction Rebellion',
    location: '🇬🇧 United Kingdom',
    collectivePath: '/xr-belgium',
    learnMorePath: '/search?q=rebellion',
    picture: '/static/images/home/oc-users-extinctionrebllion.png',
  },
];

const Host = ({ id, name, picture, location, collectivePath }) => {
  const intl = useIntl();

  return (
    <Container textAlign="center" display="flex" flexDirection="column" alignItems="center" mx={[null, 3, 3]}>
      <ImgWrapper width={[1, '205px', null, '288px', '368px']}>
        <Link href={collectivePath}>
          <Img alt={name} src={picture} width="100%" />
        </Link>
      </ImgWrapper>
      <Container
        textAlign="center"
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        width={[1, '206px', null, '288px', '368px']}
      >
        <P
          fontSize={['15px', '18px']}
          lineHeight={['23px', '27px']}
          color="black.600"
          lineSpacing={['-0.12px', '-0.2px']}
          fontWeight="normal"
          mt={24}
          mb={12}
        >
          {location}
        </P>
        <Box mb={2}>
          <P
            fontSize={['15px', '24px']}
            lineHeight={['23px', '32px']}
            color="black.800"
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
            color="black.600"
          >
            {intl.formatMessage(messages[`fiscalHosting.hosts.${id}`])}
          </P>
        </Box>
        <Link href="#">
          <FormattedMessage id="apply" defaultMessage="Apply" />
          <Span ml="8px">
            <ArrowRight2 size="18" />
          </Span>
        </Link>
      </Container>
    </Container>
  );
};

Host.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  picture: PropTypes.string,
  location: PropTypes.string,
  collectivePath: PropTypes.string,
  learnMorePath: PropTypes.string,
};

const ApplyToFiscalHosts = () => {
  return (
    <Flex my={4} flexDirection="column" mx={[3, 4]} alignItems="center">
      <SectionTitle
        textAlign="center"
        fontSize={[null, '32px']}
        lineHeight={[null, '40px']}
        letterSpacing={[null, '-1.2px']}
      >
        <FormattedMessage id="fiscalHosting.applyToFiscalHost" defaultMessage="Apply to one of our Fiscal Hosts" />
      </SectionTitle>
      <Container width={['286px', '648px']} mb={4} textAlign="center">
        <SectionSubTitle
          color="black.700"
          fontWeight="500"
          textAlign="center"
          mb={4}
          fontSize={[null, '20px']}
          lineHeight={[null, '28px']}
          letterSpacing={[null, '-0.6px']}
        >
          <FormattedMessage
            id="fiscalHosting.applyToFiscalHost.description"
            defaultMessage="Organizations around the world are using Open Collective to host multiple projects, groups and communities Find out more about them!"
          />
        </SectionSubTitle>
      </Container>
      <StyledCarousel options={hosts} display={[null, 'none']} width={1}>
        {hosts.map(host => (
          <Host key={host.id} {...host} />
        ))}
      </StyledCarousel>
      <Flex mt={2}>
        <Container display={['none', 'flex']}>
          {hosts.map(host => (
            <Fragment key={host.id}>
              <Host {...host} />
            </Fragment>
          ))}
        </Container>
      </Flex>
      <Box mt={4}>
        <StyledLink as={Link} buttonStyle="standard" buttonSize="medium" href="/discover">
          <FormattedMessage id="home.discover" defaultMessage="Discover more" />
        </StyledLink>
      </Box>
    </Flex>
  );
};

export default ApplyToFiscalHosts;
