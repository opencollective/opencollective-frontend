import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import colors from '../lib/constants/colors';

import Avatar from './Avatar';

const star = '/static/images/icons/star.svg';

class Response extends React.Component {
  static propTypes = {
    response: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      INTERESTED: {
        id: 'response.status.interested',
        defaultMessage: '{name} is interested',
      },
      YES: { id: 'response.status.yes', defaultMessage: '{name} is going' },
    });
  }

  render() {
    const { intl, response } = this.props;
    const { user, description, status } = response;

    const name =
      (user.name && user.name.match(/^null/) ? null : user.name) ||
      (user.email && user.email.substr(0, user.email.indexOf('@')));

    if (!name) return <div />;

    const linkTo = `/${user.slug}`;
    const title = intl.formatMessage(this.messages[status], { name });

    return (
      <a href={linkTo} title={title}>
        <div>
          <style jsx>
            {`
              .Response {
                display: flex;
                align-items: flex-start;
                width: 100%;
                margin: 10px;
                max-width: 300px;
                min-height: 90px;
                float: left;
                position: relative;
              }

              .bubble {
                padding: 1rem;
              }

              .name {
                font-size: 1.7rem;
              }

              .description {
                font-size: 1.4rem;
              }

              .star {
                width: 14px;
                height: 14px;
                position: absolute;
                top: 45px;
                left: 0;
              }
            `}
          </style>
          <div className="Response">
            {status === 'INTERESTED' && <object title={title} type="image/svg+xml" data={star} className="star" />}
            <Avatar collective={user} radius="48px" />
            <div className="bubble">
              <div className="name">{name}</div>
              <div className="description" style={{ color: colors.darkgray }}>
                {description || user.description}
              </div>
            </div>
          </div>
        </div>
      </a>
    );
  }
}

export default injectIntl(Response);
