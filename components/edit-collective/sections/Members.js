import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { Edit } from '@styled-icons/material/Edit';
import { compose, get, omit } from 'lodash';
import memoizeOne from 'memoize-one';
import { defineMessages, FormattedDate, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { FEATURES, isFeatureEnabled } from '../../../lib/allowed-features';
import roles from '../../../lib/constants/roles';
import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import formatMemberRole from '../../../lib/i18n/member-role';
import { getCollectivePageRoute } from '../../../lib/url-helpers';

import Avatar from '../../Avatar';
import Container from '../../Container';
import { Box, Flex, Grid } from '../../Grid';
import Hide from '../../Hide';
import HorizontalScroller from '../../HorizontalScroller';
import { getI18nLink } from '../../I18nFormatters';
import Link from '../../Link';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledRoundButton from '../../StyledRoundButton';
import StyledTag from '../../StyledTag';
import StyledTooltip from '../../StyledTooltip';
import { P } from '../../Text';
import { withUser } from '../../UserProvider';
import SettingsSubtitle from '../SettingsSubtitle';

import EditMemberModal from './EditMemberModal';
import InviteMemberModal from './InviteMemberModal';

const MemberContainer = styled(Container)`
  position: relative;
  display: block;
  height: 100%;
  min-height: 232px;
  min-width: 164px;
  background: white;
  width: 170px;
  border-radius: 8px;
  border: 1px solid #c0c5cc;
`;

const AllCardsContainerMobile = styled.div`
  display: flex;
  padding: 16px;
  margin: 10px;
`;

const TagContainer = styled(Box)`
  position: absolute;
  bottom: 10%;
`;

const InviteNewCard = styled(MemberContainer)`
  border: 1px dashed #c0c5cc;
  cursor: pointer;
`;

/** A container to center the logo above a horizontal bar */
const MemberLogoContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  border-top: 1px solid #e6e8eb;
`;

const EMPTY_MEMBERS = [{}];

class Members extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    refetchLoggedInUser: PropTypes.func.isRequired,
    inviteMember: PropTypes.func.isRequired,
    /** @ignore from injectIntl */
    intl: PropTypes.object.isRequired,
    /** @ignore from Apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      refetch: PropTypes.func.isRequired,
      account: PropTypes.object,
    }),
  };

  constructor(props) {
    super(props);

    this.state = {
      currentMember: null,
      members: this.getMembersFromProps(props),
      showInviteModal: false,
      showEditModal: false,
    };

    this.messages = defineMessages({
      memberPendingDetails: {
        id: 'members.pending.details',
        defaultMessage: 'This person has not accepted their invitation yet',
      },
    });
  }

  componentDidUpdate(oldProps) {
    const invitations = get(this.props.data, 'memberInvitations', null);
    const oldInvitations = get(oldProps.data, 'memberInvitations', null);
    const members = get(this.props.data, 'account.members.nodes', null);
    const oldMembers = get(oldProps.data, 'account.members.nodes', null);

    if (invitations !== oldInvitations || members !== oldMembers) {
      this.setState({ members: this.getMembersFromProps(this.props) });
    }
  }

  getMembersFromProps(props) {
    const pendingInvitations = get(props.data, 'memberInvitations', EMPTY_MEMBERS);
    const pendingInvitationsMembersData = pendingInvitations.map(i => omit(i, ['id']));
    const members = get(props.data, 'account.members.nodes', EMPTY_MEMBERS);
    const all = [...members, ...pendingInvitationsMembersData];
    return all.length === 0 ? EMPTY_MEMBERS : all;
  }

  handleShowModalChange(modal, value, memberIdx, currentModalKey) {
    if (modal === 'edit') {
      const currentMember = this.state.members[memberIdx];

      if (currentMember) {
        const collectiveId = get(currentMember, 'memberAccount.id');
        const currentMemberKey = currentMember.id ? `member-${currentMember.id}` : `collective-${collectiveId}`;

        this.setState({ showEditModal: value, currentMember, currentMemberKey, currentModalKey });
      } else {
        this.setState({ showEditModal: value });
      }
    }
    if (modal === 'invite') {
      this.setState({ showInviteModal: value });
    }
  }

  getMembersCollectiveIds = memoizeOne(members => {
    return members.map(member => member.member && member.member.id);
  });

  resendInvite = member =>
    this.props.inviteMember({
      variables: {
        memberAccount: { id: member.memberAccount.id },
        account: { slug: this.props.collective.slug },
        role: member.role,
      },
    });

  renderMember = (member, index, nbAdmins, memberModalKey) => {
    const { intl, collective, LoggedInUser, refetchLoggedInUser } = this.props;

    const membersCollectiveIds = this.getMembersCollectiveIds(this.state.members);
    const isInvitation = member.__typename === 'MemberInvitation';
    const collectiveId = get(member, 'memberAccount.id');
    const memberCollective = member.account || member.memberAccount;
    const memberKey = member.id ? `member-${member.id}` : `collective-${collectiveId}`;
    const isLastAdmin =
      nbAdmins === 1 && this.state.currentMember?.role === roles.ADMIN && this.state.currentMember?.id;

    return (
      <MemberContainer
        position="relative"
        mt={2}
        mx={2}
        key={`member-${index}-${memberKey}`}
        data-cy={`member-${index}`}
      >
        <Container position="absolute" top="1rem" right="1rem">
          {this.state.showEditModal &&
          memberKey === this.state.currentMemberKey &&
          memberModalKey === this.state.currentModalKey ? (
            <EditMemberModal
              key={`member-edit-modal-${index}-${memberKey}`}
              intl={intl}
              member={this.state.currentMember}
              collective={collective}
              membersIds={membersCollectiveIds}
              index={index}
              cancelHandler={() => this.handleShowModalChange('edit', false, index, memberModalKey)}
              continueHandler={this.onClick}
              isLastAdmin={isLastAdmin}
              LoggedInUser={LoggedInUser}
              refetchLoggedInUser={refetchLoggedInUser}
            />
          ) : (
            <StyledRoundButton
              onClick={() => this.handleShowModalChange('edit', true, index, memberModalKey)}
              size={26}
            >
              <Edit height={16} />
            </StyledRoundButton>
          )}
        </Container>
        <Flex flexDirection="column" alignItems="center">
          <MemberLogoContainer mt={50}>
            <Avatar mt={-28} src={get(memberCollective, 'imageUrl')} radius={56} />
          </MemberLogoContainer>
          <P fontSize="14px" lineHeight="20px" m={2} textAlign="center">
            {get(memberCollective, 'name')}
          </P>
          <StyledTag textTransform="uppercase" display="block" mb={2}>
            {formatMemberRole(intl, get(member, 'role'))}
          </StyledTag>
          <P fontSize="10px" lineHeight="14px" fontWeight={400} color="#9D9FA3" mb={2}>
            <FormattedMessage id="user.since.label" defaultMessage="Since" />:{' '}
            <FormattedDate value={get(member, 'since')} />
          </P>
          <P fontSize="11px" lineHeight="16px" mx={2} fontWeight={400} mb={5}>
            {get(member, 'description')}
          </P>
          <TagContainer>
            {isInvitation && (
              <React.Fragment>
                <StyledTooltip content={intl.formatMessage(this.messages.memberPendingDetails)}>
                  <StyledTag data-cy="member-pending-tag" textTransform="uppercase" display="block" type="info">
                    <FormattedMessage id="Pending" defaultMessage="Pending" />
                  </StyledTag>
                </StyledTooltip>
                <StyledButton mx={2} minWidth={200} onClick={() => this.resendInvite(member)}>
                  <FormattedMessage id="ResendInviteEmail" defaultMessage="Resend Invite" />
                </StyledButton>
              </React.Fragment>
            )}
          </TagContainer>
        </Flex>
      </MemberContainer>
    );
  };

  renderSection() {
    const { intl, collective } = this.props;
    const { members, error } = this.state;
    const nbAdmins = members.filter(m => m.role === roles.ADMIN && m.id).length;
    const membersCollectiveIds = this.getMembersCollectiveIds(this.state.members);

    return (
      <React.Fragment className="EditMembers">
        <Box className="members">
          {collective.type === 'COLLECTIVE' && (
            <SettingsSubtitle>
              <FormattedMessage
                id="members.edit.description"
                defaultMessage="Note: Only Collective Admins can edit this Collective and approve expenses."
              />
            </SettingsSubtitle>
          )}

          <Hide md lg>
            <Grid>
              <HorizontalScroller container={AllCardsContainerMobile}>
                <Flex mx={2}>
                  <InviteNewCard mt={2} mx={2}>
                    <Flex
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                      onClick={() => this.handleShowModalChange('invite', true)}
                    >
                      <Flex flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                        <StyledRoundButton buttonStyle="dark" fontSize={25}>
                          +
                        </StyledRoundButton>
                        <P mt={3} color="black.700">
                          <FormattedMessage id="editTeam.member.invite" defaultMessage="Invite Team Member" />
                        </P>
                      </Flex>
                    </Flex>
                  </InviteNewCard>
                  {members.map((m, idx) => this.renderMember(m, idx, nbAdmins, 'hide-md-lg'))}
                </Flex>
              </HorizontalScroller>
            </Grid>
          </Hide>
          <Hide xs sm>
            <Grid gridGap={20} gridTemplateColumns="repeat(auto-fill, 164px)">
              {this.state.showInviteModal ? (
                <InviteMemberModal
                  intl={intl}
                  collective={collective}
                  membersIds={membersCollectiveIds}
                  cancelHandler={() => this.handleShowModalChange('invite', false)}
                  continueHandler={this.onClick}
                />
              ) : (
                <InviteNewCard mt={2} mx={2}>
                  <Flex
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    onClick={() => this.handleShowModalChange('invite', true)}
                  >
                    <Flex flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                      <StyledRoundButton data-cy="invite-member-btn" buttonStyle="dark" fontSize={25}>
                        +
                      </StyledRoundButton>
                      <P mt={3} color="black.700">
                        <FormattedMessage id="editTeam.member.invite" defaultMessage="Invite Team Member" />
                      </P>
                    </Flex>
                  </Flex>
                </InviteNewCard>
              )}
              {members.map((m, idx) => this.renderMember(m, idx, nbAdmins, 'hide-xs-sm'))}
            </Grid>
          </Hide>
        </Box>
        {error && (
          <MessageBox type="error" withIcon my={3}>
            {error.message}
          </MessageBox>
        )}
        <Flex justifyContent="center" flexWrap="wrap" mt={5}>
          <Link href={`/${collective.slug}`}>
            <StyledButton mx={2} minWidth={200}>
              <FormattedMessage id="ViewCollectivePage" defaultMessage="View Profile page" />
            </StyledButton>
          </Link>
        </Flex>
      </React.Fragment>
    );
  }

  render() {
    const { data, intl } = this.props;

    if (data.loading) {
      return <Loading />;
    } else if (data.error) {
      return (
        <MessageBox type="error" withIcon fontSize="13px">
          {i18nGraphqlException(intl, data.error)}
        </MessageBox>
      );
    } else if (data.account?.parentAccount) {
      const parent = data.account.parentAccount;
      return (
        <MessageBox type="info" withIcon fontSize="13px">
          <FormattedMessage
            id="Members.DefinedInParent"
            defaultMessage="Team members are defined in the settings of {parentName}"
            values={{
              parentName: <Link href={`/${parent.slug}/admin/members`}>{parent.name}</Link>,
            }}
          />
        </MessageBox>
      );
    } else if (data.account?.isFrozen) {
      return (
        <MessageBox type="warning" fontSize="13px" withIcon>
          <FormattedMessage defaultMessage="This account is currently frozen, its team members therefore cannot be edited." />{' '}
          {isFeatureEnabled(data.account.host, FEATURES.CONTACT_FORM) && (
            <FormattedMessage
              defaultMessage="Please <ContactLink>contact</ContactLink> your fiscal host for more details."
              values={{ ContactLink: getI18nLink({ href: `${getCollectivePageRoute(data.account.host)}/contact` }) }}
            />
          )}
        </MessageBox>
      );
    } else {
      return this.renderSection();
    }
  }
}

const memberFieldsFragment = gqlV2/* GraphQL */ `
  fragment MemberFields on Member {
    id
    role
    since
    createdAt
    description
    account {
      id
      name
      slug
      type
      imageUrl(height: 64)
      ... on Individual {
        email
      }
    }
  }
`;

export const coreContributorsQuery = gqlV2/* GraphQL */ `
  query CoreContributors($collectiveSlug: String!, $account: AccountReferenceInput!) {
    account(slug: $collectiveSlug) {
      id
      isFrozen
      parentAccount {
        id
        slug
        type
        name
      }
      ... on AccountWithHost {
        host {
          id
          slug
          name
          features {
            id
            CONTACT_FORM
          }
        }
      }
      members(role: [ADMIN, MEMBER, ACCOUNTANT], limit: 100) {
        nodes {
          ...MemberFields
        }
      }
    }
    memberInvitations(account: $account) {
      id
      role
      since
      createdAt
      description
      memberAccount {
        id
        name
        slug
        type
        imageUrl(height: 64)
        ... on Individual {
          email
        }
      }
    }
  }
  ${memberFieldsFragment}
`;

const inviteMemberMutation = gqlV2/* GraphQL */ `
  mutation InviteMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole!
    $description: String
    $since: DateTime
  ) {
    inviteMember(
      memberAccount: $memberAccount
      account: $account
      role: $role
      description: $description
      since: $since
    ) {
      id
      role
      description
      since
    }
  }
`;

const addCoreContributorsData = graphql(coreContributorsQuery, {
  options: props => ({
    fetchPolicy: 'network-only',
    variables: { collectiveSlug: props.collective.slug, account: { slug: props.collective.slug } },
    context: API_V2_CONTEXT,
  }),
});

const addInviteMemberMutation = graphql(inviteMemberMutation, {
  name: 'inviteMember',
  options: props => ({
    context: API_V2_CONTEXT,
    refetchQueries: [
      {
        query: coreContributorsQuery,
        context: API_V2_CONTEXT,
        variables: {
          collectiveSlug: props.collective.slug,
          account: { slug: props.collective.slug },
        },
      },
    ],
    awaitRefetchQueries: true,
  }),
});

const inject = compose(withUser, injectIntl, addCoreContributorsData, addInviteMemberMutation);

export default inject(Members);
