import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { borders } from 'styled-system';
import ReactTooltip from 'react-tooltip';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { Flex, Box } from '@rebass/grid';
import { Lock } from '@styled-icons/fa-solid';
import { get } from 'lodash';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';

import { compose, formatDate } from '../lib/utils';
import { Router } from '../server/pages';

import Container from './Container';
import Avatar from './Avatar';
import Role from './Role';
import Link from './Link';
import MessageBox from './MessageBox';
import EditUpdateForm from './EditUpdateForm';
import PublishUpdateBtnWithData from './PublishUpdateBtnWithData';
import UpdateTextWithData from './UpdateTextWithData';
import { H3 } from './Text';

const UpdateWrapper = styled(Flex)`
  max-width: 100%;
  min-height: 100px;
  border: 1px solid #e6e8eb;
  padding: 20px;

  ${borders}

  @media (max-width: 600px) {
    max-width: 100%;
  }
`;

const AvatarContainer = styled(Container)`
  margin-right: 20px;
`;

const ActionButton = styled.button`
  color: #71757a;
  outline: none;
  border: none;
  background: none;
`;

const PrivateUpdateMesgBox = styled(MessageBox)`
  height: 40px;
  background: #f0f8ff;
  border: 1px solid #b8deff;
  box-sizing: border-box;
  border-radius: 6px;
  margin-top: 10px;
  padding: 10px;
  font-size: 12px;
  color: #71757a;
  display: flex;
  align-items: center;
`;

const ViewUpdatesLink = styled(Link)`
  margin-top: 20px;
  color: #71757a;
`;

