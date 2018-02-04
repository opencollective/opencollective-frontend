import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql, compose } from 'react-apollo'
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'
import SmallButton from './SmallButton';
import { get } from 'lodash';

class PublishUpdateBtn extends React.Component {

  static propTypes = {
    id: PropTypes.number.isRequired
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { id } = this.props;
    await this.props.publishUpdate(id);
  }

  render() {
    const update = this.props.data.Update;

    return (
      <div className="PublishUpdateBtn">
        <SmallButton className="publish" bsStyle="success" onClick={this.onClick}><FormattedMessage id="update.publish.btn" defaultMessage="publish" /></SmallButton>
        <FormattedMessage id="update.publish.backers" defaultMessage={`Your update will be sent to {n} backers`} values={{ n: get(update, 'collective.stats.backers.all') }} />
      </div>
    );
  }

}

const publishUpdateQuery = gql`
mutation publishUpdate($id: Int!) {
  publishUpdate(id: $id) {
    id
    publishedAt
  }
}
`;

const getUpdateQuery = gql`
  query Update($id: Int!) {
    Update(id: $id) {
      id
      collective {
        id
        stats {
          id
          backers {
            all
          }
        }
      }
    }
  }
`;

export const addGetUpdate = graphql(getUpdateQuery);

const addMutation = graphql(publishUpdateQuery, {
  props: ( { mutate }) => ({
    publishUpdate: async (id) => {
      return await mutate({ variables: { id } })
    }
  })
});

const addGraphQL = compose(addMutation, addGetUpdate);

export default addGraphQL(withIntl(PublishUpdateBtn));