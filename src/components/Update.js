import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedMessage, FormattedNumber, FormattedDate } from 'react-intl';
import { capitalize, formatCurrency, formatDate } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Avatar from './Avatar';
import Role from './Role';
import UpdateTextWithData from './UpdateTextWithData';
import { Link } from '../server/pages';
import SmallButton from './SmallButton';
import EditUpdateForm from './EditUpdateForm';
import PublishUpdateBtnWithData from './PublishUpdateBtnWithData';
import { get } from 'lodash';

class Update extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    update: PropTypes.object,
    compact: PropTypes.bool, // if compact true, only show the summary
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);

    this.state = {
      modified: false,
      update: {},
      mode: props.compact ? "summary" : "details"
    };

    this.save = this.save.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.messages = defineMessages({
      'pending': { id: 'update.pending', defaultMessage: 'pending' },
      'paid': { id: 'update.paid', defaultMessage: 'paid' },
      'approved': { id: 'update.approved', defaultMessage: 'approved' },
      'rejected': { id: 'update.rejected', defaultMessage: 'rejected' },
      'edit': { id: 'update.edit', defaultMessage: 'edit' },
      'cancelEdit': { id: 'update.cancelEdit', defaultMessage: 'cancel edit' },
      'viewLatestUpdates': { id: 'update.viewLatestUpdates', defaultMessage: "View latest updates" }
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

  handleChange(update) {
    this.setState({ modified: true, update });
  }

  async save(update) {
    update.id = get(this.props, 'update.id');
    console.log(">>> updating ", update);
    const res = await this.props.editUpdate(update);
    console.log(">>> save res", res);
    this.setState({ modified: false, mode: 'details' });
  }

  render() {
    const {
      intl,
      collective,
      update,
      includeHostedCollectives,
      LoggedInUser
    } = this.props;

    const { mode } = this.state;
    const canEditUpdate = LoggedInUser && LoggedInUser.canEditUpdate(update);
    const canPublishUpdate = LoggedInUser && LoggedInUser.canEditCollective(collective) && !update.publishedAt;
    const editable = !this.props.compact && this.props.editable && canEditUpdate;
    return (
      <div className={`Update ${this.state.mode}View`}>
        <style jsx>{`
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
            color: #18191A;
            font-family: Rubik;
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

          @media(max-width: 600px) {
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
        `}</style>
        <style jsx global>{`
          .update .actions > div > div {
            margin-right: 0.5rem;
          }
        `}</style>
        <div className="fromCollective">
          <a href={`/${update.fromCollective.slug}`} title={update.fromCollective.name}>
            <Avatar src={update.fromCollective.image} key={update.fromCollective.id} radius={40} />
          </a>
        </div>
        <div className="body">
          <div className="meta">
            <div className="author"><Link route={`/${update.fromCollective.slug}`}><a>{update.fromCollective.name}</a></Link></div> 
            <Role role='ADMIN' />
            { update.publishedAt && 
              <div className="publishedAt">
                <FormattedMessage id="update.publishedAt" defaultMessage={"published on {date}"} values={{date: formatDate(update.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })}} />
              </div>
            }
            { !update.publishedAt && 
              <div className="createdAt">
                <FormattedMessage id="update.createdAt" defaultMessage={"created on {date} (draft)"} values={{date: formatDate(update.createdAt)}} />
              </div>
            }
            { editable &&
              <div><a className="toggleEditUpdate" onClick={this.toggleEdit}>{intl.formatMessage(this.messages[`${mode === 'edit' ? 'cancelEdit' : 'edit'}`])}</a></div>
            }
          </div>

          { mode === "summary" &&
            <div>
              <div className="title">
                <Link route={`/${collective.slug}/updates/${update.slug}`}><a>{capitalize(update.title)}</a></Link>
              </div>
              <div className="summary">
                {update.summary}
              </div>
            </div>
          }

          { mode === "details" && 
            <div>
              <div className="title">
                {capitalize(update.title)}
              </div>
              { !this.props.compact &&
                <div>
                  { update.html && <div dangerouslySetInnerHTML={{ __html: update.html }} /> }
                  { !update.html && <UpdateTextWithData id={update.id} /> }
                  { update.publishedAt &&
                    <Link route={`/${collective.slug}/updates`}><a className="viewLatestUpdates">
                      {intl.formatMessage(this.messages[`viewLatestUpdates`])}</a>
                    </Link>
                  }
                </div>
              }
            </div>
          }

          { mode === 'edit' &&
            <div className="edit">
              <EditUpdateForm collective={collective} update={update} onSubmit={this.save} />
            </div>
          }

          { mode !== 'summary' &&
            <div className="actions">
              { mode === 'edit' && this.state.modified &&
                <SmallButton className="primary save" onClick={this.save}><FormattedMessage id="update.save" defaultMessage="save" /></SmallButton>
              }
              { mode === "details" && canPublishUpdate &&
                <PublishUpdateBtnWithData id={update.id} />
              }
            </div>
          }
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
  }
}
`;

const addMutation = graphql(editUpdateQuery, {
  props: ( { mutate }) => ({
    editUpdate: async (update) => {
      return await mutate({ variables: { update } })
    }
  })
});

export default withIntl(addMutation(Update));