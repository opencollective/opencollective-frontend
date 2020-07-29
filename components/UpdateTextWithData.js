import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { get } from 'lodash';

class UpdateText extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired, // update.id
    data: PropTypes.object,
    mode: PropTypes.string,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const {
      data: { Update },
    } = this.props;
    const html = get(Update, 'html');

    if (!html) {
      return <div />;
    }

    return (
      <div className={`UpdateText ${this.props.mode}`}>
        <div
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      </div>
    );
  }
}

const updateTextQuery = gql`
  query UpdateText($id: Int) {
    Update(id: $id) {
      id
      html
      userCanSeeUpdate
      collective {
        name
      }
    }
  }
`;

const addUpdateTextData = graphql(updateTextQuery);

export default addUpdateTextData(UpdateText);
