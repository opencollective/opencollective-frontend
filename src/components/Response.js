import React from 'react';
import colors from '../constants/colors';
import '../css/Response.css';
import ReactDOM from 'react-dom';

import { defineMessages, injectIntl } from 'react-intl';
import star from '../images/icons/star.svg';

import avatar1 from '../images/avatar-01.svg';
import avatar2 from '../images/avatar-02.svg';
import avatar3 from '../images/avatar-03.svg';
import avatar4 from '../images/avatar-04.svg';

const avatars = [avatar1, avatar2, avatar3, avatar4];

class Response extends React.Component {

  static propTypes = {
    response: React.PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      INTERESTED: { id: 'response.status.interested', defaultMessage: '{name} is interested' },
      YES: { id: 'response.status.yes', defaultMessage: '{name} is going' }
    });

  }

  pickAvatar(name) {
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return avatars[sum % 4];
  }

  render() {
    const { intl, response } = this.props;
    const { user, description, status } = response;

    const name = ((user.name && user.name.match(/^null/)) ? null : user.name) || user.email && user.email.substr(0, user.email.indexOf('@'));

    if (!name) return (<div/>);

    user.avatar = user.avatar || this.pickAvatar(name);

    const linkTo = `https://opencollective.com/${user.username}`;
    const title = intl.formatMessage(this.messages[status], { name });

    return (
      <a href={linkTo} title={title} >
        <div className="Response">
          { status === 'INTERESTED' && <object title={title} type="image/svg+xml" data={star} className="star" /> }
          <img src={user.avatar} />
          <div className="bubble">
            <div className="name">{name}</div>
            <div className="description" style={{color: colors.darkgray}}>{description || user.description}</div>
          </div>
        </div>
      </a>
    )
  }

}

export default injectIntl(Response);