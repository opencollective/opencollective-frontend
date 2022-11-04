import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Query } from '@apollo/client/react/components';
import { Exit } from '@styled-icons/boxicons-regular';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ChevronRight } from '@styled-icons/boxicons-regular/ChevronRight';
import { ChevronUp } from '@styled-icons/boxicons-regular/ChevronUp';
import { themeGet } from '@styled-system/theme-get';
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

const ProfileContainer = styled.div`
  width: 100%;
`;

const CustomButton = styled(StyledButton)`
  border: none;
  border-radius: 8px;
  magin: 0;
  text-align: left;
  width: 100%;
  padding-left: 20px;
`;

const HR = styled.hr`
  margin: 1px 0;
`;

const memberInvitationsCountQuery = gql`
  query MemberInvitationsCount($memberAccount: AccountReferenceInput!) {
    memberInvitations(memberAccount: $memberAccount) {
      id
    }
  }
`;

const ChevronUpDown = ({ size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
  );
};

const ViewProfileLink = styled(StyledLink)`
  &:hover {
    background-color: white;
    border-color: black;
    color: black;
  }
`;

const StyledProfileButton = styled.button`
  display: flex;
  align-items: center;

  width: 100%;

  justify-content: space-between;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 0;
  border: none;
  font-weight: 500;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  padding: 8px;
  &:hover {
    background: #e8edf4;
  }
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
const upperCaseFirstLetter = string => `${string.slice(0, 1).toUpperCase()}${string.slice(1).toLowerCase()}`;

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
      <UserMenuLinkEntry
        isMobileMenuLink={isMobileView}
        href={`/${LoggedInUser.collective.slug}/recurring-contributions`}
      >
        <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
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
      {LoggedInUser.isRoot() && (
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
    document.addEventListener('keydown', this.handleKeyPress);
    document.addEventListener('click', this.onClickOutside);
    if (!getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)) {
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClickOutside);
    document.removeEventListener('keydown', this.handleEscKey);
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
    const { LoggedInUser, setShowNewsAndUpdates, setActiveCollective, activeCollective } = this.props;
    const { showUserAccount } = this.state;

    return (
      <Container
        bg="white.full"
        border="1px solid rgba(18,19,20,0.12)"
        borderRadius="12px"
        boxShadow="0 4px 8px 0 rgba(61,82,102,0.08)"
        width="234px"
        position="absolute"
        left={'8px'}
        bottom={'75px'}
        zIndex={3000}
        data-cy="user-menu"
        css={{ overflow: 'hidden' }}
      >
        <Container p={1}>
          <ProfileMenuMemberships
            user={LoggedInUser}
            setActiveCollective={setActiveCollective}
            activeCollective={activeCollective}
          />
        </Container>

        <HR />
        <Container p={1}>
          <CustomButton onClick={this.logout}>Log out</CustomButton>
        </Container>
      </Container>
    );
  }

  renderLoggedInUser() {
    const { showProfileMenu } = this.state;
    const { LoggedInUser, activeCollective } = this.props;
    console.log({ activeCollective });
    return (
      <Box>
        <StyledProfileButton isBorderless onClick={this.toggleProfileMenu}>
          <Flex width="100%" justifyContent="" alignItems="center" data-cy="user-menu-trigger">
            <Flex width="100%" alignItems="center" overflow={'hidden'} gap={'8px'}>
              <Avatar collective={activeCollective} radius={36} mr="2px" />
              <Flex flexDirection="column" overflow="hidden" truncateOverflow>
                <P fontSize="14px" fontWeight="500" lineHeight="20px" color="black.800" truncateOverflow width="100%">
                  {activeCollective.name}
                </P>

                <Span
                  textAlign={'left'}
                  fontSize="12px"
                  fontWeight="400"
                  lineHeight="18px"
                  truncateOverflow
                  color="black.700"
                >
                  {upperCaseFirstLetter(
                    activeCollective.role === 'MEMBER' ? 'Core contributor' : activeCollective.role,
                  )}
                </Span>
              </Flex>
            </Flex>
            <Flex mx={0} flexShrink={0}>
              <ChevronUpDown size="22" />
            </Flex>
          </Flex>
        </StyledProfileButton>

        {showProfileMenu && (
          <React.Fragment>
            <HideGlobalScroll />
            {this.renderProfileMenu()}
          </React.Fragment>
        )}
      </Box>
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
      <ProfileContainer>
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

        {status === 'loggedin' && this.renderLoggedInUser()}
      </ProfileContainer>
    );
  }
}

export default withNewsAndUpdates(withUser(TopBarProfileMenu));
