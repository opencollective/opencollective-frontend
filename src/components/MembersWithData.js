import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Member from './Member';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { exportMembers } from '../lib/export_file';
import { pluralize } from '../lib/utils';

const MEMBERS_PER_PAGE = 10;

class MembersWithData extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    tier: PropTypes.object,
    limit: PropTypes.number,
    onChange: PropTypes.func,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.fetchMore = this.fetchMore.bind(this);
    this.refetch = this.refetch.bind(this);
    this.onChange = this.onChange.bind(this);
    this.state = {
      role: null,
      loading: false
    };
  }

  onChange() {
    const { onChange } = this.props; 
    onChange && this.node && onChange({ height: this.node.offsetHeight });    
  }

  componentDidMount() {
    this.onChange();
  }

  fetchMore(e) {
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
      this.onChange();
    });
  }

  refetch(role) {
    this.setState({role});
    this.props.refetch({role});
  }

  render() {
    const { data, LoggedInUser, collective, tier, role, type } = this.props;

    let emailGroup = (tier) ? tier.slug : 'all';
    if (type) {
      emailGroup = pluralize(type, 2).toLowerCase();
    }

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }
    if (!data.allMembers) {
      return (<div />);
    }
    const members = [...data.allMembers];
    if (members.length === 0) {
      return (<div />)
    }

    members.sort((a, b) => b.stats.totalDonations - a.stats.totalDonations);
    const size = members.length > 50 ? "small" : "large";
    let viewMode = (type && type.split(',')[0]) || "USER";
    if (tier && tier.name.match(/sponsor/i)) {
      viewMode = "ORGANIZATION";
    }
    const limit = this.props.limit || MEMBERS_PER_PAGE * 2;
    return (
      <div className="MembersContainer" ref={(node) => this.node = node}>
        <style jsx>{`
          .MembersContainer :global(.loadMoreBtn) {
            margin: 1rem;
            text-align: center;
          }
          .filter {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }
          :global(.filterBtnGroup) {
            width: 100%;
          }
          :global(.filterBtn) {
            width: 33%;
          }
          .Members {
            display: flex;
            flex-wrap: wrap;
            flex-direction: row;
            justify-content: center;   
            overflow: hidden;
            margin: 1rem 0;
          }
        `}</style>
        <style jsx global>{`
          .cardsList .Member.ORGANIZATION {
            margin: 1rem !important;
          }
          .cardsList .Member.USER {
            margin: 0.5rem 0.25rem;
          }
        `}</style>

        { !role && !tier &&
          <div className="filter">
            <ButtonGroup className="filterBtnGroup">
              <Button className="filterBtn" bsStyle={!this.state.role ? 'primary' : 'default'} onClick={() => this.refetch()}>
                <FormattedMessage id='members.all' defaultMessage='all' />
              </Button>
              <Button className="filterBtn" bsStyle={this.state.role === 'ADMIN' ? 'primary' : 'default'} onClick={() => this.refetch('ADMIN')}>
                <FormattedMessage id='members.admin' defaultMessage='administrators' />
              </Button>
              <Button className="filterBtn" bsStyle={this.state.role === 'MEMBER' ? 'primary' : 'default'} onClick={() => this.refetch('MEMBER')}>
                <FormattedMessage id='members.members' defaultMessage='members' />
              </Button>
              <Button className="filterBtn" bsStyle={this.state.role === 'BACKER' ? 'primary' : 'default'} onClick={() => this.refetch('BACKER')}>
                <FormattedMessage id='members.paid' defaultMessage='backers' />
              </Button>
            </ButtonGroup>
          </div>
        }

        <div className="Members cardsList">
          {members.map((member) =>
            <Member
              key={member.id}
              member={member}
              className={`${this.props.className} ${size}`}
              collective={collective}
              viewMode={viewMode}
              LoggedInUser={LoggedInUser}
              />
          )}
        </div>
        { members.length % 10 === 0 && members.length >= limit &&
          <div className="loadMoreBtn">
            <Button bsStyle='default' onClick={this.fetchMore}>
              {this.state.loading && <FormattedMessage id='loading' defaultMessage='loading' />}
              {!this.state.loading && <FormattedMessage id='loadMore' defaultMessage='load more' />}
            </Button>
          </div>
        }
      </div>
    );
  }

}

const getMembersQuery = gql`
query Members($CollectiveId: Int!, $TierId: Int, $role: String, $type: String, $limit: Int, $offset: Int, $orderBy: String) {
  allMembers(CollectiveId: $CollectiveId, TierId: $TierId, role: $role, type: $type, limit: $limit, offset: $offset, orderBy: $orderBy) {
    id
    role
    createdAt
    stats {
      totalDonations
    }
    tier {
      id
      name
    }
    member {
      id
      type
      name
      company
      description
      slug
      image
      backgroundImage
      website
    }
  }
}
`;

export const addMembersData = graphql(getMembersQuery, {
  options(props) {
    return {
      variables: {
        CollectiveId: props.collective.id,
        TierId: props.tier && props.tier.id,
        offset: 0,
        type: props.type,
        role: props.role,
        orderBy: props.orderBy,
        limit: props.limit || MEMBERS_PER_PAGE * 2
      }
    }
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allMembers.length,
          limit: MEMBERS_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allMembers: [...previousResult.allMembers, ...fetchMoreResult.allMembers]
          })
        }
      })
    }
  })  
});


export default addMembersData(withIntl(MembersWithData));