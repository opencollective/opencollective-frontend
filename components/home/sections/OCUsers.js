import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';
import { ArrowRight } from '@styled-icons/feather/ArrowRight';

import StyledCarousel from '../../StyledCarousel';
import StyledLink from '../../StyledLink';
import HomePrimaryLink from '../HomePrimaryLink';
import { P, Span } from '../../Text';
import Container from '../../Container';
import SectionTitle from '../SectionTitle';
import SectionSubTitle from '../SectionSubtitle';

const Img = styled.img`
  max-width: 100%;
`;

const users = [
  {
    id: 1,
    name: 'Babel collective',
    type: 'Open Source Projects',
    description: 'We will never lock you in. Everything we do is open source (MIT License)',
    collectiveUrl: '',
    picture: '/static/images/oc-users-babel.png',
  },
  {
    id: 2,
    name: 'Women Who Code Atlanta',
    type: 'Meetups',
    description: 'We will never lock you in. Everything we do is open source (MIT License)',
    collectiveUrl: '',
    picture: '/static/images/oc-users-womenwhocode.png',
  },
  {
    id: 3,
    name: 'Extinction Rebellion Belgium',
    type: 'Movements',
    description: 'We will never lock you in. Everything we do is open source (MIT License)',
    collectiveUrl: '/',
    picture: '/static/images/oc-users-extinctionrebllion.png',
  },
];

const User = ({ name, picture, type }) => (
  <Container
    width={[1, null, '288px', null, '368px']}
    textAlign="center"
    display="flex"
    flexDirection="column"
    alignItems="center"
    mx={[null, null, 3]}
  >
    <Img alt={name} src={picture} width="100%" />
    <P fontSize="LeadParagraph" lineHeight="22px" color="blue.600" lineSpacing="-0.008em" fontWeight="bold" my={3}>
      {type}
    </P>
    <P
      fontSize={['H5', null, 'H4', null, 'H3']}
      lineHeight={['28px', null, 'H4', null, '40px']}
      color="black.900"
      lineSpacing="-0.2px"
      mb={3}
      fontWeight="bold"
    >
      {name}
    </P>
    <Container display={['none', null, 'block']} my={3}>
      <P fontSize={'15px'} lineHeight={'25px'} lineSpacing={'-0.008em'} fontWeight="bold">
        <FormattedMessage
          id="home.OCUsersSection.licenseDescription"
          defaultMessage="We will never lock you in. Everything we do is open source (MIT License)"
        />
      </P>
    </Container>
    <StyledLink href="#" display={['block', null, 'none']} color="blue.600">
      <Span mr={2} fontSize={'13px'} lineHeight={'16px'}>
        <FormattedMessage
          id="home.OCUsersSection.moreOpensourceCollective"
          defaultMessage="More open source collectives"
        />
      </Span>
      <ArrowRight size="13" />
    </StyledLink>
    <StyledLink href="#" display={['none', null, 'block']} color="blue.600">
      <Span mr={2} fontSize={'13px'} lineHeight={'16px'}>
        <FormattedMessage id="home.OCUsersSection.vistCollective" defaultMessage="Visit collective" />
      </Span>
      <ArrowRight size="13" />
    </StyledLink>
  </Container>
);

User.propTypes = {
  name: PropTypes.string,
  picture: PropTypes.string,
  type: PropTypes.string,
};

const OCUsers = () => {
  return (
    <Flex my={[5, null, 1]} flexDirection="column" mx={[3, 4]} alignItems="center">
      <SectionTitle>
        <FormattedMessage id="home.OCUsersSection.title" defaultMessage="They are using Open Collective" />
      </SectionTitle>
      <Container display={['none', null, 'block']} width={[null, null, '768px', null, '991px']} mb={4}>
        <SectionSubTitle
          fontSize={'18px'}
          lineHeight={'H5'}
          lineSpacing={'-0.016em'}
          fontWeight="300"
          textAlign="center"
        >
          <FormattedMessage
            id="home.OCUsersSection.subtitle"
            defaultMessage="Our mission is to help organize the world as circles –open circles– where everyone can contribute. We are starting with financial contributions, enabling communities to raise money while staying true to who they are. Find out more!"
          />
        </SectionSubTitle>
      </Container>
      <Flex>
        <StyledCarousel options={users} display={[null, null, 'none']}>
          {user => <User {...user} />}
        </StyledCarousel>
        <Container display={['none', null, 'flex']}>
          {users.map(user => (
            <Fragment key={user.id}>
              <User {...user} />
            </Fragment>
          ))}
        </Container>
      </Flex>
      <Container display={['none', 'none', 'flex']} justifyContent="center" my={5} width={1}>
        <HomePrimaryLink href="#" width="304px" display="block">
          <Span mr={2}>
            <FormattedMessage id="home.discoverBtn" defaultMessage="Discover more collectives" />
          </Span>
          <ArrowRight size="15" />
        </HomePrimaryLink>
      </Container>
    </Flex>
  );
};

export default OCUsers;
