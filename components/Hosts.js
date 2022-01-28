import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import Body from './Body';
import Container from './Container';
import Footer from './Footer';
import Header from './Header';
import HostsWithData from './HostsWithData';
import Link from './Link';
import { H1, P } from './Text';

const CoverSmallCTA = styled.span`
  a:hover {
    text-decoration: underline !important;
  }
`;

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
      'hosts.fiscalHosts': {
        defaultMessage: 'Fiscal Hosts',
      },
      'hosts.findOutMore': {
        defaultMessage: 'Find out more',
      },
      'hosts.becomingAFiscalHost': {
        defaultMessage: 'becoming a Fiscal Host.',
      },
    });
  }

  render() {
    const { LoggedInUser, intl } = this.props;

    const title = intl.formatMessage(this.messages['hosts.title']);

    const fiscalHostingMessage = intl.formatMessage(this.messages['hosts.fiscalHosts']);

    const findOutMoreMessage = intl.formatMessage(this.messages['hosts.findOutMore']);

    const becomingAHostMessage = intl.formatMessage(this.messages['hosts.becomingAFiscalHost']);

    const fiscalHostingLink = (
      <CoverSmallCTA>
        <Link href="/fiscal-hosting">{fiscalHostingMessage}</Link>
      </CoverSmallCTA>
    );

    const findOutMoreLink = (
      <CoverSmallCTA>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host"
        >
          {findOutMoreMessage}
        </a>
      </CoverSmallCTA>
    );

    const becomingAHostLink = (
      <CoverSmallCTA>
        <Link href="/become-a-host">{becomingAHostMessage}</Link>
      </CoverSmallCTA>
    );

    return (
      <Container>
        <Header title={title} twitterHandle="opencollect" className={this.state.status} LoggedInUser={LoggedInUser} />

        <Body>
          <Container mt={2} mb={2}>
            <H1 fontSize={['24px', '40px']} lineHeight={3} fontWeight="bold" textAlign="center" color="black.900">
              {title}
            </H1>
            <P textAlign="center">
              <FormattedMessage
                id="hosts.description"
                defaultMessage="{fiscalHostingLink} hold money on behalf of Collectives, taking care of accounting, taxes, invoices, etc. Some also provide extra services. {findOutMoreLink} about {becomingAHostLink}"
                values={{ fiscalHostingLink, findOutMoreLink, becomingAHostLink }}
              />
            </P>
          </Container>

          <div className="content">
            <HostsWithData LoggedInUser={LoggedInUser} />
          </div>
        </Body>
        <Footer />
      </Container>
    );
  }
}

export default injectIntl(Hosts);
