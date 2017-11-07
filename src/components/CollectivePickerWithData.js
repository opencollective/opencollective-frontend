import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { DropdownButton, MenuItem, Badge } from 'react-bootstrap';
import Currency from '../components/Currency';
import { FormattedMessage } from 'react-intl';
import ConnectPaypal from '../components/ConnectPaypal';

class CollectivePickerWithData extends React.Component {

  static propTypes = {
    hostCollectiveSlug: PropTypes.string.isRequired,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = { CollectiveId: 0, connectingPaypal: false };
    this.onChange = this.onChange.bind(this);
  }

  onChange(CollectiveId) {
    this.setState({ CollectiveId });
    this.props.onChange(CollectiveId);
  }

  renderCollectiveMenuItem(collective, className) {
    return (<div className={`MenuItem-Collective ${className}`}>
      <style jsx>{`
        .MenuItem-Collective {
          display: flex;
          width: 30rem;
          justify-content: space-between;
          align-items: center;
        }

        .MenuItem-Collective.selected {
          float: left;
          margin-right: 1rem;          
        }

        label {
          margin: 0;
        }

        .collectiveName {
          float: left;
          margin-right: 0.2rem;
        }

        .MenuItem-Collective label {
          margin-right: 0.2rem;
        }
      `}</style>
      <div className="NameBalance">
        <div className="collectiveName">{collective.name}</div>
        <div className="balance">
          (<label><FormattedMessage id="expenses.balance.label" defaultMessage="balance:" /></label>
          <Currency value={collective.stats.balance} currency={collective.currency} />)
        </div>
      </div>
      <Badge pullRight={true} >{collective.stats.expenses.pending}</Badge>
    </div>);
  }

  render() {
    const { data: { loading, error, Collective } } = this.props;

    if (error) {
      console.error("graphql error>>>", error.message);
      return (<Error message="GraphQL error" />)
    }
    if (loading || !Collective) {
      return (<div />);
    }

    const collectives = Collective.collectives;
    const selectedCollective = this.state.CollectiveId > 0 && collectives.find(c => c.id === this.state.CollectiveId);
    const selectedTitle = selectedCollective ? this.renderCollectiveMenuItem(selectedCollective, 'selected') : <div className="defaultTitle"><FormattedMessage id="expenses.allCollectives" defaultMessage="All Collectives" /></div>;
    return (
      <div className="CollectivesContainer">
        <style jsx>{`
          .submenu {
            background: #f2f4f5;
            width: 100%;
            height: 16rem;
            font-family: Rubik;
            padding: 2rem 2rem 2rem 6rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .submenu .title {
            margin: 2rem 0;
            overflow: hidden;
            display: flex;
            align-items: baseline;
          }

          .submenu .title h1 {
            font-family: Rubik;
            font-size: 3.6rem;
            margin: 0 2rem 0 0;
            font-weight: 500;
            color: #18191a;
            float: left;
          }

          .submenu .title h2 {
            font-family: Rubik;
            font-size: 2.4rem;
            margin: 0;
            font-weight: 300;
            color: #18191a;            
          }

          .collectivesFilter {
            display: flex;
          }

        `}</style>
        <style global>{`
          .CollectivesContainer .defaultTitle {
            width: 30rem;
            float: left;
            text-align: left;
          }

          .CollectivesContainer .caret {
            float: right;
            margin-top: 7px;
          }

          .right {
            float: right;
            text-align: right;
          }
        `}</style>
         <div className="submenu">
            <div className="">
              <div className="title">
                <h1><FormattedMessage id="expenses.title" defaultMessage="Finances" /></h1>
                <h2><FormattedMessage id="expenses.latest.title" defaultMessage="Latest expenses" /></h2>
              </div>
            { collectives.length > 0 &&
              <div className="collectivesFilter">
                <DropdownButton bsStyle="default" title={selectedTitle} onSelect={this.onChange}>
                  { collectives.filter(c => c.stats.expenses.pending > 0).map(collective => (
                    <MenuItem key={collective.id} eventKey={collective.id} title={collective.name}>
                    { this.renderCollectiveMenuItem(collective) }
                    </MenuItem>
                  ))}
                </DropdownButton>
              </div>
            }
            </div>
            <div className="right">
              <ConnectPaypal
                collective={Collective}
                />
            </div>
          </div>
      </div>
    );
  }
}

const getCollectivesQuery = gql`
query Collective($hostCollectiveSlug: String!) {
  Collective(slug: $hostCollectiveSlug) {
    id
    paymentMethods {
      id
      service
      createdAt
      balance
      currency
    }
    collectives {
      id
      slug
      name
      currency
      stats {
        id
        balance
        expenses {
          id
          all
          pending
          paid
          rejected
          approved
        }
      }
    }
  }
}
`;

const COLLECTIVES_PER_PAGE = 20;
export const addCollectivesData = graphql(getCollectivesQuery, {
  options(props) {
    return {
      variables: {
        hostCollectiveSlug: props.hostCollectiveSlug,
        offset: 0,
        limit: props.limit || COLLECTIVES_PER_PAGE * 2,
        includeHostedCollectives: true
      }
    }
  },
  props: ({ data }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allCollectives.length,
          limit: COLLECTIVES_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allCollectives: [...previousResult.allCollectives, ...fetchMoreResult.allCollectives]
          })
        }
      })
    }
  })  
});


export default addCollectivesData(withIntl(CollectivePickerWithData));