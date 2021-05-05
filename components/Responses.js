import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import Container from './Container';
import Response from './Response';

class Responses extends React.Component {
  static propTypes = {
    responses: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  render() {
    const { responses } = this.props;
    if (!responses || responses.length === 0) {
      return <div />;
    }
    return (
      <Container width="100%" display="inline-block">
        <Container margin="3rem auto" maxWidth="960px">
          {responses.map(response => (
            <Response key={`${get(response, 'user.id', 0)}-${response.createdAt}`} response={response} />
          ))}
        </Container>
      </Container>
    );
  }
}

export default Responses;
