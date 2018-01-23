import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'
import SmallButton from './SmallButton';

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
    return (
      <div className="PublishUpdateBtn">
        <SmallButton className="publish" bsStyle="success" onClick={this.onClick}><FormattedMessage id="update.publish.btn" defaultMessage="publish" /></SmallButton>
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

const addMutation = graphql(publishUpdateQuery, {
  props: ( { mutate }) => ({
    publishUpdate: async (id) => {
      return await mutate({ variables: { id } })
    }
  })
});

export default addMutation(withIntl(PublishUpdateBtn));