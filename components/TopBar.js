import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { Bars as MenuIcon } from '@styled-icons/fa-solid/Bars';
import { Times } from '@styled-icons/fa-solid/Times';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { rotateMixin } from '../lib/constants/animations';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import theme from '../lib/theme';
import { compose } from '../lib/utils';

import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Hide from './Hide';
import Image from './Image';
import Link from './Link';
import { withNewsAndUpdates } from './NewsAndUpdatesProvider';
import SearchForm from './SearchForm';
import SearchIcon from './SearchIcon';
import { Dropdown, DropdownArrow, DropdownContent } from './StyledDropdown';
import StyledLink from './StyledLink';
import { P } from './Text';
import TopBarMobileMenu from './TopBarMobileMenu';
import TopBarProfileMenu from './TopBarProfileMenu';
import { withUser } from './UserProvider';

const Logo = styled.img.attrs({
  src: '/static/images/opencollective-icon.svg',
  alt: 'Open Collective logo',
})`
  ${({ animate }) => (animate ? rotateMixin : null)};
`;

const SearchFormContainer = styled(Box)`
  max-width: 30rem;
  min-width: 10rem;
`;

const NavList = styled(Flex)`
  list-style: none;
  min-width: 20rem;
  text-align: right;
  align-items: center;
`;

const NavLinkContainer = styled(Box)`
  text-align: center;
`;
NavLinkContainer.defaultProps = {
  as: 'li',
  px: [1, 2, 3],
};

const NavLink = styled(StyledLink)`
  color: #313233;
  font-weight: 500;
  font-size: 1.4rem;
`;

const ChangeLogNotificationDropdownArrow = styled(DropdownArrow)`
  display: block;
  right: 18px;
  margin-top: 3px;
  &::before {
    border-color: transparent transparent #ffffc2 transparent;
  }
`;

const ChangeLogNotificationDropdownContent = styled(DropdownContent)`
  display: block;
  right: 13px;
  margin-top: 10px;
  background: #ffffc2;
`;

const CloseIcon = styled(Times)`
  font-size: 12px;
  width: 15px;
  height: 15px;
  color: #76777a;
  cursor: pointer;
`;

