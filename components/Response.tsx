import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import Avatar from './Avatar';
import Container from './Container';
import LinkCollective from './LinkCollective';

class Response extends React.Component {
  static propTypes = {
    response: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      YES: { id: 'response.status.yes', defaultMessage: '{name} is going' },
    });
  }

  render() {
    const { intl, response } = this.props;
    const { user, description, status, count } = response;

    if (!user) {
      return <div />;
    }

    const name =
      (user.name && user.name.match(/^null/) ? null : user.name) ||
      (user.email && user.email.substr(0, user.email.indexOf('@')));

    if (!name) {
      return <div />;
    }

    const title = intl.formatMessage(this.messages[status], { name });
    return (
      <LinkCollective collective={user} title={title}>
        <Container
          display="flex"
          alignItems="center"
          width="100%"
          margin="10px"
          maxWidth="300px"
          float="left"
          position="relative"
          height="90px"
          overflow="hidden"
        >
          <Avatar collective={user} radius={40} />
          <Container padding="0.15rem 0.65rem">
            <Container fontSize="0.95rem">
              {user.isIncognito ? <FormattedMessage id="profile.incognito" defaultMessage="Incognito" /> : name}
            </Container>
            <Container fontSize="0.75rem" color="black.600">
              {description || user.description}
            </Container>
            {count > 1 && (
              <Container pt={1} fontSize="0.75rem" color="black.600">
                <FormattedMessage defaultMessage="{count} tickets" id="1qa6YU" values={{ count }} />
              </Container>
            )}
          </Container>
        </Container>
      </LinkCollective>
    );
  }
}

export default injectIntl(Response);
