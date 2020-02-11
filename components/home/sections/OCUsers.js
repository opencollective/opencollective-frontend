import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { P } from '../../Text';
import { HomeStandardLink } from '../HomeLinks';
import StyledCarousel from '../../StyledCarousel';
import Container from '../../Container';
import SectionTitle from '../SectionTitle';
import SectionSubTitle from '../SectionSubtitle';
import Link from '../../Link';

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
  'home.OCusers.opensource': {
    id: 'home.OCusers.opensource',
    defaultMessage:
      'More than 1,700 open source communities use Open Collective to receive money from companies and individuals.',
  },
  'home.OCusers.meetups': {
    id: 'home.OCusers.meetups',
    defaultMessage:
      'Nearly 100 chapters of Women Who Code use Open Collective to raise money locally and allocate donations throughout their network.',
  },
  'home.OCusers.movements': {
    id: 'home.OCusers.movements',
    defaultMessage:
      'Many local XR groups are using Open Collective to be transparent, engage their communities, and cover their expenses.',
  },
});

const users = [
  {
    id: 'opensource',
    name: 'Babel Collective',
    type: 'Open Source Projects',
    description: '',
    collectivePath: '/babel',
    picture: '/static/images/home/oc-users-babel.png',
  },
  {
    id: 'meetups',
    name: 'Women Who Code Atlanta',
    type: 'Meetups',
    description: 'We will never lock you in. Everything we do is open source (MIT License)',
    collectivePath: '/wwcodeatl',
    picture: '/static/images/home/oc-users-womenwhocode.png',
  },
  {
    id: 'movements',
    name: 'Extinction Rebellion Belgium',
    type: 'Movements',
    description: 'We will never lock you in. Everything we do is open source (MIT License)',
    collectivePath: '/xr-belgium',
    picture: '/static/images/home/oc-users-extinctionrebllion.png',
  },
];

const User = ({ id, name, picture, type, collectivePath }) => {
  const intl = useIntl();

  return (
    <Container textAlign="center" display="flex" flexDirection="column" alignItems="center" mx={[null, null, 3]}>
      <ImgWrapper width={[1, null, '288px', null, '368px']}>
        <Link route={collectivePath}>
          <Img alt={name} src={picture} width="100%" />
        </Link>
      </ImgWrapper>
      <Container
        textAlign="center"
        display="flex"
        flexDirection="column"
        alignItems="center"
        width={[1, null, '288px', null, '368px']}
      >
        <P
          fontSize={['15px', 'H5']}
          lineHeight={['25px', '28px']}
          color="black.600"
          lineSpacing={['-0.016em', '-0.6px']}
          fontWeight="300"
          my={3}
        >
          {type}
        </P>
        <Box width={[null, null, id === 'opensource' ? '150px' : null]} mb={[2, null, 4]}>
          <P
            fontSize={['H5', null, 'H4', null, 'H3']}
            lineHeight={['28px', null, 'H4', null, '40px']}
            color="black.900"
            letterSpacing="-0.2px"
            fontWeight="bold"
            wordWrap="break-word"
          >
            {name}
          </P>
        </Box>
        <Box display={['none', null, null, null, 'block']} width="360px" height="75px" my={3}>
          <P fontSize={'15px'} lineHeight={'25px'} letterSpacing={'-0.016em'} color="black.600">
            {intl.formatMessage(messages[`home.OCusers.${id}`])}
          </P>
        </Box>
        <HomeStandardLink width="72px" href="/discover">
          <FormattedMessage id="home.more" defaultMessage="More" />
        </HomeStandardLink>
      </Container>
    </Container>
  );
};

User.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  picture: PropTypes.string,
  type: PropTypes.string,
  collectivePath: PropTypes.string,
};

const OCUsers = () => {
  return (
    <Flex my={[4, null, 6]} flexDirection="column" mx={[3, 4]} alignItems="center">
      <SectionTitle textAlign="center">
        <FormattedMessage id="home.OCUsersSection.title" defaultMessage="Who is using Open Collective?" />
      </SectionTitle>
      <Container width={['288px', 1, '768px', null, '991px']} mb={4} textAlign="center">
        <SectionSubTitle fontWeight="300" textAlign="center" mb={4}>
          <FormattedMessage
            id="home.OCUsersSection.subtitle"
            defaultMessage="Communities around the world are using Open Collective. Find out more about them!"
          />
        </SectionSubTitle>
        <Box mt={5}>
          <HomeStandardLink fontSize="14px" lineHeight="18px" href="/discover">
            <FormattedMessage id="home.discover" defaultMessage="Discover more" />
          </HomeStandardLink>
        </Box>
      </Container>
      <StyledCarousel options={users} display={[null, null, 'none']} width={1}>
        {users.map(user => (
          <User key={user.id} {...user} />
        ))}
      </StyledCarousel>
      <Flex mt={4}>
        <Container display={['none', null, 'flex']}>
          {users.map(user => (
            <Fragment key={user.id}>
              <User {...user} />
            </Fragment>
          ))}
        </Container>
      </Flex>
    </Flex>
  );
};

export default OCUsers;