class StyledUpdate extends Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    update: PropTypes.object.isRequired,
    compact: PropTypes.bool, // if compact true, only show the summary
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    editUpdate: PropTypes.func.isRequired,
    deleteUpdate: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      modified: false,
      update: {},
      mode: props.compact ? 'summary' : 'details',
    };

    this.messages = defineMessages({
      edit: { id: 'Edit', defaultMessage: 'Edit' },
      cancelEdit: { id: 'CancelEdit', defaultMessage: 'Cancel edit' },
      viewLatestUpdates: {
        id: 'update.viewLatestUpdates',
        defaultMessage: 'View latest updates',
      },
    });
  }

  cancelEdit = () => {
    this.setState({ modified: false, mode: 'details' });
  };

  edit = () => {
    this.setState({ modified: false, mode: 'edit' });
  };

  toggleEdit = () => {
    this.state.mode === 'edit' ? this.cancelEdit() : this.edit();
  };

  deleteUpdate = async () => {
    if (!confirm('😱 Are you really sure you want to delete this update?')) {
      return;
    }

    try {
      await this.props.deleteUpdate(this.props.update.id);
      Router.pushRoute('collective', { slug: this.props.collective.slug });
    } catch (err) {
      // TODO: this should be reported to the user
      console.error('Update -> deleteUpdate -> error: ', err);
    }
  };

  save = async update => {
    update.id = get(this.props, 'update.id');
    await this.props.editUpdate(update);
    this.setState({ modified: false, mode: 'details' });
  };

  renderUpdateMeta(update, editable) {
    const { intl } = this.props;
    const { mode } = this.state;

    return (
      <Container display="flex" alignItems="Baseline" color="#969BA3" data-cy="meta" flexWrap="wrap">
        {update.isPrivate && (
          <Box mr={2}>
            <Lock data-tip data-for="privateLockText" data-cy="privateIcon" size={12} cursor="pointer" />
            <ReactTooltip id="privateLockText">
              <FormattedMessage id="update.private.lock_text" defaultMessage="This update is private" />
            </ReactTooltip>
          </Box>
        )}

        {update.publishedAt ? (
          <Box as="span" mr={1} fontSize="12px">
            <FormattedMessage
              id="update.publishedAtBy"
              defaultMessage="Published on {date} by {author}"
              values={{
                date: formatDate(update.publishedAt, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
                author: (
                  <Box as="span" mr={2} fontSize="12px">
                    {update.fromCollective.name}
                  </Box>
                ),
              }}
            />
          </Box>
        ) : (
          <Box as="span" mr={1} fontSize="12px">
            <FormattedMessage
              id="update.createdAtBy"
              defaultMessage={'Created on {date} (draft) by {author}'}
              values={{
                date: formatDate(update.createdAt),
                author: (
                  <Box as="span" mr={2} fontSize="12px">
                    {update.fromCollective.name}
                  </Box>
                ),
              }}
            />
          </Box>
        )}
        <Role role="ADMIN" />
        {editable && (
          <React.Fragment>
            <Box mr={2} fontSize="12px">
              <ActionButton onClick={this.toggleEdit} data-cy="toggleEditUpdate">
                {intl.formatMessage(this.messages[`${mode === 'edit' ? 'cancelEdit' : 'edit'}`])}
              </ActionButton>
            </Box>
            <Box mr={2} fontSize="12px">
              <ActionButton onClick={this.deleteUpdate}>
                <FormattedMessage id="update.delete" defaultMessage="delete" />
              </ActionButton>
            </Box>
          </React.Fragment>
        )}
      </Container>
    );
  }

  renderUpdateTitle() {
    const { update, collective } = this.props;
    const { mode } = this.state;
    if (mode === 'summary') {
      return (
        <Link route={`/${collective.slug}/updates/${update.slug}`}>
          <H3 data-cy="updateTitle" color="#090A0A">
            {update.title}
          </H3>
        </Link>
      );
    } else {
      return (
        <H3 data-cy="updateTitle" color="#090A0A">
          {update.title}
        </H3>
      );
    }
  }

  renderSummary(update) {
    const { collective } = this.props;

    return (
      <React.Fragment>
        {update.userCanSeeUpdate && (
          <Container mb={2} fontSize="14px" color="#4B4E52" dangerouslySetInnerHTML={{ __html: update.summary }} />
        )}
        {this.renderUpdateMeta(update)}
        {!update.userCanSeeUpdate && (
          <PrivateUpdateMesgBox type="info" data-cy="mesgBox">
            <FormattedMessage
              id="update.private.cannot_view_message"
              defaultMessage="Become a backer of {collective} to see this update"
              values={{ collective: collective.name }}
            />
          </PrivateUpdateMesgBox>
        )}
      </React.Fragment>
    );
  }

  renderFullContent() {
    const { update, collective, LoggedInUser } = this.props;
    const canEditUpdate = LoggedInUser && LoggedInUser.canEditUpdate(update);
    const canPublishUpdate = LoggedInUser && LoggedInUser.canEditCollective(collective) && !update.publishedAt;
    const editable = !this.props.compact && this.props.editable && canEditUpdate;

    return (
      <React.Fragment>
        {this.renderUpdateMeta(update, editable)}
        <Container>
          {update.html && <div dangerouslySetInnerHTML={{ __html: update.html }} />}
          {!update.html && <UpdateTextWithData id={update.id} />}
          {!update.userCanSeeUpdate && (
            <PrivateUpdateMesgBox type="info" data-cy="mesgBox">
              <FormattedMessage
                id="update.private.cannot_view_message"
                defaultMessage="Become a backer of {collective} to see this update"
                values={{ collective: collective.name }}
              />
            </PrivateUpdateMesgBox>
          )}
          {canPublishUpdate && <PublishUpdateBtnWithData id={update.id} />}
        </Container>
      </React.Fragment>
    );
  }

  renderEditUpdateForm() {
    const { collective, update } = this.props;
    return (
      <Container display="flex" flexDirection="column" flex="1 1" maxWidth="55em" flexWrap="wrap">
        {this.renderUpdateMeta(update, true)}
        <EditUpdateForm collective={collective} update={update} onSubmit={this.save} />
      </Container>
    );
  }

  render() {
    const { update, intl, collective, ...props } = this.props;
    const { mode } = this.state;

    return (
      <React.Fragment>
        <UpdateWrapper {...props}>
          <AvatarContainer>
            <a href={`/${update.fromCollective.slug}`} title={update.fromCollective.name}>
              <Avatar collective={update.fromCollective} radius={40} />
            </a>
          </AvatarContainer>
          {mode !== 'edit' && (
            <Container display="flex" flexDirection="column">
              <Box>{this.renderUpdateTitle()}</Box>
              {mode === 'summary' && this.renderSummary(update)}
              {mode === 'details' && this.renderFullContent()}
            </Container>
          )}

          {mode === 'edit' && this.renderEditUpdateForm()}
        </UpdateWrapper>
        {update.publishedAt && mode === 'details' && (
          <Container my={4}>
            <ViewUpdatesLink route={`/${collective.slug}/updates`}>
              {intl.formatMessage(this.messages['viewLatestUpdates'])}
            </ViewUpdatesLink>
          </Container>
        )}
      </React.Fragment>
    );
  }
}

const editUpdateQuery = gql`
  mutation editUpdate($update: UpdateAttributesInputType!) {
    editUpdate(update: $update) {
      id
      updatedAt
      title
      markdown
      html
      isPrivate
      makePublicOn
    }
  }
`;

const deleteUpdateQuery = gql`
  mutation deleteUpdate($id: Int!) {
    deleteUpdate(id: $id) {
      id
    }
  }
`;

const editUpdateMutation = graphql(editUpdateQuery, {
  props: ({ mutate }) => ({
    editUpdate: async update => {
      return await mutate({ variables: { update } });
    },
  }),
});

const deleteUpdateMutation = graphql(deleteUpdateQuery, {
  props: ({ mutate }) => ({
    deleteUpdate: async updateID => {
      return await mutate({ variables: { id: updateID } });
    },
  }),
});

const addUpdateMutations = compose(editUpdateMutation, deleteUpdateMutation);

export default injectIntl(addUpdateMutations(StyledUpdate));
