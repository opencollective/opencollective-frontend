import React from 'react';
import Response from './Response';
import colors from '../constants/colors';
import '../css/Responses.css';

class Responses extends React.Component {

  static propTypes = {
    responses: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  }

  render() {
    return (
      <div className="Responses" >
        {this.props.responses.map((response, index) =>
          <Response key={`response${index}`} response={response} />
        )}
      </div>
    )
  }

}

export default Responses;