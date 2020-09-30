import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';

import { addEditCollectiveMutation } from '../lib/graphql/mutations';
import { editCollectivePageFieldsFragment } from '../lib/graphql/queries';
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
    const { data, loadingLoggedInUser, editCollective } = this.props;

    if (loadingLoggedInUser || !data?.Collective) {
      return <ErrorPage loading={loadingLoggedInUser || data?.loading} data={data} />;
    }

    const event = data.Collective;
    return <EditCollective editCollective={editCollective} collective={event} />;
  }
}

const editEventPageQuery = gql`
  query EditEventPage($eventSlug: String) {
    Collective(slug: $eventSlug) {
      ...EditCollectivePageFields
      path
      createdByUser {
        id
      }
      startsAt
      endsAt
      timezone
      tiers {
        stats {
          id
          availableQuantity
        }
      }
      parentCollective {
        id
        slug
        name
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
    }
  }
  ${editCollectivePageFieldsFragment}
`;

const addEditEventPageData = graphql(editEventPageQuery, {
  skip: props => props.loadingLoggedInUser || !props.LoggedInUser,
  // The fetchPolicy is important for an edge case.
  // Same component, different collective (moving from edit to another edit through the menu)
  // Reloading data make sure we get the loading state and we re-initialize Form and sub-components
  options: { fetchPolicy: 'network-only' },
});

const addGraphql = compose(addEditEventPageData, addEditCollectiveMutation);

export default withUser(addGraphql(EditEventPage));
