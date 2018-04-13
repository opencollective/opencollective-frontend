import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { get } from 'lodash';
import Update from './Update';
import NotFound from './NotFound';

class UpdateWithData extends React.Component {

  static propTypes = {
    id: PropTypes.number.isRequired, // update.id
    editable: PropTypes.bool
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { data, intl, editable, LoggedInUser } = this.props;
    if (data.loading) return (<div />);
    const update = data.Update;
    if (!update) return (<NotFound />);

    return (
      <div className={`UpdateWithData`}>
        <Update
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
      collective {
        id
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
        image
      }
    }
  }
`;

export const addGetUpdate = graphql(getUpdateQuery);

export default addGetUpdate(withIntl(UpdateWithData));
