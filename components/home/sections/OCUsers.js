import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import StyledCarousel from '../../StyledCarousel';
import StyledLink from '../../StyledLink';
import { P } from '../../Text';
import SectionSubTitle from '../SectionSubtitle';
import SectionTitle from '../SectionTitle';

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
      'More than 2,500 open source communities use Open Collective to receive money from companies and individuals.',
  },
  'home.OCusers.meetups': {
    id: 'home.OCusers.meetups',
    defaultMessage:
      'Nearly 100 chapters of Women Who Code use Open Collective to raise money locally and allocate funding throughout their network.',
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
    learnMorePath: '/discover?show=open%20source',
    picture: '/static/images/home/oc-users-babel.png',
  },
  {
    id: 'meetups',
    name: 'Women Who Code',
    type: 'Meetups',
    description: 'We will never lock you in. Everything we do is open source.',
    collectivePath: '/wwcodeatl',
    learnMorePath: '/wwcodeinc',
    picture: '/static/images/home/oc-users-womenwhocode.png',
  },
  {
    id: 'movements',
    name: 'Extinction Rebellion Belgium',
    type: 'Movements',
    description: 'We will never lock you in. Everything we do is open source.',
    collectivePath: '/xr-belgium',
    learnMorePath: '/search?q=rebellion',
    picture: '/static/images/home/oc-users-extinctionrebllion.png',
  },
];

const User = ({ id, name, picture, type, collectivePath }) => {
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
          {type}
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
            {intl.formatMessage(messages[`home.OCusers.${id}`])}
          </P>
        </Box>
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
  learnMorePath: PropTypes.string,
};

const OCUsers = () => {
  return (
    <Flex my={4} flexDirection="column" mx={[3, 4]} alignItems="center">
      <SectionTitle
        textAlign="center"
        fontSize={[null, '32px']}
        lineHeight={[null, '40px']}
        letterSpacing={[null, '-1.2px']}
      >
        <FormattedMessage id="home.OCUsersSection.title" defaultMessage="Who is using Open Collective?" />
      </SectionTitle>
      <Container width={['286px', '548px', null, '768px', '991px']} mb={4} textAlign="center">
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
            id="home.OCUsersSection.subtitle"
            defaultMessage="Communities around the world are using Open Collective. Find out more about them!"
          />
        </SectionSubTitle>
      </Container>
      <StyledCarousel options={users} display={[null, 'none']} width={1}>
        {users.map(user => (
          <User key={user.id} {...user} />
        ))}
      </StyledCarousel>
      <Flex mt={2}>
        <Container display={['none', 'flex']}>
          {users.map(user => (
            <Fragment key={user.id}>
              <User {...user} />
            </Fragment>
          ))}
        </Container>
      </Flex>
      <Box mt={4}>
        <StyledLink buttonStyle="standard" buttonSize="medium" href="https://blog.opencollective.com/tag/case-studies/">
          <FormattedMessage id="home.discover" defaultMessage="Discover more" />
        </StyledLink>
      </Box>
    </Flex>
  );
};

export default OCUsers;
