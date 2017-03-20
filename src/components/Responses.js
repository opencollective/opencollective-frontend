import React from 'react';
import Response from './Response';

class Responses extends React.Component {

  static propTypes = {
    responses: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  }

  render() {
    return (
      <div className="Responses" >
        <style jsx>{`
        .Responses {
          max-width: 640px;
          margin: 3rem auto 3rem;
        }
        `}</style>
        {this.props.responses.map((response, index) =>
          <Response key={`response${index}`} response={response} />
        )}
      </div>
    )
  }

}

export default Responses;