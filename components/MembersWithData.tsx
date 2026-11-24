import React from 'react';
import type { DataValue } from '@apollo/client/react/hoc';
import { graphql } from '@apollo/client/react/hoc';
import { clsx } from 'clsx';
import { uniqBy } from 'lodash-es';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import { gql } from '../lib/graphql/helpers';
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

/** Shape consumed by `Member` and `CollectiveCard`, built from the v2 members nodes */
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
    imageUrl?: string;
    backgroundImage?: string;
    isIncognito?: boolean;
  };
};

type V2MemberNode = {
  id: string;
  role: string;
  createdAt: string;
  tier?: { id: string; name?: string } | null;
  totalDonations: { valueInCents: number };
  account?: {
    id: string;
    type: string;
    name?: string;
    description?: string;
    slug?: string;
    imageUrl?: string;
    backgroundImageUrl?: string;
    isIncognito?: boolean;
    company?: string;
  } | null;
};

type MembersQueryVariables = {
  collectiveSlug: string;
  role?: string[];
  accountType?: string[];
  limit?: number;
  offset?: number;
  orderByTotalContributed?: 'DESC' | 'ASC';
};

type MembersQueryData = {
  account?: { id: string; name?: string; members: { totalCount?: number; nodes: V2MemberNode[] } } | null;
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

// Map the v2 member to the shape the cards expect (v2 INDIVIDUAL is USER for them)
const toMemberNode = (node: V2MemberNode): MemberNode => ({
  id: node.id,
  role: node.role,
  createdAt: node.createdAt,
  tier: node.tier,
  stats: { totalDonations: node.totalDonations.valueInCents },
  member: {
    id: node.account.id,
    type: node.account.type === 'INDIVIDUAL' ? 'USER' : node.account.type,
    name: node.account.name,
    company: node.account.company,
    description: node.account.description,
    slug: node.account.slug,
    imageUrl: node.account.imageUrl,
    backgroundImage: node.account.backgroundImageUrl,
    isIncognito: node.account.isIncognito,
  },
});

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
    if (!data.account?.members?.nodes) {
      return <div />;
    }
    let members = data.account.members.nodes.filter(node => node?.account).map(toMemberNode);
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
        return (a.member.name || '').localeCompare(b.member.name || '');
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

const membersQuery = gql`
  query BannerMembers(
    $collectiveSlug: String!
    $role: [MemberRole]
    $accountType: [AccountType]
    $limit: Int!
    $offset: Int!
    $orderByTotalContributed: OrderDirection
  ) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      members(
        role: $role
        accountType: $accountType
        limit: $limit
        offset: $offset
        orderByTotalContributed: $orderByTotalContributed
      ) {
        totalCount
        nodes {
          id
          role
          createdAt
          tier {
            id
            name
          }
          totalDonations {
            valueInCents
          }
          account {
            id
            type
            name
            slug
            description
            imageUrl
            backgroundImageUrl
            isIncognito
            ... on Individual {
              company
            }
          }
        }
      }
    }
  }
`;

const addMembersData = graphql<OwnProps, MembersQueryData, MembersQueryVariables>(membersQuery, {
  options: props => ({
    variables: {
      collectiveSlug: props.collective.slug,
      offset: 0,
      accountType: props.type ? props.type.split(',').map(type => (type === 'USER' ? 'INDIVIDUAL' : type)) : undefined,
      role: props.memberRole ? [props.memberRole] : undefined,
      orderByTotalContributed: props.orderBy === 'totalDonations' ? 'DESC' : undefined,
      limit: props.limit || MEMBERS_PER_PAGE * 2,
    },
  }),
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.account.members.nodes.length,
          limit: MEMBERS_PER_PAGE,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult?.account) {
            return previousResult;
          }
          return {
            ...previousResult,
            account: {
              ...previousResult.account,
              members: {
                ...previousResult.account.members,
                nodes: [...previousResult.account.members.nodes, ...fetchMoreResult.account.members.nodes],
              },
            },
          };
        },
      });
    },
  }),
});

export default addMembersData(MembersWithData);