class TopBar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    LoggedInUser: PropTypes.object,
    setShowNewsAndUpdates: PropTypes.func,
    loadingLoggedInUser: PropTypes.bool,
    showSearch: PropTypes.bool,
    menuItems: PropTypes.object,
    data: PropTypes.shape({
      latestChangelogPublishDate: PropTypes.string,
      loading: PropTypes.bool,
    }),
    setChangelogViewDate: PropTypes.func,
    viewedNewsAndUpdates: PropTypes.bool,
    setViewedNewsAndUpdates: PropTypes.func,
    refetchLoggedInUser: PropTypes.func.isRequired,
  };

  static defaultProps = {
    className: '',
    showSearch: true,
    menuItems: {
      discover: true,
      docs: true,
      howItWorks: false,
      pricing: false,
    },
  };

  constructor(props) {
    super(props);
    this.state = { showMobileMenu: false, showChangelogDropdown: true };
    this.ref = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('click', this.onClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClickOutside);
  }

  onClickOutside = e => {
    this.setState({ showChangelogDropdown: false });
    const ref = this.ref.current;
    if (this.state.showMobileMenu && ref && !ref.contains(e.target)) {
      this.setState({ showMobileMenu: false });
    }
  };

  toggleMobileMenu = () => {
    this.setState(state => ({ showMobileMenu: !state.showMobileMenu }));
  };

  hasSeenNewChangelogUpdates = (user, latestChangelogDate) => {
    if (!user) {
      return true;
    } else if (!user.changelogViewDate && latestChangelogDate) {
      return false;
    } else {
      return new Date(latestChangelogDate) < new Date(user.changelogViewDate);
    }
  };

  handleShowNewUpdates = async () => {
    this.props.setShowNewsAndUpdates(true);
    await this.props.setChangelogViewDate({ variables: { changelogViewDate: new Date() } });
    this.props.refetchLoggedInUser();
  };

  render() {
    const { showSearch, menuItems, LoggedInUser, data } = this.props;
    const hasSeenNewUpdates = this.hasSeenNewChangelogUpdates(LoggedInUser, data?.latestChangelogPublishDate);
    const defaultMenu = { discover: true, docs: true, howItWorks: false, pricing: false };
    const merged = { ...defaultMenu, ...menuItems };
    return (
      <Flex
        px={3}
        py={showSearch ? 2 : 3}
        alignItems="center"
        flexDirection="row"
        justifyContent="space-around"
        css={{ height: theme.sizes.navbarHeight, background: 'white' }}
        ref={this.ref}
      >
        <Link href="/">
          <Flex alignItems="center">
            <Logo width="36" height="36" />
            <Hide xs>
              <Box mx={2}>
                <Image height={21} width={141} src="/static/images/logotype.svg" alt="Open collective" />
              </Box>
            </Hide>
          </Flex>
        </Link>

        {showSearch && (
          <Flex justifyContent="flex-end" flex="1 1 auto">
            <Hide xs sm md>
              <SearchFormContainer p={2}>
                <SearchForm borderRadius="6px" fontSize="14px" py="1px" />
              </SearchFormContainer>
            </Hide>
          </Flex>
        )}

        <Flex alignItems="center" justifyContent={['flex-end', 'flex-start']} flex="1 1 auto">
          <Hide lg>
            <Box mx={3}>
              <Link href="/search">
                <Flex>
                  <SearchIcon fill="#aaaaaa" size={24} />
                </Flex>
              </Link>
            </Box>
          </Hide>

          <Hide xs>
            <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
              {merged.discover && (
                <NavLinkContainer>
                  <Link href="/discover">
                    <NavLink as={Container}>
                      <FormattedMessage id="menu.discover" defaultMessage="Discover" />
                    </NavLink>
                  </Link>
                </NavLinkContainer>
              )}
              {merged.howItWorks && (
                <NavLinkContainer>
                  <Link href="/how-it-works">
                    <NavLink as={Container}>
                      <FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" />
                    </NavLink>
                  </Link>
                </NavLinkContainer>
              )}
              {merged.pricing && (
                <NavLinkContainer>
                  <Link href="/pricing">
                    <NavLink as={Container}>
                      <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />
                    </NavLink>
                  </Link>
                </NavLinkContainer>
              )}
              {merged.docs && (
                <NavLinkContainer>
                  <NavLink href="https://docs.opencollective.com">
                    <FormattedMessage id="menu.docs" defaultMessage="Docs & Help" />
                  </NavLink>
                </NavLinkContainer>
              )}
            </NavList>
          </Hide>
        </Flex>
        <Container onClick={() => this.setState({ showChangelogDropdown: false })}>
          <TopBarProfileMenu />
        </Container>
        <Hide sm md lg>
          <TopBarMobileMenu
            showMobileMenu={this.state.showMobileMenu}
            menuItems={merged}
            closeMenu={this.toggleMobileMenu}
          />
          <Box mx={3} onClick={this.toggleMobileMenu}>
            <Flex as="a">
              <MenuIcon color="#aaaaaa" size={24} />
            </Flex>
          </Box>
        </Hide>
        {!data.loading && LoggedInUser && (
          <Flex>
            {hasSeenNewUpdates && (
              <Avatar
                onClick={this.handleShowNewUpdates}
                src="/static/images/flame-default.svg"
                radius="30px"
                backgroundSize={10}
                ml={2}
              />
            )}
            {!hasSeenNewUpdates && (
              <Dropdown>
                <React.Fragment>
                  <Avatar
                    onClick={this.handleShowNewUpdates}
                    src="/static/images/flame-red.svg"
                    radius="30px"
                    backgroundSize={10}
                    backgroundColor="yellow.100"
                    ml={2}
                  />
                  {this.state.showChangelogDropdown && (
                    <Container>
                      <ChangeLogNotificationDropdownArrow />
                      <ChangeLogNotificationDropdownContent>
                        <Box as="ul" p={20} m={0} minWidth={184}>
                          <Flex>
                            <P fontSize="14px" fontWeight="700" color="black.800" mb={3}>
                              <FormattedMessage
                                id="TopBar.ChangelogNotification.firstLine"
                                defaultMessage="We have new stuff you should check out!"
                              />
                            </P>
                            <CloseIcon onClick={() => this.setState({ showChangelogDropdown: false })} />
                          </Flex>
                          <P fontSize="14px" color="black.800">
                            <FormattedMessage
                              id="TopBar.ChangelogNotification.secondLine"
                              defaultMessage="Click on the {image} to take a look"
                              values={{
                                image: (
                                  <Image
                                    src="/static/images/flame-red.svg"
                                    width={10.55}
                                    height={15}
                                    alt="Flame Image"
                                  />
                                ),
                              }}
                            />
                          </P>
                        </Box>
                      </ChangeLogNotificationDropdownContent>
                    </Container>
                  )}
                </React.Fragment>
              </Dropdown>
            )}
          </Flex>
        )}
      </Flex>
    );
  }
}

const latestChangelogPublishDateQuery = gqlV2/* GraphQL */ `
  query LatestChangeLogPublishDate {
    latestChangelogPublishDate
  }
`;

const setChangelogViewDateMutation = gqlV2/* GraphQL */ `
  mutation SetChangelogViewDateMutation($changelogViewDate: DateTime!) {
    setChangelogViewDate(changelogViewDate: $changelogViewDate) {
      id
    }
  }
`;

const latestChangelogPublish = graphql(latestChangelogPublishDateQuery, {
  options: {
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  },
});

const setChangelogViewDate = graphql(setChangelogViewDateMutation, {
  name: 'setChangelogViewDate',
  options: {
    context: API_V2_CONTEXT,
  },
});

const addGraphql = compose(latestChangelogPublish, setChangelogViewDate);

export default withNewsAndUpdates(withUser(addGraphql(TopBar)));
