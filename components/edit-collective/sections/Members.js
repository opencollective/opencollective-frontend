import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get, omit, update } from 'lodash';
import memoizeOne from 'memoize-one';
import { Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../../lib/constants/collectives';
import roles from '../../../lib/constants/roles';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import formatMemberRole from '../../../lib/i18n/member-role';
import { compose } from '../../../lib/utils';

import CollectivePickerAsync from '../../CollectivePickerAsync';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import InputField from '../../InputField';
import Link from '../../Link';
import Loading from '../../Loading';
import MemberRoleDescription, { hasRoleDescription } from '../../MemberRoleDescription';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledTag from '../../StyledTag';
import StyledTooltip from '../../StyledTooltip';
import { H3, P } from '../../Text';
import WarnIfUnsavedChanges from '../../WarnIfUnsavedChanges';

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

class Members extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    /** @ignore from injectIntl */
    intl: PropTypes.object.isRequired,
    /** @ignore from Apollo */
    editCoreContributors: PropTypes.func.isRequired,
    /** @ignore from Apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      refetch: PropTypes.func.isRequired,
      Collective: PropTypes.object,
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
      addMember: { id: 'members.add', defaultMessage: 'Add Team Member' },
      removeMember: { id: 'members.remove', defaultMessage: 'Remove Team Member' },
      descriptionLabel: { id: 'Fields.description', defaultMessage: 'Description' },
      sinceLabel: { id: 'user.since.label', defaultMessage: 'since' },
      memberPendingDetails: {
        id: 'members.pending.details',
        defaultMessage: 'This member has not approved the invitation to join the collective yet',
      },
      cantRemoveLast: {
        id: 'members.remove.cantRemoveLast',
        defaultMessage: 'The last admin cannot be removed. Please add another admin before doing so.',
      },
      removeConfirm: {
        id: 'members.remove.confirm',
        defaultMessage: `Do you really want to remove {name} @{slug} {hasEmail, select, 1 {({email})} other {}}?`,
      },
    });

    const getOptions = arr => {
      return arr.map(key => {
        const obj = {};
        obj[key] = formatMemberRole(intl, key);
        return obj;
      });
    };

    this.fields = [
      {
        name: 'role',
        type: 'select',
        options: getOptions([roles.ADMIN, roles.MEMBER, roles.ACCOUNTANT]),
        defaultValue: roles.ADMIN,
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
      await this.props.editCoreContributors({
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

  renderMember = (member, index, nbAdmins) => {
    const { intl } = this.props;
    const membersCollectiveIds = this.getMembersCollectiveIds(this.state.members);
    const isInvitation = member.__typename === 'MemberInvitation';
    const collectiveId = get(member, 'member.id');
    const memberCollective = member.member;
    const memberKey = member.id ? `member-${member.id}` : `collective-${collectiveId}`;
    const isLastAdmin = nbAdmins === 1 && member.role === roles.ADMIN && member.id;

    return (
      <Container key={`member-${index}-${memberKey}`} mt={4} pb={4} borderBottom={BORDER} data-cy={`member-${index}`}>
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
                  data-cy="member-collective-picker"
                />
              </Box>
              {isInvitation && (
                <Flex alignItems="center" my={1} data-cy="member-pending-tag">
                  <StyledTooltip content={intl.formatMessage(this.messages.memberPendingDetails)}>
                    <StyledTag textTransform="uppercase" display="block" type="info">
                      <FormattedMessage id="Pending" defaultMessage="Pending" />
                    </StyledTag>
                  </StyledTooltip>
                </Flex>
              )}
              {isLastAdmin ? (
                <StyledTooltip content={() => intl.formatMessage(this.messages.cantRemoveLast)}>
                  <StyledButton my={1} disabled>
                    {intl.formatMessage(this.messages.removeMember)}
                  </StyledButton>
                </StyledTooltip>
              ) : (
                <StyledButton my={1} onClick={() => this.removeMember(index)}>
                  {intl.formatMessage(this.messages.removeMember)}
                </StyledButton>
              )}
            </Flex>
          </Flex>
        </ResetGlobalStyles>
        <Form horizontal>
          {this.fields.map(field => (
            <React.Fragment key={field.name}>
              <InputField
                className="horizontal"
                name={field.name}
                label={field.label}
                type={field.type}
                disabled={field.name === 'role' ? isLastAdmin : false}
                defaultValue={get(member, field.name) || field.defaultValue}
                options={field.options}
                pre={field.pre}
                placeholder={field.placeholder}
                onChange={value => this.editMember(index, field.name, value)}
              />
              {field.name === 'role' && hasRoleDescription(member.role) && (
                <Flex mb={3} mt={-2}>
                  <Box flex="0 1" flexBasis={['0%', '17.5%']} />
                  <Container flex="1 1" fontSize="12px" color="black.600" fontStyle="italic">
                    <MemberRoleDescription role={member.role} />
                  </Container>
                </Flex>
              )}
            </React.Fragment>
          ))}
        </Form>
      </Container>
    );
  };

  renderForm() {
    const { intl, collective } = this.props;
    const { members, error, isSubmitting, isSubmitted, isTouched } = this.state;
    const isValid = this.validate();
    const nbAdmins = members.filter(m => m.role === roles.ADMIN && m.id).length;

    return (
      <WarnIfUnsavedChanges hasUnsavedChanges={isTouched}>
        <div className="EditMembers">
          <div className="members">
            <H3>
              <FormattedMessage id="EditMembers.Title" defaultMessage="Edit Team" />
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
            {members.map((m, idx) => this.renderMember(m, idx, nbAdmins))}
          </div>
          <Container textAlign="center" py={4} mb={4} borderBottom={BORDER}>
            <StyledButton onClick={() => this.addMember()} data-cy="add-member-btn">
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
                <FormattedMessage id="ViewCollectivePage" defaultMessage="View Profile page" />
              </StyledButton>
            </Link>
            <StyledButton
              buttonStyle="primary"
              onClick={this.handleSubmit}
              loading={isSubmitting}
              disabled={(isSubmitted && !isTouched) || !isValid}
              mx={2}
              minWidth={200}
              data-cy="save-members-btn"
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
    } else if (data.Collective?.parentCollective) {
      const parent = data.Collective.parentCollective;
      return (
        <MessageBox type="info" withIcon>
          <FormattedMessage
            id="Members.DefinedInParent"
            defaultMessage="The team for this profile is defined in {parentName}'s settings"
            values={{
              parentName: (
                <Link route="editCollective" params={{ slug: parent.slug, section: 'members' }}>
                  {parent.name}
                </Link>
              ),
            }}
          />
        </MessageBox>
      );
    } else {
      return this.renderForm();
    }
  }
}

const memberFieldsFragment = gql`
  fragment MemberFields on Member {
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

const coreContributorsQuery = gql`
  query CoreContributors($collectiveId: Int!) {
    Collective(id: $collectiveId) {
      id
      parentCollective {
        id
        slug
        type
        name
      }
      members(roles: ["ADMIN", "MEMBER", "ACCOUNTANT"]) {
        ...MemberFields
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
  ${memberFieldsFragment}
`;

const addCoreContributorsData = graphql(coreContributorsQuery, {
  options: props => ({
    fetchPolicy: 'network-only',
    variables: { collectiveId: props.collective.id },
  }),
});

const editCoreContributorsMutation = gql`
  mutation EditCoreContributors($collectiveId: Int!, $members: [MemberInputType!]!) {
    editCoreContributors(collectiveId: $collectiveId, members: $members) {
      id
      members(roles: ["ADMIN", "MEMBER"]) {
        ...MemberFields
      }
    }
  }
  ${memberFieldsFragment}
`;

const addEditCoreContributorsMutation = graphql(editCoreContributorsMutation, {
  name: 'editCoreContributors',
});

const addGraphql = compose(addCoreContributorsData, addEditCoreContributorsMutation);

export default injectIntl(addGraphql(Members));
