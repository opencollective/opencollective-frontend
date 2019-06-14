import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import HostsWithData from './HostsWithData';
import HostsCover from './HostsCover';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';

class Hosts extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { status: 'idle', result: {} };
    this.messages = defineMessages({
      'hosts.title': {
        id: 'hosts.title',
        defaultMessage: 'Open Collective Hosts',
      },
      'hosts.description': {
        id: 'hosts.description',
        defaultMessage:
          "Hosts are legal entities that collect money on behalf of open collectives so that they don't have to worry about accounting, taxes, etc. Some also provide extra services. {findOutMoreLink}",
      },
    });
  }

  render() {
    const { LoggedInUser, intl } = this.props;

    const title = intl.formatMessage(this.messages['hosts.title']);
    const description = intl.formatMessage(this.messages['hosts.description'], {
      findOutMoreLink: '',
    });

    return (
      <div className="Hosts">
        <style jsx>
          {`
            .success {
              color: green;
            }
            .error {
              color: red;
            }
            .login {
              text-align: center;
            }
            .actions {
              text-align: center;
              margin-bottom: 5rem;
            }
          `}
        </style>

        <Header
          title={title}
          description={description}
          twitterHandle="opencollect"
          className={this.state.status}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <HostsCover title={title} description={description} href="/hosts" className="small" />

          <div className="content">
            <HostsWithData LoggedInUser={LoggedInUser} />
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withIntl(Hosts);
