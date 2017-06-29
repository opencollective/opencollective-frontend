import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';

import { defineMessages, injectIntl } from 'react-intl';
import { pickAvatar } from '../lib/user.lib';

const star = '/static/images/icons/star.svg';


class Response extends React.Component {

  static propTypes = {
    response: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      INTERESTED: { id: 'response.status.interested', defaultMessage: '{name} is interested' },
      YES: { id: 'response.status.yes', defaultMessage: '{name} is going' }
    });

  }

  render() {
    const { intl, response } = this.props;
    const { user, description, status } = response;

    const name = ((user.name && user.name.match(/^null/)) ? null : user.name) || user.username || user.email && user.email.substr(0, user.email.indexOf('@'));

    if (!name) return (<div/>);

    const avatar = user.avatar || pickAvatar(name);
    const linkTo = `/${user.username}`;
    const title = intl.formatMessage(this.messages[status], { name });

    return (
      <a href={linkTo} title={title}>
        <div>
          <style jsx>{`
          .Response {
            display: flex;
            align-items: flex-start;
            width: 100%;
            margin: 10px;
            max-width: 300px;
            float: left;
            position: relative;
          }
          
          img {
            float: left;
            width: 45px;
            border-radius: 50%;
            margin-top: 1rem;
          }

          .bubble {
              padding: 1rem;
          }

          .name {
              font-family: 'montserratlight';
              font-size: 1.7rem;
          }

          .description {
            font-family: 'lato';
            font-size: 1.4rem;
          }

          .star {
            width: 14px;
            height: 14px;
            position: absolute;
            top: 45px;
            left: 0;
          }
          `}</style>
          <div className="Response">
            { status === 'INTERESTED' && <object title={title} type="image/svg+xml" data={star} className="star" /> }
            <img src={avatar} />
            <div className="bubble">
              <div className="name">{name}</div>
              <div className="description" style={{color: colors.darkgray}}>{description || user.description}</div>
            </div>
          </div>
        </div>
      </a>
    )
  }

}

export default injectIntl(Response);