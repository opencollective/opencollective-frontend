import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import Container from './Container';
import { H2, P } from './Text';
import Link from './Link';

const CoverSmallCTA = styled.span`
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
      'hosts.findOutMoreLink': {
        id: 'hosts.description.findOutMoreLink',
        defaultMessage: 'Find out more about becoming an Open Collective Host.',
      },
    });
  }

  error(msg) {
    this.setState({ result: { error: msg } });
  }

  resetError() {
    this.error();
  }

  render() {
    const { title, intl } = this.props;
    const findOutMoreMessage = intl.formatMessage(this.messages['hosts.findOutMoreLink']);
    const findOutMoreLink = (
      <CoverSmallCTA>
        <Link route="https://docs.opencollective.com/help/hosts/become-host">{findOutMoreMessage}</Link>
      </CoverSmallCTA>
    );
    const description = (
      <FormattedMessage
        id="hosts.description"
        defaultMessage="Hosts are legal entities that collect money on behalf of open collectives so that they don't have to worry about accounting, taxes, etc. Some also provide extra services. {findOutMoreLink}"
        values={{ findOutMoreLink }}
      />
    );

    return (
      <React.Fragment>
        <Container mt={4} mb={4} display="flex" justifyContent="center">
          <H2>{title}</H2>
        </Container>
        <Container display="flex" justifyContent="center">
          <P>{description}</P>
        </Container>
      </React.Fragment>
    );
  }
}

export default injectIntl(HostsCover);
