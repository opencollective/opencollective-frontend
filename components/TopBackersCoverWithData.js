import React from 'react';
import PropTypes from 'prop-types';
import Error from './Error';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import Avatar from './Avatar';
import Logo from './Logo';
import Link from './Link';
import LinkCollective from './LinkCollective';
import { formatCurrency } from '../lib/utils';
import { get } from 'lodash';

class TopBackersCoverWithData extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    tier: PropTypes.object,
    limit: PropTypes.number,
    onChange: PropTypes.func,
    LoggedInUser: PropTypes.object,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.renderMember = this.renderMember.bind(this);
    this.renderUser = this.renderUser.bind(this);
    this.renderOrganization = this.renderOrganization.bind(this);
    this.state = {
      role: null,
      loading: false,
    };
  }

  renderMemberTitle(memberObj) {
    const member = memberObj.member;
    const amount = formatCurrency(memberObj.stats.totalDonations, this.props.collective.currency, { precision: 0 });

    const title = member.name;
    const subtitle = member.description ? `\n${member.description}\n` : '';
    const financialContributionTxt = `Financial contribution: ${amount}`;
    return `${title}${subtitle}\n${financialContributionTxt}`;
  }

  renderOrganization(member, index) {
    const org = member.member;

    const className = index >= 5 ? 'desktopOnly' : '';
    return (
      <div key={`topBacker-${index}`} className={className}>
        <div className="org backer">
          <style jsx>
            {`
              .org {
                border-radius: 16px;
                background: rgba(0, 0, 0, 0.5);
                padding: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .org :global(img) {
                height: auto;
                max-width: 96px;
              }
            `}
          </style>
          <LinkCollective collective={org} title={this.renderMemberTitle(member)} passHref>
            <Logo collective={org} height={36} />
          </LinkCollective>
        </div>
      </div>
    );
  }

  renderUser(member, index) {
    const user = member.member;

    const className = index >= 5 ? 'desktopOnly' : '';
    return (
      <div key={`topBacker-${index}`} className={`user backer ${className}`}>
        <LinkCollective collective={user} title={this.renderMemberTitle(member)} passHref>
          <Avatar collective={user} radius={48} size={[30, null, 48]} className="noFrame" />
        </LinkCollective>
      </div>
    );
  }

  renderMember(member, index) {
    if (member.member.type === 'ORGANIZATION') {
      return this.renderOrganization(member, index);
    }
    if (member.member.type === 'COLLECTIVE') {
      return this.renderOrganization(member, index);
    }
    if (member.member.type === 'USER') {
      return this.renderUser(member, index);
    }
  }

  render() {
    const { data, collective } = this.props;

    if (data.error) {
      return <Error message={data.error.message} />;
    }

    if (!data.allMembers) {
      return <div />;
    }
    const members = [...data.allMembers];
    if (members.length === 0) {
      return <div />;
    }
    const additionalBackers = get(collective, 'stats.backers.all') - members.length;

    return (
      <div className="TopBackersCover" ref={node => (this.node = node)}>
        <style jsx>
          {`
            .TopBackersCover {
              text-align: center;
            }
            .list {
              display: flex;
              justify-content: center;
            }
            .list :global(> div) {
              margin: 5px;
            }
            .totalBackersStat {
              border-radius: 50%;
              background-color: black;
              width: 48px;
              height: 48px;
              line-height: 48px;
              color: #ffffff;
              font-size: 12px;
              font-weight: 500;
              text-align: center;
            }
            @media (max-width: 420px) {
              .list :global(> div) {
                margin: 3px;
              }
              .totalBackersStat {
                height: 30px;
                width: 30px;
                line-height: 30px;
                font-size: 10px;
              }
            }
          `}
        </style>
        <style jsx global>
          {`
            @media (max-width: 420px) {
              .TopBackersCover {
                margin-top: 5px;
              }
              .TopBackersCover .backer {
                padding: 3px !important;
                border-radius: 8px;
              }
              .TopBackersCover .backer .Logo,
              .TopBackersCover .Logo img {
                height: 24px !important;
              }
              .TopBackersCover .backer .Avatar,
              .TopBackersCover .backer .Avatar > div {
                height: 30px !important;
                width: 30px !important;
              }
            }
          `}
        </style>
        <div className="list">
          {members.map(this.renderMember)}
          {additionalBackers > 0 && (
            <div className="backer stats">
              <Link route="#contributors">
                <div className="totalBackersStat">+{additionalBackers}</div>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
}

const getTopBackersQuery = gql`
  query getTopBackersQuery($CollectiveId: Int!, $TierId: Int, $role: String, $limit: Int, $orderBy: String) {
    allMembers(CollectiveId: $CollectiveId, TierId: $TierId, role: $role, limit: $limit, orderBy: $orderBy) {
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
        imageUrl
        isIncognito
      }
    }
  }
`;

export const addBackersData = graphql(getTopBackersQuery, {
  options(props) {
    return {
      variables: {
        CollectiveId: props.collective.id,
        TierId: props.tier && props.tier.id,
        offset: 0,
        role: 'BACKER',
        orderBy: 'totalDonations',
        limit: props.limit || 5,
      },
    };
  },
});

export default addBackersData(TopBackersCoverWithData);
