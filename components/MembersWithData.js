import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import classNames from 'classnames';
import { uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from './Container';
import Error from './Error';
import Member from './Member';
import StyledButton from './StyledButton';

const MEMBERS_PER_PAGE = 10;

const MembersContainer = styled.div`
  .filterBtnGroup {
    width: 100%;
  }

  .filterBtn {
    width: 33%;
  }
`;

class MembersWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    tier: PropTypes.object,
    limit: PropTypes.number,
    onChange: PropTypes.func,
    LoggedInUser: PropTypes.object,
    fetchMore: PropTypes.func.isRequired,
    className: PropTypes.string,
    data: PropTypes.object,
    role: PropTypes.string,
    type: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      role: null,
      loading: false,
    };
  }

  componentDidMount() {
    this.onChange();
  }

  onChange = () => {
    const { onChange } = this.props;
    onChange && this.node && onChange({ height: this.node.offsetHeight });
  };

  fetchMore = e => {
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
      this.onChange();
    });
  };

  render() {
    const { data, LoggedInUser, collective, tier, type } = this.props;

    if (data.error) {
      return <Error message={data.error.message} />;
    }
    if (!data.allMembers) {
      return <div />;
    }
    let members = [...data.allMembers];
    if (members.length === 0) {
      return <div />;
    }

    // sort by totalDonations, then createdAt date, then alphabetically
    // it's important to have a consistent sorting across environments and browsers
    members.sort((a, b) => {
      if (b.stats.totalDonations !== a.stats.totalDonations) {
        return b.stats.totalDonations - a.stats.totalDonations;
      } else if (a.createdAt !== b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        return a.collective.name.localeCompare(b.collective.name);
      }
    });

    // Make sure we display unique members
    // that should ultimately be addressed on the API side
    members = members.filter(member => member.role !== 'FUNDRAISER');
    members = uniqBy(members, member => member.member.id);

    const size = members.length > 50 ? 'small' : 'large';
    let viewMode = (type && type.split(',')[0]) || 'USER';
    if (tier && tier.name.match(/sponsor/i)) {
      viewMode = 'ORGANIZATION';
    }
    const limit = this.props.limit || MEMBERS_PER_PAGE * 2;
    return (
      <MembersContainer ref={node => (this.node = node)}>
        <Container
          className="cardsList"
          display="flex"
          flexWrap="wrap"
          flexDirection="row"
          justifyContent="center"
          overflow="hidden"
          margin="1rem 0"
        >
          {members.map(member => (
            <Member
              key={member.id}
              member={member}
              className={classNames(this.props.className, size)}
              collective={collective}
              viewMode={viewMode}
              LoggedInUser={LoggedInUser}
            />
          ))}
        </Container>
        {members.length % 10 === 0 && members.length >= limit && (
          <Container margin="1rem" textAlign="center">
            <StyledButton onClick={this.fetchMore}>
              {this.state.loading && <FormattedMessage id="loading" defaultMessage="loading" />}
              {!this.state.loading && <FormattedMessage id="loadMore" defaultMessage="load more" />}
            </StyledButton>
          </Container>
        )}
      </MembersContainer>
    );
  }
}

const membersQuery = gql`
  query Members(
    $collectiveSlug: String!
    $TierId: Int
    $role: String
    $type: String
    $limit: Int
    $offset: Int
    $orderBy: String
  ) {
    allMembers(
      collectiveSlug: $collectiveSlug
      TierId: $TierId
      role: $role
      type: $type
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      id
      role
      createdAt
      collective {
        name
      }
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
        website
        imageUrl
        backgroundImage
        isIncognito
      }
    }
  }
`;

export const addMembersData = graphql(membersQuery, {
  options: props => ({
    variables: {
      collectiveSlug: props.collective.slug,
      TierId: props.tier && props.tier.id,
      offset: 0,
      type: props.type,
      role: props.role,
      orderBy: props.orderBy,
      limit: props.limit || MEMBERS_PER_PAGE * 2,
    },
  }),
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allMembers.length,
          limit: MEMBERS_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allMembers: [...previousResult.allMembers, ...fetchMoreResult.allMembers],
          });
        },
      });
    },
  }),
});

export default addMembersData(MembersWithData);
