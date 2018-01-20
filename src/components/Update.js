import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedMessage, FormattedNumber, FormattedDate } from 'react-intl';
import { capitalize, formatCurrency } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Avatar from './Avatar';
import Role from './Role';
import UpdateTextWithData from './UpdateTextWithData';
import Markdown from 'react-markdown';
import { Link } from '../server/pages';
import SmallButton from './SmallButton';

class Update extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    update: PropTypes.object,
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);

    this.state = {
      modified: false,
      update: {},
      mode: "summary"
    };

    this.save = this.save.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.messages = defineMessages({
      'pending': { id: 'update.pending', defaultMessage: 'pending' },
      'paid': { id: 'update.paid', defaultMessage: 'paid' },
      'approved': { id: 'update.approved', defaultMessage: 'approved' },
      'rejected': { id: 'update.rejected', defaultMessage: 'rejected' },
      'viewLess': { id: 'update.viewLess', defaultMessage: 'View Less' },
      'edit': { id: 'update.edit', defaultMessage: 'edit' },
      'cancelEdit': { id: 'update.cancelEdit', defaultMessage: 'cancel edit' },
      'viewMore': { id: 'update.viewMore', defaultMessage: 'View More' }
    });
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 2, maximumFractionDigits: 2};
  }

  toggleDetails() {
    this.setState({
      mode: this.state.mode === 'details' ? 'summary': 'details',
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

  async save() {
    const update = {
      id: this.props.update.id,
      ...this.state.update
    }
    const res = await this.props.editUpdate(update);
    this.setState({ modified: false, mode: 'details' });
  }

  render() {
    const {
      intl,
      collective,
      update,
      includeHostedCollectives,
      LoggedInUser,
      editable
    } = this.props;

    const { mode } = this.state;

    return (
      <div className={`update ${this.state.mode}View`}>
        <style jsx>{`
          .update {
            width: 100%;
            margin: 0.5em 0;
            padding: 0.5em;
            transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow: hidden;
            position: relative;
            display: flex;
          }
          .update.detailsView {
            background-color: #fafafa;
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
          }
          .meta > div {
            margin-right: 0.5rem;
          }
          .meta .collective {
            margin-right: 0.2rem;
          }
          
          .actions > div {
            display: flex;
            margin: 0.5rem 0;
          }

          .actions .leftColumn {
            width: 72px;
            margin-right: 1rem;
            float: left;
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
            <div className="publishedAt"><FormattedDate value={update.publishedAt} day="numeric" month="numeric" /></div>
            { includeHostedCollectives &&
              <div className="collective"><Link route={`/${update.collective.slug}`}><a>{update.collective.slug}</a></Link> (balance: {formatCurrency(update.collective.stats.balance, update.collective.currency)})</div>
            }
            { editable && LoggedInUser && LoggedInUser.canEditUpdate(update) &&
              <div><a className="toggleEditUpdate" onClick={this.toggleEdit}>{intl.formatMessage(this.messages[`${mode === 'edit' ? 'cancelEdit' : 'edit'}`])}</a></div>
            }
            <Role role='ADMIN' />
          </div>

          <div className="title">
            {capitalize(update.title)}
          </div>
          { this.state.mode === "details" && 
            <div>
              <UpdateTextWithData id={update.id} />
              <span><a className="toggleDetails" onClick={this.toggleDetails}>{intl.formatMessage(this.messages[`${this.state.mode === "details" ? 'viewLess' : 'viewMore'}`])}</a></span>
            </div>
          }
          { this.state.mode === "summary" &&
            <div>
              <Markdown source={update.summary} />
              <span><a className="toggleDetails" onClick={this.toggleDetails}>{intl.formatMessage(this.messages[`${this.state.mode === "details" ? 'viewLess' : 'viewMore'}`])}</a></span>
            </div>
          }

          { editable &&
            <div className="actions">
              { mode === 'edit' && this.state.modified &&
                <div>
                  <div className="leftColumn"></div>
                  <div className="rightColumn">
                    <SmallButton className="primary save" onClick={this.save}><FormattedMessage id="update.save" defaultMessage="save" /></SmallButton>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    );
  }
}

const editUpdateQuery = gql`
mutation editUpdate($update: UpdateInputType!) {
  editUpdate(update: $update) {
    id
    title
    text
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