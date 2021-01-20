import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { Lock } from '@styled-icons/fa-solid';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { borders } from 'styled-system';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { compose, formatDate } from '../lib/utils';
import { Router } from '../server/pages';

import Avatar from './Avatar';
import Container from './Container';
import EditUpdateForm from './EditUpdateForm';
import { Box, Flex } from './Grid';
import Link from './Link';
import LinkCollective from './LinkCollective';
import LoadingPlaceholder from './LoadingPlaceholder';
import MessageBox from './MessageBox';
import PublishUpdateBtnWithData from './PublishUpdateBtnWithData';
import StyledButton from './StyledButton';
import StyledHr from './StyledHr';
import StyledTag from './StyledTag';
import StyledTooltip from './StyledTooltip';
import { H5 } from './Text';

const UpdateWrapper = styled(Flex)`
  max-width: 100%;
  min-height: 100px;
  padding: 20px;

  ${borders}

  @media (max-width: 600px) {
    max-width: 100%;
  }
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

class StyledUpdate extends Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    update: PropTypes.object.isRequired,
    compact: PropTypes.bool, // if compact true, only show the summary
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    isReloadingData: PropTypes.object,
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
      await this.props.deleteUpdate({ variables: { id: this.props.update.id } });
      Router.pushRoute('collective', { slug: this.props.collective.slug });
    } catch (err) {
      // TODO: this should be reported to the user
      console.error('Update -> deleteUpdate -> error: ', err);
    }
  };

  save = async update => {
    update.id = get(this.props, 'update.id');
    await this.props.editUpdate({ variables: { update } });
    this.setState({ modified: false, mode: 'details' });
  };

  renderUpdateMeta(update, editable) {
    const { intl } = this.props;
    const { mode } = this.state;
    const fromAccount = update.fromCollective || update.fromAccount;

    return (
      <Container display="flex" alignItems="Baseline" color="#969BA3" data-cy="meta" flexWrap="wrap">
        {update.isPrivate && (
          <Box mr={2}>
            <StyledTooltip
              id="privateLockText"
              content={() => <FormattedMessage id="update.private.lock_text" defaultMessage="This update is private" />}
            >
              <Lock data-tip data-for="privateLockText" data-cy="privateIcon" size={12} cursor="pointer" />
            </StyledTooltip>
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
                    <LinkCollective collective={fromAccount} />
                  </Box>
                ),
              }}
            />
          </Box>
        ) : (
          <Box as="span" mr={1} fontSize="12px">
            <FormattedMessage
              id="update.createdAtBy"
              defaultMessage="Created on {date} (draft) by {author}"
              values={{
                date: formatDate(update.createdAt),
                author: (
                  <Box as="span" mr={2} fontSize="12px">
                    <LinkCollective collective={fromAccount} />
                  </Box>
                ),
              }}
            />
          </Box>
        )}
        <StyledTag fontSize="10px" py={1}>
          <FormattedMessage id="Member.Role.ADMIN" defaultMessage="Admin" />
        </StyledTag>
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
          <H5 data-cy="updateTitle">{update.title}</H5>
        </Link>
      );
    } else {
      return <H5 data-cy="updateTitle">{update.title}</H5>;
    }
  }

  renderSummary(update) {
    const { collective, isReloadingData } = this.props;
    return (
      <React.Fragment>
        {update.userCanSeeUpdate && (
          <Container
            mb={2}
            pl={[0, 60]}
            fontSize="14px"
            color="#4B4E52"
            css={{ wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: update.summary }}
          />
        )}
        {!update.userCanSeeUpdate && !isReloadingData && (
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
    const { update, collective, LoggedInUser, isReloadingData } = this.props;
    const canPublishUpdate = LoggedInUser && LoggedInUser.canEditCollective(collective) && !update.publishedAt;

    return (
      <Container css={{ wordBreak: 'break-word' }} pl={[0, 60]}>
        <StyledHr mt={3} mb={4} borderColor="black.100" />
        {update.html ? (
          <div dangerouslySetInnerHTML={{ __html: update.html }} />
        ) : !update.userCanSeeUpdate && !isReloadingData ? (
          <PrivateUpdateMesgBox type="info" data-cy="mesgBox">
            <FormattedMessage
              id="update.private.cannot_view_message"
              defaultMessage="Become a backer of {collective} to see this update"
              values={{ collective: collective.name }}
            />
          </PrivateUpdateMesgBox>
        ) : isReloadingData ? (
          <LoadingPlaceholder height={300} />
        ) : null}
        {canPublishUpdate && <PublishUpdateBtnWithData id={update.id} />}
      </Container>
    );
  }

  renderEditUpdateForm() {
    const { collective, update } = this.props;

    return (
      <Container display="flex" flexDirection="column" flex="1 1" maxWidth="1200px" flexWrap="wrap">
        {this.renderUpdateMeta(update, true)}
        <EditUpdateForm collective={collective} update={update} onSubmit={this.save} />
      </Container>
    );
  }

  render() {
    const { update, intl, collective, compact, LoggedInUser, ...props } = this.props;
    const { mode } = this.state;
    const canEditUpdate = LoggedInUser && LoggedInUser.canEditUpdate(update);
    const editable = !compact && props.editable && canEditUpdate;
    const fromAccount = update.fromCollective || update.fromAccount;

    return (
      <React.Fragment>
        <UpdateWrapper {...props}>
          {mode !== 'edit' && (
            <Container width="100%">
              <Flex mb={2}>
                <Container mr={20}>
                  <LinkCollective collective={fromAccount}>
                    <Avatar collective={fromAccount} radius={40} />
                  </LinkCollective>
                </Container>
                <Box>
                  {this.renderUpdateTitle()}
                  {this.renderUpdateMeta(update, editable)}
                </Box>
              </Flex>
              {mode === 'summary' && this.renderSummary(update)}
              {mode === 'details' && this.renderFullContent()}
            </Container>
          )}

          {mode === 'edit' && this.renderEditUpdateForm()}
        </UpdateWrapper>
        {update.publishedAt && mode === 'details' && (
          <Flex my={4} justifyContent={['center', 'flex-start']}>
            <Link route={`/${collective.slug}/updates`}>
              <StyledButton ml={[0, 5]}>{intl.formatMessage(this.messages['viewLatestUpdates'])}</StyledButton>
            </Link>
          </Flex>
        )}
      </React.Fragment>
    );
  }
}

const editUpdateMutation = gqlV2/* GraphQL */ `
  mutation EditUpdate($update: UpdateUpdateInput!) {
    editUpdate(update: $update) {
      id
      updatedAt
      title
      html
      isPrivate
      makePublicOn
    }
  }
`;

const deleteUpdateMutation = gqlV2/* GraphQL */ `
  mutation DeleteUpdate($id: String!) {
    deleteUpdate(id: $id) {
      id
    }
  }
`;

const addEditUpdateMutation = graphql(editUpdateMutation, {
  name: 'editUpdate',
  options: {
    context: API_V2_CONTEXT,
  },
});

const addDeleteUpdateMutation = graphql(deleteUpdateMutation, {
  name: 'deleteUpdate',
  options: {
    context: API_V2_CONTEXT,
  },
});

const addGraphql = compose(addEditUpdateMutation, addDeleteUpdateMutation);

export default injectIntl(addGraphql(StyledUpdate));
