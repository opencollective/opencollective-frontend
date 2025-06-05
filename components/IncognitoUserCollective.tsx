import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import Footer from './navigation/Footer';
import { IncognitoAvatar } from './Avatar';
import Body from './Body';
import { Flex } from './Grid';
import Header from './Header';
import { H1 } from './Text';

class IncognitoUserCollective extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'incognito.title': { id: 'UserCollective.incognito.title', defaultMessage: 'Incognito user' },
      'incognito.description': {
        id: 'UserCollective.incognito.description',
        defaultMessage: 'This user has decided to remain incognito',
      },
    });
  }

  render() {
    const { intl, collective } = this.props;

    return (
      <div className="UserCollectivePage">
        <Header
          title={intl.formatMessage(this.messages['incognito.title'])}
          description={intl.formatMessage(this.messages['incognito.description'])}
          collective={{ collective }}
          noRobots
        />

        <Body>
          <Flex justifyContent="center" alignItems="center" flexDirection="column" my={4}>
            <IncognitoAvatar />
            <H1 fontSize="1.25rem">{intl.formatMessage(this.messages['incognito.title'])}</H1>
            <p>{intl.formatMessage(this.messages['incognito.description'])}</p>
            <p>¯\_(ツ)_/¯</p>
          </Flex>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default injectIntl(IncognitoUserCollective);
