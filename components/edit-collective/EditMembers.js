import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { get, update, omit } from 'lodash';
import styled from 'styled-components';
import { Flex, Box } from '@rebass/grid';
import memoizeOne from 'memoize-one';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { CollectiveType } from '../../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../../lib/utils';
import InputField from '../InputField';
import CollectivePickerAsync from '../CollectivePickerAsync';
import StyledButton from '../StyledButton';
import StyledTooltip from '../StyledTooltip';
import Container from '../Container';
import { H3, P } from '../Text';
import MessageBox from '../MessageBox';
import Link from '../Link';
import Loading from '../Loading';
import WarnIfUnsavedChanges from '../WarnIfUnsavedChanges';
import StyledTag from '../StyledTag';

/**
 * This pages sets some global styles that are causing troubles in new components. This
 * wrapper resets the global styles for children.
 */
const ResetGlobalStyles = styled.div`
  input {
    width: 100%;
  }
`;

const BORDER = '1px solid #efefef';

const EMPTY_MEMBERS = [{}];

class EditMembers extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    /** @ignore from injectIntl */
    intl: PropTypes.object.isRequired,
    /** @ignore from Apollo */
    mutate: PropTypes.func.isRequired,
    /** @ignore from Apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      refetch: PropTypes.func.isRequired,
      data: PropTypes.object,
    }),
  };

  constructor(props) {
    super(props);
    const { intl } = props;
    this.state = {
      members: this.getMembersFromProps(props),
      isTouched: false,
      isSubmitting: false,
      isSubmitted: false,
    };
    this.messages = defineMessages({
      roleLabel: { id: 'members.role.label', defaultMessage: 'role' },
      addMember: { id: 'members.add', defaultMessage: 'Add Core Contributor' },
      removeMember: { id: 'members.remove', defaultMessage: 'Remove Core Contributor' },
      ADMIN: { id: 'roles.admin.label', defaultMessage: 'Collective Admin' },
      MEMBER: { id: 'roles.member.label', defaultMessage: 'Core Contributor' },
      descriptionLabel: { id: 'user.description.label', defaultMessage: 'description' },
      sinceLabel: { id: 'user.since.label', defaultMessage: 'since' },
      memberPendingDetails: {
        id: 'members.pending.details',
        defaultMessage: 'This member has not approved the invitation to join the collective yet',
      },
      cantRemoveYourself: {
        id: 'members.remove.cantRemoveYourself',
        defaultMessage:
          'You cannot remove yourself as a Collective admin. If you are the only admin, please add a new one and ask them to remove you.',
      },
      removeConfirm: {
        id: 'members.remove.confirm',
        defaultMessage: `Do you really want to remove {name} @{slug} {hasEmail, select, 1 {({email})} other {}} from the core contributors of the collective?`,
      },
    });

    const getOptions = arr => {
      return arr.map(key => {
        const obj = {};
        obj[key] = intl.formatMessage(this.messages[key]);
        return obj;
      });
    };

    this.fields = [
      {
        name: 'role',
        type: 'select',
        options: getOptions(['ADMIN', 'MEMBER']),
        defaultValue: 'ADMIN',
        label: intl.formatMessage(this.messages.roleLabel),
      },
      {
        name: 'description',
        maxLength: 255,
        label: intl.formatMessage(this.messages.descriptionLabel),
      },
      {
        name: 'since',
        type: 'date',
        defaultValue: new Date(),
        label: intl.formatMessage(this.messages.sinceLabel),
      },
    ];
  }

  componentDidUpdate(oldProps) {
    const invitations = get(this.props.data, 'memberInvitations', null);
    const oldInvitations = get(oldProps.data, 'memberInvitations', null);
    const members = get(this.props.data, 'Collective.members', null);
    const oldMembers = get(oldProps.data, 'Collective.members', null);

    if (invitations !== oldInvitations || members !== oldMembers) {
      this.setState({ members: this.getMembersFromProps(this.props) });
    }
  }

  getMembersFromProps(props) {
    const pendingInvitations = get(props.data, 'memberInvitations', EMPTY_MEMBERS);
    const pendingInvitationsMembersData = pendingInvitations.map(i => omit(i, ['id']));
    const members = get(props.data, 'Collective.members', EMPTY_MEMBERS);
    const all = [...members, ...pendingInvitationsMembersData];
    return all.length === 0 ? EMPTY_MEMBERS : all;
  }

  getMembersCollectiveIds = memoizeOne(members => {
    return members.map(member => member.member && member.member.id);
  });

  editMember = (index, fieldname, value) => {
    this.setState(state => ({
      isTouched: true,
      members: update([...state.members], index, member => ({ ...member, [fieldname]: value })),
    }));
  };

  addMember = () => {
    this.setState(state => ({
      isTouched: true,
      members: [...state.members, { role: 'ADMIN' }],
    }));
  };

  removeMember = index => {
    return this.setState(state => {
      const memberEntry = state.members[index];
      if (memberEntry.member && !this.confirmRemoveMember(memberEntry)) {
        return null;
      } else {
        const members = [...state.members];
        members.splice(index, 1);
        return { isTouched: true, members };
      }
    });
  };

  confirmRemoveMember = memberEntry => {
    return window.confirm(
      this.props.intl.formatMessage(this.messages.removeConfirm, {
        ...memberEntry.member,
        hasEmail: Number(memberEntry.member.email),
      }),
    );
  };

  handleSubmit = async () => {
    if (!this.validate) {
      return false;
    }

    try {
      this.setState({ isSubmitting: true, error: null });
      await this.props.mutate({
        variables: {
          collectiveId: this.props.collective.id,
          members: this.state.members.map(member => ({
            id: member.id,
            role: member.role,
            description: member.description,
            since: member.since,
            member: {
              id: member.member.id,
              name: member.member.name,
              email: member.member.email,
            },
          })),
        },
      });
      await this.props.data.refetch();
      this.setState({ isSubmitting: false, isSubmitted: true, isTouched: false });
    } catch (e) {
      this.setState({ isSubmitting: false, error: getErrorFromGraphqlException(e) });
    }
  };

  validate() {
    // Ensure all members have a collective associated
    return !this.state.members.some(m => !m.member);
  }

  renderMember = (member, index) => {
    const { intl, LoggedInUser } = this.props;
    const membersCollectiveIds = this.getMembersCollectiveIds(this.state.members);
    const isInvitation = member.__typename === 'MemberInvitation';
    const collectiveId = get(member, 'member.id');
    const memberCollective = member.member;
    const isSelf = memberCollective && memberCollective.id === LoggedInUser.CollectiveId;
    const memberKey = member.id ? `member-${member.id}` : `collective-${collectiveId}`;

    return (
      <Container key={`member-${index}-${memberKey}`} mt={4} pb={4} borderBottom={BORDER}>
        <ResetGlobalStyles>
          <Flex mt={2} flexWrap="wrap">
            <div className="col-sm-2" />
            <Flex flex="1" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2}>
              <Box ml={1} my={1}>
                <CollectivePickerAsync
                  creatable
                  width="100%"
                  minWidth={325}
                  maxWidth={450}
                  onChange={option => this.editMember(index, 'member', option.value)}
                  getOptions={memberCollective && (buildOption => buildOption(memberCollective))}
                  isDisabled={Boolean(memberCollective)}
                  types={[CollectiveType.USER]}
                  filterResults={collectives => collectives.filter(c => !membersCollectiveIds.includes(c.id))}
                />
              </Box>
              {isInvitation && (
                <Flex alignItems="center" my={1}>
                  <StyledTooltip content={intl.formatMessage(this.messages.memberPendingDetails)}>
                    <StyledTag display="block" type="info">
                      <FormattedMessage id="Pending" defaultMessage="Pending" />
                    </StyledTag>
                  </StyledTooltip>
                </Flex>
              )}
              {isSelf ? (
                <StyledTooltip content={() => intl.formatMessage(this.messages.cantRemoveYourself)}>
                  <StyledButton my={1} disabled>
                    {intl.formatMessage(this.messages.removeMember)}
                  </StyledButton>
                </StyledTooltip>
              ) : (
                <StyledButton my={1} onClick={() => this.removeMember(index)} disabled={isSelf}>
                  {intl.formatMessage(this.messages.removeMember)}
                </StyledButton>
              )}
            </Flex>
          </Flex>
        </ResetGlobalStyles>
        <Form horizontal>
          {this.fields.map(
            field =>
              (!field.when || field.when(member)) && (
                <InputField
                  className="horizontal"
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  type={field.type}
                  disabled={typeof field.disabled === 'function' ? field.disabled(member) : field.disabled}
                  defaultValue={get(member, field.name) || field.defaultValue}
                  options={field.options}
                  pre={field.pre}
                  placeholder={field.placeholder}
                  onChange={value => this.editMember(index, field.name, value)}
                />
              ),
          )}
        </Form>
      </Container>
    );
  };

  renderForm() {
    const { intl, collective } = this.props;
    const { members, error, isSubmitting, isSubmitted, isTouched } = this.state;
    const isValid = this.validate();

    return (
      <WarnIfUnsavedChanges hasUnsavedChanges={isTouched}>
        <div className="EditMembers">
          <div className="members">
            <H3>
              <FormattedMessage id="EditMembers.Title" defaultMessage="Edit Core Contributors" />
            </H3>
            {collective.type === 'COLLECTIVE' && (
              <P>
                <FormattedMessage
                  id="members.edit.description"
                  defaultMessage="Note: Only Collective Admins can edit this Collective and approve or reject expenses."
                />
              </P>
            )}
            <hr />
            {members.map(this.renderMember)}
          </div>
          <Container textAlign="center" py={4} mb={4} borderBottom={BORDER}>
            <StyledButton onClick={() => this.addMember()}>
              + {intl.formatMessage(this.messages.addMember)}
            </StyledButton>
          </Container>
          {error && (
            <MessageBox type="error" withIcon my={3}>
              {error.message}
            </MessageBox>
          )}
          <Flex justifyContent="center" flexWrap="wrap" mt={5}>
            <Link route="collective" params={{ slug: collective.slug }}>
              <StyledButton mx={2} minWidth={200}>
                <FormattedMessage id="ViewCollectivePage" defaultMessage="View Collective page" />
              </StyledButton>
            </Link>
            <StyledButton
              buttonStyle="primary"
              onClick={this.handleSubmit}
              loading={isSubmitting}
              disabled={(isSubmitted && !isTouched) || !isValid}
              mx={2}
              minWidth={200}
            >
              {isSubmitted && !isTouched ? (
                <FormattedMessage id="saved" defaultMessage="Saved" />
              ) : (
                <FormattedMessage id="save" defaultMessage="Save" />
              )}
            </StyledButton>
          </Flex>
        </div>
      </WarnIfUnsavedChanges>
    );
  }

  render() {
    const { data } = this.props;

    if (data.loading) {
      return <Loading />;
    } else if (data.error) {
      return (
        <MessageBox type="error" withIcon>
          {getErrorFromGraphqlException(data.error).message}
        </MessageBox>
      );
    } else {
      return this.renderForm();
    }
  }
}

const MemberFieldsFragment = gql`
  fragment MemberFieldsFragment on Member {
    id
    role
    since
    createdAt
    description
    member {
      id
      name
      slug
      type
      imageUrl(height: 64)
      ... on User {
        email
      }
    }
  }
`;

const addGetCoreContributorsQuery = graphql(
  gql`
    query CollectiveCoreContributors($collectiveId: Int!) {
      Collective(id: $collectiveId) {
        id
        members(roles: ["ADMIN", "MEMBER"]) {
          ...MemberFieldsFragment
        }
      }
      memberInvitations(CollectiveId: $collectiveId) {
        id
        role
        since
        createdAt
        description
        member {
          id
          name
          slug
          type
          imageUrl(height: 64)
          ... on User {
            email
          }
        }
      }
    }
    ${MemberFieldsFragment}
  `,
  {
    options: props => ({
      fetchPolicy: 'network-only',
      variables: { collectiveId: props.collective.id },
    }),
  },
);

const addEditCoreContributorsMutation = graphql(gql`
  mutation EditCollectiveMembers($collectiveId: Int!, $members: [MemberInputType!]!) {
    editCoreContributors(collectiveId: $collectiveId, members: $members) {
      id
      members(roles: ["ADMIN", "MEMBER"]) {
        ...MemberFieldsFragment
      }
    }
  }
  ${MemberFieldsFragment}
`);

export default injectIntl(addEditCoreContributorsMutation(addGetCoreContributorsQuery(EditMembers)));
