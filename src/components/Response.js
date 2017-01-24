import React from 'react';
import colors from '../constants/colors';
import '../css/Response.css';

class Response extends React.Component {

  static propTypes = {
    response: React.PropTypes.object.isRequired
  }

  render() {
    const { user, tier, quantity, status, description } = this.props.response;

    return (
      <div className="Response">
        <img src={user.avatar} />
        <div className="bubble">
          <div className="name">{user.name}</div>
          <div className="description" style={{color: colors.darkgray}}>{description || user.bio}</div>
        </div>
      </div>
    )
  }

}

export default Response;