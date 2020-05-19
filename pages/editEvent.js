import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';

import { addEditCollectiveMutation } from '../lib/graphql/mutations';
import { compose } from '../lib/utils';

import EditCollective from '../components/edit-collective';
import ErrorPage from '../components/ErrorPage';
import { withUser } from '../components/UserProvider';

class EditEventPage extends React.Component {
  static getInitialProps({ query: { parentCollectiveSlug, eventSlug } }) {
    const scripts = { googleMaps: true }; // Used in <InputTypeLocation>
    return { parentCollectiveSlug, eventSlug, scripts };
  }

  static propTypes = {
    parentCollectiveSlug: PropTypes.string, // not used atm
    eventSlug: PropTypes.string, // for addEventCollectiveData
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    editCollective: PropTypes.func.isRequired, // from addEditCollectiveMutation
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data, loadingLoggedInUser, LoggedInUser, editCollective } = this.props;

    if (loadingLoggedInUser || !data.Collective) {
      return <ErrorPage loading={loadingLoggedInUser} data={data} />;
    }

    const event = data.Collective;
    return <EditCollective editCollective={editCollective} collective={event} LoggedInUser={LoggedInUser} />;
  }
}

const editEventPageQuery = gql`
  query EditEventPage($eventSlug: String) {
    Collective(slug: $eventSlug) {
      id
      type
      slug
      path
      createdByUser {
        id
      }
      name
      imageUrl
      backgroundImage
      description
      longDescription
      startsAt
      endsAt
      timezone
      currency
      settings
      isDeletable
      isArchived
      location {
        name
        address
        country
        lat
        long
      }
      tiers {
        id
        slug
        type
        name
        description
        amount
        amountType
        minimumAmount
        presets
        currency
        maxQuantity
        stats {
          id
          availableQuantity
        }
      }
      parentCollective {
        id
        slug
        name
        mission
        currency
        imageUrl
        backgroundImage
        settings
      }
      stats {
        id
        balance
        expenses {
          id
          all
        }
        transactions {
          id
          all
        }
      }
      members {
        id
        createdAt
        role
        member {
          id
          name
          imageUrl
          slug
          twitterHandle
          description
        }
      }
      orders {
        id
        createdAt
        quantity
        publicMessage
        fromCollective {
          id
          name
          company
          image # For Event Sponsors
          imageUrl
          slug
          twitterHandle
          description
          ... on User {
            email
          }
        }
        tier {
          id
          name
        }
      }
    }
  }
`;

const addEditEventPageData = graphql(editEventPageQuery);

const addGraphql = compose(addEditEventPageData, addEditCollectiveMutation);

export default withUser(addGraphql(EditEventPage));
