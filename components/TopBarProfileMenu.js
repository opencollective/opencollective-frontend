import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Query } from '@apollo/client/react/components';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ChevronRight } from '@styled-icons/boxicons-regular/ChevronRight';
import { Exit } from '@styled-icons/boxicons-regular/Exit';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { getSettingsRoute } from '../lib/url-helpers';

import ChangelogTrigger from './changelog/ChangelogTrigger';
import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Hide from './Hide';
import { HideGlobalScroll } from './HideGlobalScroll';
import Link from './Link';
import ListItem from './ListItem';
import LoginBtn from './LoginBtn';
import { withNewsAndUpdates } from './NewsAndUpdatesProvider';
import ProfileMenuMemberships from './ProfileMenuMemberships';
import StyledButton from './StyledButton';
import StyledHr from './StyledHr';
import StyledLink from './StyledLink';
import { P, Span } from './Text';
import { withUser } from './UserProvider';

const memberInvitationsCountQuery = gql`
  query MemberInvitationsCount($memberAccount: AccountReferenceInput!) {
    memberInvitations(memberAccount: $memberAccount) {
      id
    }
  }
`;

const ViewProfileLink = styled(StyledLink)`
  &:hover {
    background-color: white;
    border-color: black;
    color: black;
  }
`;

const StyledProfileButton = styled(StyledButton)`
  padding: 0;
  background-color: white !important;
`;

const UserMenuLinkEntry = props => {
  const { isMobileMenuLink } = props;
  return (
    <ListItem mb="6px" py={isMobileMenuLink ? '2' : '0'}>
      <StyledLink as={Link} fontWeight="500" fontSize="14px" lineHeight="20px" color="black.800" {...props} />
      {isMobileMenuLink && <StyledHr mt={2} borderStyle="solid" borderColor="rgba(49, 50, 51, 0.1)" />}
    </ListItem>
  );
};

UserMenuLinkEntry.propTypes = {
  isMobileMenuLink: PropTypes.bool,
};

const UserAccountLinks = ({ setShowNewsAndUpdates, LoggedInUser, isMobileView, logOutHandler }) => {
  return (
    <Box>
      <UserMenuLinkEntry as={Span} isMobileMenuLink={isMobileView} onClick={() => setShowNewsAndUpdates(true)}>
        <FormattedMessage id="menu.newsAndUpdates" defaultMessage="News and Updates" />
      </UserMenuLinkEntry>
      <Query
        query={memberInvitationsCountQuery}
        variables={{ memberAccount: { slug: LoggedInUser.collective.slug } }}
        context={API_V2_CONTEXT}
      >
        {({ data, loading }) =>
          loading === false && data && data.memberInvitations && data.memberInvitations.length > 0 ? (
            <UserMenuLinkEntry isMobileMenuLink={isMobileView} href="/member-invitations">
              <FormattedMessage
                id="menu.pendingInvitations"
                defaultMessage="Pending Invitations ({numberOfInvitations})"
                values={{ numberOfInvitations: data.memberInvitations.length }}
              />
            </UserMenuLinkEntry>
          ) : null
        }
      </Query>
      <UserMenuLinkEntry isMobileMenuLink={isMobileView} href={getSettingsRoute(LoggedInUser.collective)}>
        <FormattedMessage id="Settings" defaultMessage="Settings" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry isMobileMenuLink={isMobileView} href={`/${LoggedInUser.collective.slug}/manage-contributions`}>
        <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry isMobileMenuLink={isMobileView} href={`/${LoggedInUser.collective.slug}/submitted-expenses`}>
        <FormattedMessage id="home.feature.manageExpenses" defaultMessage="Manage Expenses" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry isMobileMenuLink={isMobileView} href={`/${LoggedInUser.collective.slug}/transactions`}>
        <FormattedMessage id="menu.transactions" defaultMessage="Transactions" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry isMobileMenuLink={isMobileView} href="/applications">
        <FormattedMessage id="menu.applications" defaultMessage="Applications" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry isMobileMenuLink={isMobileView} as="a" href="/help">
        <FormattedMessage id="menu.help" defaultMessage="Help" />
      </UserMenuLinkEntry>
      {LoggedInUser.isRoot && (
        <UserMenuLinkEntry isMobileMenuLink={isMobileView} href="/opencollective/root-actions">
          {/** Not i18n on purpose, this is for platform admins only */}
          Root Actions
        </UserMenuLinkEntry>
      )}
      {isMobileView ? (
        <UserMenuLinkEntry profileMenuLink as="a" data-cy="logout" onClick={logOutHandler}>
          <Flex alignItems="center">
            <P color="#7A0F2B" fontWeight="500" pr={2} whiteSpace="nowrap">
              <FormattedMessage id="menu.logout" defaultMessage="Log out" />
            </P>
            <Exit size={13} color="#7A0F2B" />
          </Flex>
        </UserMenuLinkEntry>
      ) : (
        <UserMenuLinkEntry as="a" data-cy="logout" onClick={logOutHandler}>
          <FormattedMessage id="menu.logout" defaultMessage="Log out" /> →
        </UserMenuLinkEntry>
      )}
    </Box>
  );
};

