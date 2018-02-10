import React from 'react';
import PropTypes from 'prop-types';
import Response from './Response';

class Responses extends React.Component {

  static propTypes = {
    responses: PropTypes.arrayOf(PropTypes.object).isRequired
  }

  render() {
    const { responses } = this.props;
    if (!responses || responses.length === 0) return (<div />);
    return (
      <div className="Responses" >
        <style jsx>{`
        .Responses {
          width: 100%;
        }
        .innerResponses {
          margin: 3rem auto;
          max-width: 960px;
        }
        `}</style>
        <div className="innerResponses">
          {responses.map((response, index) =>
            <Response key={`response${index}`} response={response} />
          )}
        </div>
      </div>
    )
  }

}

export default Responses;