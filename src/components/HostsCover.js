import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import CollectiveCover from './CollectiveCover';
import Link from './Link';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

const CoverSmallCTA = styled.div`
  a:hover {
    text-decoration: underline !important;
  }
`;

class HostsCover extends React.Component {
  static propTypes = {
    host: PropTypes.object,
    title: PropTypes.string,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'host.create.title': {
        id: 'host.create.title',
        defaultMessage: 'Become a host',
      },
      'hosts.findOutMoreLink': {
        id: 'hosts.description.findOutMoreLink',
        defaultMessage: 'Find out more about becoming an Open Collective Host.',
      },
    });
    this.collective = { type: 'COLLECTIVE' };
  }

  error(msg) {
    this.setState({ result: { error: msg } });
  }

  resetError() {
    this.error();
  }

  render() {
    const { title, intl } = this.props;
    const findOutMoreMessage = intl.formatMessage(
      this.messages['hosts.findOutMoreLink'],
    );
    const findOutMoreLink = (
      <CoverSmallCTA>
        <Link route="/faq/becoming-an-open-collective-host">
          {findOutMoreMessage}
        </Link>
      </CoverSmallCTA>
    );
    const descriptionNode = (
      <FormattedMessage
        id="hosts.description"
        defaultMessage="Hosts are legal entities that collect money on behalf of open collectives so that they don't have to worry about accounting, taxes, etc. Some also provide extra services. {findOutMoreLink}"
        values={{ findOutMoreLink }}
      />
    );

    return (
      <CollectiveCover
        href="/hosts"
        title={title}
        description={descriptionNode}
        collective={this.collective}
        className="small"
      />
    );
  }
}

export default withIntl(HostsCover);