UserAccountLinks.propTypes = {
  LoggedInUser: PropTypes.object,
  setShowNewsAndUpdates: PropTypes.func,
  logOutHandler: PropTypes.func,
  profileMenuLink: PropTypes.bool,
  isMobileView: PropTypes.bool,
};

class TopBarProfileMenu extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    logout: PropTypes.func,
    loadingLoggedInUser: PropTypes.bool,
    setShowNewsAndUpdates: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = { showProfileMenu: false, loading: true, showUserAccount: false };
  }

  componentDidMount() {
    const main = document.querySelector('main');
    main.addEventListener('keydown', this.handleKeyPress);
    main.addEventListener('click', this.onClickOutside);
    if (!getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)) {
      this.setState({ loading: false });
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.LoggedInUser && this.props.LoggedInUser) {
      this.setState({ status: 'loggedin' });
    }
  }

  componentWillUnmount() {
    const main = document.querySelector('main');
    main.removeEventListener('click', this.onClickOutside);
    main.removeEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress = event => {
    const { key, keyCode } = event;
    if (key === 'Escape' || key === 'Esc' || keyCode === 27) {
      this.setState({
        showProfileMenu: false,
        showUserAccount: false,
      });
    }
  };

  logout = () => {
    this.setState({ showProfileMenu: false, showUserAccount: false, status: 'loggingout' });
    this.props.logout();
    this.setState({ status: 'loggedout' });
  };

  onClickOutside = () => {
    this.setState({ showProfileMenu: false, showUserAccount: false });
  };

  toggleProfileMenu = e => {
    this.setState(state => ({ showProfileMenu: !state.showProfileMenu, showUserAccount: false }));
    // don't propagate to onClickOutside
    e.nativeEvent.stopImmediatePropagation();
  };

  toggleAccountInfo = e => {
    this.setState(state => ({ showUserAccount: !state.showUserAccount }));
    e.stopPropagation();
  };

  renderProfileMenu() {
    const { LoggedInUser, setShowNewsAndUpdates } = this.props;
    const { showUserAccount } = this.state;

    return (
      <Container
        bg="white.full"
        border={['none', '1px solid rgba(18,19,20,0.12)']}
        borderRadius={[0, 12]}
        boxShadow="0 4px 8px 0 rgba(61,82,102,0.08)"
        minWidth="170px"
        maxWidth="560px"
        width="100%"
        position="absolute"
        right={[0, 16]}
        top={[69, 75]}
        zIndex={3000}
        data-cy="user-menu"
        css={{ overflow: 'hidden' }}
      >
        <Flex flexDirection={['column', 'row']} maxHeight={['calc(100vh - 68px)', '100%']}>
          {showUserAccount && (
            <Hide lg md sm>
              <Box px={3} mx={2} mb={0} mt={3} onClick={this.toggleAccountInfo}>
                <Flex alignItems="center">
                  <P
                    color="black.700"
                    fontSize="12px"
                    fontWeight="500"
                    letterSpacing="0.06em"
                    pr={2}
                    textTransform="uppercase"
                    whiteSpace="nowrap"
                    onClick={this.toggleAccountInfo}
                  >
                    ← <FormattedMessage id="Back" defaultMessage="Back" />
                  </P>
                </Flex>
                <Flex py={3} mt={1} alignItems="center" justifyContent="space-between">
                  <Flex>
                    <Avatar collective={LoggedInUser.collective} radius={40} mr={2} />
                    <Box>
                      <P color="black.800" fontWeight="500" fontSize="14px" lineHeight="20px">
                        {LoggedInUser.collective.name}
                      </P>
                      <P mt="2px" wordBreak="break-all" color="black.700" fontSize="13px">
                        {LoggedInUser.email}
                      </P>
                    </Box>
                  </Flex>
                </Flex>
              </Box>
            </Hide>
          )}

          {!showUserAccount ? (
            <React.Fragment>
              <Box order={[2, 1]} flex="10 1 50%" width={[1, 1, 1 / 2]} p={3} display={['none', 'flex']} bg="#F7F8FA">
                <Hide xs>
                  <Link href={`/${LoggedInUser.collective.slug}`}>
                    <Avatar collective={LoggedInUser.collective} radius={56} mr={2} />
                    <P mt={2} color="black.800" fontWeight="500" fontSize="14px" lineHeight="20px">
                      {LoggedInUser.collective.name}
                    </P>
                  </Link>
                  <P mt="2px" wordBreak="break-all" color="black.700" fontSize="13px">
                    {LoggedInUser.email}
                  </P>
                  <P mb={4} mt={3} color="black.800">
                    <ViewProfileLink
                      as={Link}
                      buttonSize="tiny"
                      buttonStyle="standard"
                      href={`/${LoggedInUser.collective.slug}`}
                    >
                      <Span css={{ verticalAlign: 'middle' }}>
                        <FormattedMessage defaultMessage="View Profile" />
                      </Span>
                    </ViewProfileLink>
                  </P>
                  <P color="black.900" fontSize="12px" fontWeight="700" letterSpacing="1px" textTransform="uppercase">
                    <FormattedMessage id="menu.myAccount" defaultMessage="My account" />
                  </P>
                  <Box as="ul" p={0} my={2}>
                    <UserAccountLinks
                      isMobileView={false}
                      LoggedInUser={LoggedInUser}
                      setShowNewsAndUpdates={setShowNewsAndUpdates}
                      logOutHandler={this.logout}
                    />
                  </Box>
                </Hide>
              </Box>
              <Box
                order={[1, 2]}
                flex="1 1 50%"
                minWidth="296px"
                width={[1, 1, 1 / 2]}
                p={[1, 3]}
                maxHeight={['100%', '450px']}
                overflowY={['hidden', 'auto']}
              >
                <Hide lg md sm>
                  <Box height="90vh" p={3} overflowY="auto">
                    <Flex alignItems="center">
                      {showUserAccount ? (
                        <P
                          color="black.700"
                          fontSize="12px"
                          fontWeight="500"
                          letterSpacing="0.06em"
                          pr={2}
                          textTransform="uppercase"
                          whiteSpace="nowrap"
                          onClick={this.toggleAccountInfo}
                        >
                          ← <FormattedMessage id="Back" defaultMessage="Back" />
                        </P>
                      ) : (
                        <React.Fragment>
                          <P
                            color="black.700"
                            fontSize="12px"
                            fontWeight="500"
                            letterSpacing="0.06em"
                            pr={2}
                            textTransform="uppercase"
                            whiteSpace="nowrap"
                          >
                            <FormattedMessage id="menu.myAccount" defaultMessage="My account" />
                          </P>
                          <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
                        </React.Fragment>
                      )}
                    </Flex>
                    <Flex
                      py={3}
                      pb={2}
                      my={3}
                      alignItems="center"
                      justifyContent="space-between"
                      onClick={this.toggleAccountInfo}
                      style={{ cursor: 'pointer' }}
                    >
                      <Flex position="relative">
                        <Avatar collective={LoggedInUser.collective} radius={40} mr={2} />
                        <Box>
                          <P color="black.800" fontWeight="500" fontSize="14px" lineHeight="20px">
                            {LoggedInUser.collective.name}
                          </P>
                          <P mt="2px" wordBreak="break-all" color="black.700" fontSize="13px">
                            {LoggedInUser.email}
                          </P>
                        </Box>
                      </Flex>
                      {!showUserAccount ? <ChevronRight size={20} color="#76777A" /> : ''}
                    </Flex>
                    <ProfileMenuMemberships user={LoggedInUser} />
                  </Box>
                </Hide>
                <Hide xs>
                  <ProfileMenuMemberships user={LoggedInUser} />
                </Hide>
              </Box>
            </React.Fragment>
          ) : (
            <Hide sm md lg>
              <Box height="100vh" mt={0} mx={3} as="ul" px={2}>
                <UserAccountLinks
                  isMobileView
                  LoggedInUser={LoggedInUser}
                  setShowNewsAndUpdates={setShowNewsAndUpdates}
                  logOutHandler={this.logout}
                />
              </Box>
            </Hide>
          )}
        </Flex>
      </Container>
    );
  }

  renderLoggedInUser() {
    const { showProfileMenu } = this.state;
    const { LoggedInUser } = this.props;

    return (
      <React.Fragment>
        <StyledProfileButton isBorderless onClick={this.toggleProfileMenu}>
          <Flex alignItems="center" data-cy="user-menu-trigger">
            <Avatar collective={get(LoggedInUser, 'collective')} radius="40px" mr={2} />
            <Hide xs>
              <ChevronDown color="#4E5052" size="1.5em" cursor="pointer" />
            </Hide>
          </Flex>
        </StyledProfileButton>
        <Hide sm md lg>
          <Container position="absolute" mx={27} my={-47}>
            <ChangelogTrigger height="24px" width="24px" backgroundSize="9.49px 13.5px" />
          </Container>
        </Hide>
        {showProfileMenu && (
          <React.Fragment>
            <HideGlobalScroll />
            {this.renderProfileMenu()}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }

  render() {
    const { loading } = this.state;
    const { LoggedInUser, loadingLoggedInUser } = this.props;

    let status;
    if (this.state.status) {
      status = this.state.status;
    } else if ((loading || loadingLoggedInUser) && typeof LoggedInUser === 'undefined') {
      status = 'loading';
    } else if (!LoggedInUser) {
      status = 'loggedout';
    } else {
      status = 'loggedin';
    }

    return (
      <div className="LoginTopBarProfileButton">
        {status === 'loading' && (
          <P color="#D5DAE0" fontSize="1.4rem" px={3} py={2} display="inline-block">
            <FormattedMessage id="loading" defaultMessage="loading" />
            &hellip;
          </P>
        )}

        {status === 'loggingout' && (
          <P color="#D5DAE0" fontSize="1.4rem" px={3} py={2} display="inline-block">
            <FormattedMessage id="loggingout" defaultMessage="logging out" />
            &hellip;
          </P>
        )}

        {status === 'loggedout' && <LoginBtn />}

        {status === 'loggedin' && this.renderLoggedInUser()}
      </div>
    );
  }
}

export default withNewsAndUpdates(withUser(TopBarProfileMenu));
