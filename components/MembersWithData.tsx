import React from 'react';
import type { DataValue } from '@apollo/client/react/hoc';
import { graphql } from '@apollo/client/react/hoc';
import { clsx } from 'clsx';
import { uniqBy } from 'lodash-es';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import { API_V1_CONTEXT, gqlV1 } from '../lib/graphql/helpers';
import type { Currency } from '../lib/graphql/types/v2/graphql';
import type LoggedInUser from '../lib/LoggedInUser';

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

/** Hand-written shape for the V1 members query (V1 is not covered by codegen, see #4054) */
type MemberNode = {
  id?: string;
  role?: string;
  createdAt?: string;
  collective?: { id?: number | string; name?: string };
  stats?: { totalDonations?: number };
  tier?: { id?: string; name?: string };
  member?: {
    id?: string;
    type?: string;
    name?: string;
    company?: string;
    description?: string;
    slug?: string;
    website?: string;
    imageUrl?: string;
    backgroundImage?: string;
    isIncognito?: boolean;
  };
};

type MembersQueryVariables = {
  collectiveSlug: string;
  role?: string;
  type?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
};

type MembersQueryData = {
  allMembers?: MemberNode[];
  error?: { message?: string };
  fetchMore: (options: {
    variables: { offset: number; limit: number };
    updateQuery: (
      previousResult: MembersQueryData,
      options: { fetchMoreResult?: MembersQueryData },
    ) => MembersQueryData;
  }) => Promise<unknown>;
};

type OwnProps = {
  collective?: {
    id?: number | string;
    slug: string;
    name?: string;
    type?: string;
    currency?: Currency;
  };
  tier?: { name?: string };
  limit?: number;
  onChange?: (info: { height: number }) => void;
  LoggedInUser?: LoggedInUser;
  className?: string;
  memberRole?: string;
  type?: string;
  orderBy?: string;
};

type Props = OwnProps & {
  data?: DataValue<MembersQueryData, MembersQueryVariables>;
  fetchMore?: () => Promise<unknown>;
};

type State = {
  role?: string;
  loading: boolean;
};

class MembersWithData extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      role: null,
      loading: false,
    };
  }

  componentDidMount() {
    this.onChange();
  }

  node: HTMLDivElement;

  onChange = () => {
    const { onChange } = this.props;
    if (onChange && this.node) {
      onChange({ height: this.node.offsetHeight });
    }
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
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return a.collective.name.localeCompare(b.collective.name);
      }
    });

    // Make sure we display unique members
    // that should ultimately be addressed on the API side
    members = uniqBy(members, member => member.member.id);

    const size = members.length > 50 ? 'small' : 'large';
    let viewMode = (type && type.split(',')[0]) || 'USER';
    if (tier && tier.name.match(/sponsor/i)) {
      viewMode = 'ORGANIZATION';
    }
    const limit = this.props.limit || MEMBERS_PER_PAGE * 2;
    return (
      <MembersContainer
        ref={node => {
          this.node = node;
        }}
      >
        <Container
          className="cardsList"
          display="flex"
          flexWrap="wrap"
          flexDirection="row"
          justifyContent="center"
          overflow="hidden"
          margin="0.65rem 0"
        >
          {members.map(member => (
            <Member
              key={member.id}
              member={member}
              className={clsx(this.props.className, size)}
              collective={collective}
              viewMode={viewMode}
              LoggedInUser={LoggedInUser}
            />
          ))}
        </Container>
        {members.length % 10 === 0 && members.length >= limit && (
          <Container margin="0.65rem" textAlign="center">
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

const membersQuery = gqlV1 /* GraphQL */ `
  query Members($collectiveSlug: String!, $role: String, $type: String, $limit: Int, $offset: Int, $orderBy: String) {
    allMembers(
      collectiveSlug: $collectiveSlug
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
        id
        name
      }
      stats {
        id
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

const addMembersData = graphql<OwnProps, MembersQueryData, MembersQueryVariables>(membersQuery, {
  options: props => ({
    context: API_V1_CONTEXT,
    variables: {
      collectiveSlug: props.collective.slug,
      offset: 0,
      type: props.type,
      role: props.memberRole,
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
