import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { get } from 'lodash';

class UpdateText extends React.Component {

  static propTypes = {
    id: PropTypes.number.isRequired // update.id
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { data: { Update } } = this.props;
    const html = get(Update, 'html');

    if (!html) {
      return (<div />);
    }

    return (
      <div className={`UpdateText ${this.props.mode}`}>
        <div
          dangerouslySetInnerHTML={{
            __html: html
          }}
          />
    </div>
    );
  }
}

const getUpdateQuery = gql`
  query Update($id: Int) {
    Update(id: $id) {
      id
      html
    }
  }
`;

export const addGetUpdate = graphql(getUpdateQuery);

export default addGetUpdate(withIntl(UpdateText));
