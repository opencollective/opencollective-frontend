import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import Avatar from './Avatar';
import Logo from './Logo';
import Link from './Link';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { formatCurrency } from '../lib/utils';
import { get } from 'lodash';

class TopBackersCoverWithData extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    tier: PropTypes.object,
    limit: PropTypes.number,
    onChange: PropTypes.func,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.renderMember = this.renderMember.bind(this);
    this.renderUser = this.renderUser.bind(this);
    this.renderOrganization = this.renderOrganization.bind(this);
    this.state = {
      role: null,
      loading: false
    };
  }

  renderOrganization(member, index) {
    const org = member.member;
    const percentage = Math.round((member.stats.totalDonations / this.props.collective.stats.totalAmountReceived) * 100);
    let title = `${org.name}`;
    if (org.description) {
      title += `
${org.description}
`
    }
    title += `
Financial contribution: ${percentage}% (${formatCurrency(member.stats.totalDonations, this.props.collective.currency, { precision: 0 })})`;
    const className = index >= 5 ? 'desktopOnly' : '';
    return (
      <div key={`topBacker-${index}`} className={className} >
        <div className="org backer">
          <style jsx>{`
          .org {
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.5);
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .org :global(img) {
            height: auto;
            max-width: 96px;
          }
          `}</style>      
          <Link route={`/${org.slug}`} title={title}>
            <Logo src={org.image} height={36} />
          </Link>
        </div>
      </div>
    )
  }
  
  renderUser(member, index) {
    const user = member.member;

    const percentage = Math.round((member.stats.totalDonations / this.props.collective.stats.totalAmountReceived) * 100);
    let title = `${user.name}`;
    if (user.description) {
      title += `
${user.description}
`
    }
    title += `
Financial contribution: ${percentage}% (${formatCurrency(member.stats.totalDonations, this.props.collective.currency, { precision: 0 })})`;
    const className = index >= 5 ? 'desktopOnly' : '';
    return (
      <div key={`topBacker-${index}`} className={`user backer ${className}`}>
        <Link route={`/${user.slug}`} title={title}>
          <Avatar src={user.image} radius={48} className="noFrame" />
        </Link>
      </div>
    )
  }

  renderMember(member, index) {
    if (member.member.type === 'ORGANIZATION') return this.renderOrganization(member, index);
    if (member.member.type === 'USER') return this.renderUser(member, index);
  }

  render() {
    const { data, LoggedInUser, collective, tier, role, type } = this.props;

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
    const additionalBackers = get(collective, 'stats.backers.all') - members.length;
    
    return (
      <div className="TopBackersCover" ref={(node) => this.node = node}>
        <style jsx>{`
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
            color: #FFFFFF;
            font-family: Rubik;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
          }
          @media(max-width: 420px) {
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
        `}</style>
        <style jsx global>{`
        @media(max-width: 420px) {
          .TopBackersCover {
            margin-top: 5px;
          }
          .TopBackersCover .backer {
            padding: 3px !important;
            border-radius: 8px;
          }
          .TopBackersCover .backer .Logo, .TopBackersCover .Logo img {
            height: 24px !important;
          }
          .TopBackersCover .backer .Avatar, .TopBackersCover .backer .Avatar > div {
            height: 30px !important;
            width: 30px !important;
          }
        }
        `}</style>
        <div className="list">
          {members.map(this.renderMember)}
          { additionalBackers > 0 &&
            <div className="backer stats">
              <Link route="#contributors"><div className="totalBackersStat">+{additionalBackers}</div></Link>
            </div>
          }
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
      image
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
        role: "BACKER",
        orderBy: "totalDonations",
        limit: props.limit || 5
      }
    }
  }
});


export default addBackersData(withIntl(TopBackersCoverWithData));