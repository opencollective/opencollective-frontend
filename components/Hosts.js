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
    });
  }

  render() {
    const { LoggedInUser, intl } = this.props;

    const title = intl.formatMessage(this.messages['hosts.title']);

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
                defaultMessage="<FiscalHostingLink>Fiscal Hosts</FiscalHostingLink> hold money on behalf of Collectives, taking care of accounting, taxes, invoices, etc. Some also provide extra services. <FindOutMoreLink>Find out more</FindOutMoreLink> about <BecomingAHostLink>becoming a Fiscal Host</BecomingAHostLink>."
                values={{
                  FiscalHostingLink: msg => (
                    <CoverSmallCTA>
                      <Link href="/fiscal-hosting">{msg}</Link>
                    </CoverSmallCTA>
                  ),
                  FindOutMoreLink: msg => (
                    <CoverSmallCTA>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host"
                      >
                        {msg}
                      </a>
                    </CoverSmallCTA>
                  ),
                  BecomingAHostLink: msg => (
                    <CoverSmallCTA>
                      <Link href="/become-a-host">{msg}</Link>
                    </CoverSmallCTA>
                  ),
                }}
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
