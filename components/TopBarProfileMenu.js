import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Query } from '@apollo/client/react/components';
import { Plus } from '@styled-icons/boxicons-regular';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { Settings } from '@styled-icons/feather/Settings';
import { get, uniqBy } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled, { createGlobalStyle } from 'styled-components';

import { isPastEvent } from '../lib/events';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { capitalize } from '../lib/utils';

import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Hide from './Hide';
import Link from './Link';
import ListItem from './ListItem';
import LoginBtn from './LoginBtn';
import StyledHr from './StyledHr';
import StyledLink from './StyledLink';
import StyledRoundButton from './StyledRoundButton';
import { P, Span } from './Text';
import { withUser } from './UserProvider';

const memberInvitationsCountQuery = gql`
  query MemberInvitationsCount($memberCollectiveId: Int!) {
    memberInvitations(MemberCollectiveId: $memberCollectiveId) {
      id
    }
  }
`;

const CollectiveListItem = styled(ListItem)`
  @media (hover: hover) {
    :hover svg {
      opacity: 1;
    }
  }
  @media (hover: none) {
    svg {
      opacity: 1;
    }
  }
`;

const HideGlobalScroll = createGlobalStyle`
  @media(max-width: 40em) {
    body {
      overflow: hidden;
    }
  }
`;

