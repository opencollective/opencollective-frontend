import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';

import { addCollectiveCoverData } from '../lib/graphql/queries';
import { isUrl, prettyUrl } from '../lib/utils';

import Page from '../components/Page';
import LinkCollective from '../components/LinkCollective';
import { H2 } from '../components/Text';
import Logo from '../components/Logo';
import { FormattedMessage } from 'react-intl';
import MessageBox from '../components/MessageBox';
import Container from '../components/Container';

class HostTermsPage extends React.Component {
  static getInitialProps({ query: { hostCollectiveSlug } }) {
    return { slug: hostCollectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string,
    data: PropTypes.object,
  };

  componentDidMount() {
    if (isUrl(this.props.data.Collective.settings.tos)) {
      window.location.search = `redirect=${prettyUrl(this.props.data.Collective.settings.tos)}`;
    }
  }

  render() {
    const { data } = this.props;
    const host = data.Collective || {};

    if (data.loading) {
      return null;
    }
    if (isUrl(host.settings.tos)) {
      return null;
    } else {
      return (
        <Page collective={host} title={host.name || 'TOS'}>
          <Container pt={[4, 5]} mb={4}>
            <Flex alignItems="center" flexDirection="column" mx="auto" width="100%" maxWidth={320}>
              <LinkCollective collective={host}>
                <Logo collective={host} className="logo" height="10rem" style={{ margin: '0 auto' }} />
                <H2 as="h1" color="black.900" textAlign="center">
                  <FormattedMessage
                    id="host.tos.title"
                    defaultMessage="{collective} - Terms of fiscal sponsorship."
                    values={{ collective: host.name }}
                  />
                </H2>
              </LinkCollective>
            </Flex>
          </Container>
          <Container>
            {!host.settings.tos ? (
              <Flex px={2} py={5} justifyContent="center">
                <MessageBox type="info">
                  <FormattedMessage id="host.tos.missing" defaultMessage="This host didn't specify any TOS." />
                </MessageBox>
              </Flex>
            ) : (
              <Flex px={2} py={5} justifyContent="center">
                <MessageBox type="white">{host.settings.tos}</MessageBox>
              </Flex>
            )}
          </Container>
        </Page>
      );
    }
  }
}

export default addCollectiveCoverData(HostTermsPage);
