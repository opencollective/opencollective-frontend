import React from 'react';
import PropTypes from 'prop-types';
import SearchIcon from './SearchIcon';
import MenuIcon from './icons/MenuIcon';
import TopBarProfileMenu from './TopBarProfileMenu';
import SearchForm from './SearchForm';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { Link } from '../server/pages';

import Hide from './Hide';
import { Box, Flex } from 'grid-styled';
import styled from 'styled-components';

import { rotateMixin } from '../constants/animations';

const Logo = styled.img.attrs({
  src: '/static/images/opencollective-icon.svg',
  alt: 'Open Collective logo',
})`
  ${({ animate }) => animate ? rotateMixin : null}
`;

const SearchFormContainer = styled(Box)`
  max-width: 30rem;
  min-width: 10rem;
`;

const NavList = styled(Flex)`
  list-style: none;
  min-width: 20rem;
  text-align: right;
`;

const NavLink = styled.a`
  color: #777777;
  font-size: 1.4rem;
`;

class TopBar extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    LoggedInUser: PropTypes.object,
    showSearch: PropTypes.bool,
  }

  static defaultProps = {
    className: '',
    showSearch: true,
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'menu.homepage': { id: 'menu.homepage', defaultMessage: `Go to Open Collective Homepage`}
    });
  }

  render() {
    const { className, LoggedInUser, intl, showSearch } = this.props;
    const shouldAnimate = className.includes && className.includes('loading');

    return (
      <Flex mx={3} my={2} alignItems="center" flexDirection="row" justifyContent="space-around">
          <Link href="/" title={intl.formatMessage(this.messages['menu.homepage'])}>
            <Flex is="a" alignItems="center">
              <Logo width="24" height="24" animate={shouldAnimate} />
              <Hide xs>
                <Box mx={2}>
                  <img height="16px" src="/static/images/logotype.svg" />
                </Box>
              </Hide>
            </Flex>
          </Link>

          {showSearch && (
            <Flex justifyContent="center" flex="1 1 auto">
              <Hide xs w={1}>
                <SearchFormContainer p={2}>
                  <SearchForm />
                </SearchFormContainer>
              </Hide>
            </Flex>
          )}

        <Flex alignItems="center" justifyContent="flex-end" flex="1 1 auto">
          
          <Hide sm md lg>
            <Box mx={3}>
              <Link href="/search">
                <Flex is="a"><SearchIcon fill="#aaaaaa" size={24} /></Flex>
              </Link>
            </Box>
          </Hide>

          <Hide sm md lg>
            <Box mx={3}>
              <Link href="#footer">
                <Flex is="a"><MenuIcon fill="#aaaaaa" size={24} /></Flex>
              </Link>
            </Box>
          </Hide>

          <Hide xs>
            <NavList is="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
              <Box is="li" px={3}><NavLink href="/discover"><FormattedMessage id="menu.discover" defaultMessage="Discover" /></NavLink></Box>
              <Box is="li" px={3}><NavLink href="/learn-more"><FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" /></NavLink></Box>
              <Box is="li" px={3}><NavLink href="https://medium.com/open-collective"><FormattedMessage id="menu.blog" defaultMessage="Blog" /></NavLink></Box>
            </NavList>
          </Hide>

          <TopBarProfileMenu LoggedInUser={LoggedInUser} />
        </Flex>
      </Flex>
    )
  }
}

export default withIntl(TopBar);
