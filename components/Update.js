import React from 'react';
import PropTypes from 'prop-types';
import { Lock } from '@styled-icons/fa-solid';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';
import ReactTooltip from 'react-tooltip';

import { compose, formatDate } from '../lib/utils';

import Avatar from './Avatar';
import Role from './Role';
import UpdateTextWithData from './UpdateTextWithData';
import { Router, Link } from '../server/pages';
import SmallButton from './SmallButton';
import EditUpdateForm from './EditUpdateForm';
import PublishUpdateBtnWithData from './PublishUpdateBtnWithData';
import MessageBox from './MessageBox';

class Update extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    update: PropTypes.object,
    compact: PropTypes.bool, // if compact true, only show the summary
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    deleteUpdate: PropTypes.func,
    editUpdate: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      modified: false,
      update: {},
      mode: props.compact ? 'summary' : 'details',
    };

    this.save = this.save.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.deleteUpdate = this.deleteUpdate.bind(this);
    this.messages = defineMessages({
      edit: { id: 'Edit', defaultMessage: 'Edit' },
      cancelEdit: { id: 'CancelEdit', defaultMessage: 'Cancel edit' },
      viewLatestUpdates: {
        id: 'update.viewLatestUpdates',
        defaultMessage: 'View latest updates',
      },
    });
  }

  cancelEdit() {
    this.setState({ modified: false, mode: 'details' });
  }

  edit() {
    this.setState({ modified: false, mode: 'edit' });
  }

  toggleEdit() {
    this.state.mode === 'edit' ? this.cancelEdit() : this.edit();
  }

  async deleteUpdate() {
    if (!confirm('😱 Are you really sure you want to delete this update?')) return;

    try {
      await this.props.deleteUpdate(this.props.update.id);
      Router.pushRoute('collective', { slug: this.props.collective.slug });
    } catch (err) {
      console.error('>>> deleteUpdate error: ', JSON.stringify(err));
    }
  }

  handleChange(update) {
    this.setState({ modified: true, update });
  }

  async save(update) {
    update.id = get(this.props, 'update.id');
    console.log('>>> updating ', update);
    const res = await this.props.editUpdate(update);
    console.log('>>> save res', res);
    this.setState({ modified: false, mode: 'details' });
  }

  render() {
    const { intl, collective, update, LoggedInUser } = this.props;

    const { mode } = this.state;
    const canEditUpdate = LoggedInUser && LoggedInUser.canEditUpdate(update);
    const canPublishUpdate = LoggedInUser && LoggedInUser.canEditCollective(collective) && !update.publishedAt;
    const editable = !this.props.compact && this.props.editable && canEditUpdate;
    return (
      <div className={`Update ${this.state.mode}View`}>
        <style jsx>
          {`
            .Update {
              margin: 0.5em 0;
              padding: 0.5em 0;
              transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              overflow: hidden;
              position: relative;
              display: flex;
            }
            a {
              cursor: pointer;
            }
            .fromCollective {
              float: left;
              margin-right: 1rem;
            }

            .title {
              color: #18191a;
              font-size: 20px;
              font-weight: 500;
              line-height: 28px;
            }
            .body {
              overflow: hidden;
              font-size: 1.5rem;
              width: 100%;
            }
            .meta {
              display: flex;
              align-items: center;
              color: #919599;
              font-size: 1.2rem;
              flex-wrap: wrap;
            }
            .Update .meta :global(> div) {
              margin-right: 0.5rem;
            }
            .meta .collective {
              margin-right: 0.2rem;
            }

            .actions {
              margin-top: 5rem;
            }

            @media (max-width: 600px) {
              .update {
                max-height: 13rem;
              }
              .update.detailsView {
                max-height: 45rem;
              }
              .details {
                max-height: 30rem;
              }
            }
          `}
        </style>
        <style jsx global>
          {`
            .update .actions > div > div {
              margin-right: 0.5rem;
            }
          `}
        </style>
        <div className="fromCollective">
          <a href={`/${update.fromCollective.slug}`} title={update.fromCollective.name}>
            <Avatar collective={update.fromCollective} radius={40} />
          </a>
        </div>
        <div className="body">
          {mode === 'summary' && (
            <div className="title">
              <Link route={`/${collective.slug}/updates/${update.slug}`}>
                <a>{update.title}</a>
              </Link>
            </div>
          )}

          {mode === 'details' && <div className="title">{update.title}</div>}

          <div className="meta">
            <div className="author">
              <Link route={`/${update.fromCollective.slug}`}>
                <a>{update.fromCollective.name}</a>
              </Link>
            </div>
            <Role role="ADMIN" />
            {update.publishedAt && (
              <div className="publishedAt">
                <FormattedMessage
                  id="update.publishedAt"
                  defaultMessage={'published on {date}'}
                  values={{
                    date: formatDate(update.publishedAt, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                  }}
                />
              </div>
            )}
            {!update.publishedAt && (
              <div className="createdAt">
                <FormattedMessage
                  id="update.createdAt"
                  defaultMessage={'created on {date} (draft)'}
                  values={{ date: formatDate(update.createdAt) }}
                />
              </div>
            )}

            {update.isPrivate && (
              <React.Fragment>
                <Lock data-tip data-for="privateLockText" data-cy="privateIcon" size={12} cursor="pointer" />
                <ReactTooltip id="privateLockText">
                  <FormattedMessage id="update.private.lock_text" defaultMessage="This update is private" />
                </ReactTooltip>
              </React.Fragment>
            )}

            {editable && (
              <React.Fragment>
                <div>
                  <a className="toggleEditUpdate" onClick={this.toggleEdit}>
                    {intl.formatMessage(this.messages[`${mode === 'edit' ? 'cancelEdit' : 'edit'}`])}
                  </a>
                </div>
                <div>
                  <a className="deleteUpdateUpdate" onClick={this.deleteUpdate}>
                    <FormattedMessage id="update.delete" defaultMessage="delete" />
                  </a>
                </div>
              </React.Fragment>
            )}
          </div>

          {mode === 'summary' && <div className="summary" dangerouslySetInnerHTML={{ __html: update.summary }} />}

          {mode === 'details' && !this.props.compact && (
            <div>
              {update.html && <div dangerouslySetInnerHTML={{ __html: update.html }} />}
              {!update.html && <UpdateTextWithData id={update.id} />}
              {!update.userCanSeeUpdate && (
                <MessageBox type="info">
                  <FormattedMessage
                    id="update.private.cannot_view_message"
                    defaultMessage="Become a backer of {collective} to see this update"
                    values={{ collective: collective.name }}
                  />
                </MessageBox>
              )}
              {update.publishedAt && (
                <Link route={`/${collective.slug}/updates`} className="viewLatestUpdates">
                  {intl.formatMessage(this.messages['viewLatestUpdates'])}
                </Link>
              )}
            </div>
          )}

          {mode === 'edit' && (
            <div className="edit">
              <EditUpdateForm collective={collective} update={update} onSubmit={this.save} />
            </div>
          )}

          {mode !== 'summary' && (
            <div className="actions">
              {mode === 'edit' && this.state.modified && (
                <SmallButton className="primary save" onClick={this.save}>
                  <FormattedMessage id="save" defaultMessage="Save" />
                </SmallButton>
              )}
              {mode === 'details' && canPublishUpdate && <PublishUpdateBtnWithData id={update.id} />}
            </div>
          )}
        </div>
      </div>
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

export default injectIntl(addUpdateMutations(Update));