class TopBarProfileMenu extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object.isRequired,
    logout: PropTypes.func,
    loadingLoggedInUser: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = { showProfileMenu: false, loading: true };
    this.messages = defineMessages({
      'menu.transactions': {
        id: 'menu.transactions',
        defaultMessage: 'transactions',
      },
      'menu.applications': {
        id: 'menu.applications',
        defaultMessage: 'applications',
      },
      settings: {
        id: 'Settings',
        defaultMessage: 'Settings',
      },
    });
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
      });
    }
  };

  logout = () => {
    this.setState({ showProfileMenu: false, status: 'loggingout' });
    this.props.logout();
    this.setState({ status: 'loggedout' });
  };

  onClickOutside = () => {
    this.setState({ showProfileMenu: false });
  };

  toggleProfileMenu = e => {
    this.setState(state => ({ showProfileMenu: !state.showProfileMenu }));
    // don't propagate to onClickOutside
    e.nativeEvent.stopImmediatePropagation();
  };

  renderMembershipLine = membership => {
    const { intl, LoggedInUser } = this.props;
    const isAdmin = LoggedInUser && LoggedInUser.canEditCollective(membership.collective);

    return (
      <CollectiveListItem
        key={`LoggedInMenu-Collective-${get(membership, 'collective.slug')}`}
        py={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Link href={`/${get(membership, 'collective.slug')}`}>
          <StyledLink
            as={Span}
            color="black.700"
            fontSize="1.2rem"
            fontFamily="montserratlight, arial"
            fontWeight="400"
            truncateOverflow
            maxWidth="90%"
          >
            <Flex alignItems="center">
              <Avatar collective={get(membership, 'collective')} radius="2.8rem" mr={2} />
              <P fontSize="12px" truncateOverflow>
                {get(membership, 'collective.name')}
              </P>
            </Flex>
          </StyledLink>
        </Link>
        {isAdmin && (
          <Link href={`/${membership.collective.slug}/edit`}>
            <StyledLink as={Span} color="black.500" title={intl.formatMessage(this.messages.settings)}>
              <Settings opacity="0" size="1.2em" />
            </StyledLink>
          </Link>
        )}
      </CollectiveListItem>
    );
  };

  renderProfileMenu() {
    const { LoggedInUser, intl } = this.props;

    const memberships = uniqBy(
      LoggedInUser.memberOf.filter(m => m.role !== 'BACKER'),
      m => m.collective.id,
    );

    const incognitoProfileMembership = memberships.find(m => m.collective.isIncognito);

    const collectives = memberships
      .filter(m => m.collective.type === 'COLLECTIVE')
      .sort((a, b) => {
        return a.collective.slug.localeCompare(b.collective.slug);
      });

    const orgs = memberships
      .filter(m => m.collective.type === 'ORGANIZATION')
      .sort((a, b) => {
        return a.collective.slug.localeCompare(b.collective.slug);
      });

    const events = memberships
      .filter(m => m.collective.type === 'EVENT' && !isPastEvent(m.collective))
      .sort((a, b) => {
        return a.collective.slug.localeCompare(b.collective.slug);
      });

    const funds = memberships
      .filter(m => m.collective.type === 'FUND')
      .sort((a, b) => {
        return a.collective.slug.localeCompare(b.collective.slug);
      });

    return (
      <Container
        bg="white.full"
        border={['none', '1px solid rgba(18,19,20,0.12)']}
        borderRadius={[0, 12]}
        boxShadow="0 4px 8px 0 rgba(61,82,102,0.08)"
        minWidth="170px"
        maxWidth="500px"
        width="100%"
        position="absolute"
        right={[0, 16]}
        top={[69, 75]}
        zIndex={3000}
        data-cy="user-menu"
        css={{ overflow: 'hidden' }}
      >
        <Flex flexDirection={['column', 'row']} maxHeight={['calc(100vh - 68px)', '100%']}>
          <Box order={[2, 1]} flex="10 1 50%" width={[1, 1, 1 / 2]} p={3} bg="#F7F8FA">
            <Hide xs>
              <Avatar collective={LoggedInUser.collective} radius={56} mr={2} />
              <P mt={2} color="#313233" fontWeight="500">
                {LoggedInUser.collective.name}
              </P>
              <P mt={2} mb={5} wordBreak="break-all" color="#9D9FA3">
                {LoggedInUser.email}
              </P>
            </Hide>
            <P color="#B4BBBF" fontSize="1rem" fontWeight="400" letterSpacing="1px" textTransform="uppercase">
              <FormattedMessage id="menu.myAccount" defaultMessage="My account" />
            </P>
            <Box as="ul" p={0} my={2}>
              <ListItem py={1}>
                <Link href={`/${LoggedInUser.username}`}>
                  <StyledLink as={Span} color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                    <FormattedMessage id="menu.profile" defaultMessage="Profile" />
                  </StyledLink>
                </Link>
              </ListItem>
              <Query
                query={memberInvitationsCountQuery}
                variables={{ memberCollectiveId: LoggedInUser.CollectiveId }}
                fetchPolicy="network-only"
              >
                {({ data, loading }) =>
                  loading === false && data && data.memberInvitations && data.memberInvitations.length > 0 ? (
                    <ListItem py={1}>
                      <Link href="/member-invitations">
                        <StyledLink as={Span} color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                          <FormattedMessage
                            id="menu.pendingInvitations"
                            defaultMessage="Pending Invitations ({numberOfInvitations})"
                            values={{ numberOfInvitations: data.memberInvitations.length }}
                          />
                        </StyledLink>
                      </Link>
                    </ListItem>
                  ) : null
                }
              </Query>
              <ListItem py={1}>
                <Link href={`/${LoggedInUser.collective.slug}/edit`}>
                  <StyledLink as={Span} color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                    <FormattedMessage id="Settings" defaultMessage="Settings" />
                  </StyledLink>
                </Link>
              </ListItem>
              {incognitoProfileMembership && (
                <ListItem py={1}>
                  <Link href={`/${incognitoProfileMembership.collective.slug}/recurring-contributions`}>
                    <StyledLink as={Span} color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                      <FormattedMessage
                        id="menu.incognitoProfileSubscriptions"
                        defaultMessage="Manage incognito Contributions"
                      />
                    </StyledLink>
                  </Link>
                </ListItem>
              )}
              <ListItem py={1}>
                <Link href={`/${LoggedInUser.username}/recurring-contributions`}>
                  <StyledLink as={Span} color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                    <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
                  </StyledLink>
                </Link>
              </ListItem>
              <ListItem py={1}>
                <Link href={`/${LoggedInUser.username}/transactions`}>
                  <StyledLink as={Span} color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                    {capitalize(intl.formatMessage(this.messages['menu.transactions']))}
                  </StyledLink>
                </Link>
              </ListItem>
              <ListItem py={1}>
                <Link href="/applications">
                  <StyledLink as={Span} color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                    {capitalize(intl.formatMessage(this.messages['menu.applications']))}
                  </StyledLink>
                </Link>
              </ListItem>
              <ListItem py={1}>
                <StyledLink
                  color="#494D52"
                  fontSize="1.2rem"
                  fontFamily="montserratlight, arial"
                  href="https://docs.opencollective.com"
                >
                  <FormattedMessage id="menu.help" defaultMessage="Help" />
                </StyledLink>
              </ListItem>
              <ListItem py={1}>
                <StyledLink
                  data-cy="logout"
                  color="#494D52"
                  fontSize="1.2rem"
                  fontFamily="montserratlight, arial"
                  onClick={this.logout}
                >
                  <FormattedMessage id="menu.logout" defaultMessage="Log out" />
                </StyledLink>
              </ListItem>
            </Box>
          </Box>
          <Box order={[1, 2]} flex="1 1 50%" width={[1, 1, 1 / 2]} p={3} maxHeight="450px" overflowY="auto">
            <Flex alignItems="center">
              <P
                color="#4E5052"
                fontFamily="montserratlight, arial"
                fontSize="1rem"
                fontWeight="600"
                letterSpacing="1px"
                pr={2}
                textTransform="uppercase"
                whiteSpace="nowrap"
              >
                <FormattedMessage id="collective" defaultMessage="My Collectives" />
              </P>
              <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
              <Link href="/create">
                <StyledRoundButton ml={2} size={24} color="#C4C7CC">
                  <Plus size={12} color="#76777A" />
                </StyledRoundButton>
              </Link>
            </Flex>
            <Box as="ul" p={0} my={2}>
              {collectives.map(this.renderMembershipLine)}
            </Box>
            {collectives.length === 0 && (
              <Box my={2}>
                <P color="#9399A3" fontSize="1rem" letterSpacing="0.5px">
                  <em>
                    <FormattedMessage id="menu.collective.none" defaultMessage="No Collectives yet" />
                  </em>
                </P>
              </Box>
            )}
            {events.length > 0 && (
              <div>
                <Flex alignItems="center" mt={3}>
                  <P
                    color="#4E5052"
                    fontFamily="montserratlight, arial"
                    fontSize="1rem"
                    fontWeight="600"
                    letterSpacing="1px"
                    pr={2}
                    textTransform="uppercase"
                    whiteSpace="nowrap"
                  >
                    <FormattedMessage id="events" defaultMessage="My Events" />
                  </P>
                  <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
                </Flex>
                <Box as="ul" p={0} my={2}>
                  {events.map(this.renderMembershipLine)}
                </Box>
              </div>
            )}
            {funds.length > 0 && (
              <Fragment>
                <Flex alignItems="center" mt={3}>
                  <P
                    color="#4E5052"
                    fontFamily="montserratlight, arial"
                    fontSize="1rem"
                    fontWeight="600"
                    letterSpacing="1px"
                    pr={2}
                    textTransform="uppercase"
                    whiteSpace="nowrap"
                  >
                    <FormattedMessage id="funds" defaultMessage="My Funds" />
                  </P>
                  <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
                  <StyledRoundButton ml={2} size={24} color="#C4C7CC">
                    <Link href="/fund/create">
                      <Plus size={12} color="#76777A" />
                    </Link>
                  </StyledRoundButton>
                </Flex>
                <Box as="ul" p={0} my={2}>
                  {funds.map(this.renderMembershipLine)}
                </Box>
              </Fragment>
            )}
            <Flex alignItems="center" mt={3}>
              <P
                color="#4E5052"
                fontFamily="montserratlight, arial"
                fontSize="1rem"
                fontWeight="600"
                letterSpacing="1px"
                pr={2}
                textTransform="uppercase"
                whiteSpace="nowrap"
              >
                <FormattedMessage id="organization" defaultMessage="My Organizations" />
              </P>
              <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
              <Link href="/organizations/new">
                <StyledRoundButton ml={2} size={24} color="#C4C7CC">
                  <Plus size={12} color="#76777A" />
                </StyledRoundButton>
              </Link>
            </Flex>
            <Box as="ul" p={0} my={2}>
              {orgs.map(this.renderMembershipLine)}
            </Box>
            {orgs.length === 0 && (
              <Box my={2}>
                <P color="#9399A3" fontSize="1rem" letterSpacing="0.5px">
                  <em>
                    <FormattedMessage id="menu.organizations.none" defaultMessage="No Organizations yet" />
                  </em>
                </P>
              </Box>
            )}
          </Box>
        </Flex>
      </Container>
    );
  }

  renderLoggedInUser() {
    const { showProfileMenu } = this.state;
    const { LoggedInUser } = this.props;

    return (
      <Flex alignItems="center" onClick={this.toggleProfileMenu} data-cy="user-menu-trigger">
        <Hide xs sm>
          <P
            color="#4E5052"
            display="inline-block"
            fontSize="13px"
            fontWeight="500"
            letterSpacing="1px"
            mx={2}
            cursor="pointer"
            data-cy="topbar-login-username"
          >
            {LoggedInUser.collective.name || LoggedInUser.username}
          </P>
        </Hide>
        <Avatar collective={get(LoggedInUser, 'collective')} radius="3rem" mr={2} />
        <Hide xs>
          <ChevronDown color="#4E5052" size="1.5em" cursor="pointer" />
        </Hide>
        {showProfileMenu && (
          <React.Fragment>
            <HideGlobalScroll />
            {this.renderProfileMenu()}
          </React.Fragment>
        )}
      </Flex>
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

export default injectIntl(withUser(TopBarProfileMenu));
