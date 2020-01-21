import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import StyledUpdate from './StyledUpdate';
import NotFound from './NotFound';

class UpdateWithData extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired, // update.id
    editable: PropTypes.bool,
    data: PropTypes.object,
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data, editable, LoggedInUser } = this.props;
    if (data.loading) {
      return <div />;
    }
    const update = data.Update;
    if (!update) {
      return <NotFound />;
    }

    return (
      <div className={'UpdateWithData'}>
        <StyledUpdate
          key={update.id}
          collective={update.collective}
          update={update}
          editable={editable}
          LoggedInUser={LoggedInUser}
          compact={false}
        />
      </div>
    );
  }
}

const getUpdateQuery = gql`
  query Update($collectiveSlug: String, $updateSlug: String) {
    Update(collectiveSlug: $collectiveSlug, updateSlug: $updateSlug) {
      id
      title
      createdAt
      publishedAt
      html
      markdown
      isPrivate
      makePublicOn
      userCanSeeUpdate
      collective {
        id
        name
        slug
        settings
        stats {
          id
          backers {
            all
          }
        }
      }
      fromCollective {
        id
        slug
        name
        imageUrl
      }
    }
  }
`;

export const addGetUpdate = graphql(getUpdateQuery);

export default addGetUpdate(UpdateWithData);
