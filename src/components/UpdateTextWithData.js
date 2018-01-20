import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { get } from 'lodash';
import Markdown from 'react-markdown';

class UpdateText extends React.Component {

  static propTypes = {
    id: PropTypes.number.isRequired // update.id
  }

  constructor(props) {
    super(props); 
  }

  render() {
    const { data: { loading, Update }, intl } = this.props;
    const text = get(Update, 'text');

    if (!text) {
      return (<div />);
    }

    return (
      <div className={`UpdateText ${this.props.mode}`}>
        <Markdown source={text} />
      </div>
    );
  }
}

const getUpdateQuery = gql`
  query Update($id: Int!) {
    Update(id: $id) {
      id
      text
    }
  }
`;

export const addGetUpdate = graphql(getUpdateQuery);

export default addGetUpdate(withIntl(UpdateText));