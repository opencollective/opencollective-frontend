import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { ButtonGroup, Button, Nav, NavItem, Badge } from 'react-bootstrap';

class CollectivePickerWithData extends React.Component {

  static propTypes = {
    hostCollectiveSlug: PropTypes.string.isRequired,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(CollectiveId) {
    console.log(">>> CollectivePicker: ", CollectiveId);
    this.props.onChange(CollectiveId);
  }

  render() {
    const { data: { error, Collective } } = this.props;
    console.log(">>> data: ", this.props.data);
    if (error) {
      console.error("graphql error>>>", error.message);
      return (<Error message="GraphQL error" />)
    }

    const collectives = Collective.collectives;
    console.log(">>> collectives", collectives);
    return (
      <div className="CollectivesContainer">

      { collectives.length > 0 &&
        <div className="collectivesFilter">
          <Nav bsStyle="pills" activeKey={null} onSelect={this.onChange}>
            <NavItem eventKey={null} title={"show all expenses across all collectives"}>
              all
            </NavItem>
            { Object.keys(collectives).map(slug => (
              <NavItem eventKey={slug} title={collectives[slug].name}>
                {slug}
                <Badge pullRight={true} >{collectives[slug].expenses.length}</Badge>
              </NavItem>
            ))}
          </Nav>
        </div>
      }
      </div>
    );
  }
}

const getCollectivesQuery = gql`
query Collective($hostCollectiveSlug: String!) {
  Collective(slug: $hostCollectiveSlug) {
    id
    collectives {
      id
      slug
      name
      stats {
        id
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