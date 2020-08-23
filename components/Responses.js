import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import styled from 'styled-components';

import Response from './Response';

const ResponsesContainer = styled.div`
  width: 100%;
  display: inline-block;

  .innerResponses {
    margin: 3rem auto;
    max-width: 960px;
  }
`;

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
      <ResponsesContainer>
        <div className="innerResponses">
          {responses.map(response => (
            <Response key={`${get(response, 'user.id', 0)}-${response.createdAt}`} response={response} />
          ))}
        </div>
      </ResponsesContainer>
    );
  }
}

export default Responses;
