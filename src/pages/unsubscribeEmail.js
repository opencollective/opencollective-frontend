import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';

import { Email } from 'styled-icons/material/Email';

import withIntl from '../lib/withIntl';
import Page from '../components/Page';
import MessageBox from '../components/MessageBox';
import Container from '../components/Container';
import { withUser } from '../components/UserProvider';

/**
 * Main contribution flow entrypoint. Render all the steps from contributeAs
 * to payment.
 */
class UnsubscribeEmail extends React.Component {
  static getInitialProps({ query }) {
    return { state: query.state, email: query.email };
  }

  static propTypes = {
    /** Unsubscription state, given in URL */
    state: PropTypes.string.isRequired,
    /** Unsubscription email, given in URL */
    email: PropTypes.string.isRequired,
  };

  getIconColor(state) {
    if (state === 'success') {
      return '#00A34C';
    } else if (state === 'error') {
      return '#CC1836';
    }
  }
  getFormattedMessageAttrs(state) {
    if (state === 'success') {
      return { id: 'unsubscribe.sucess', defaultMessage: "You've unsubscribed successfully !'" };
    } else {
      return { id: 'unsubscribe.error', defaultMessage: `Cannot find a user with email "${this.props.email}"` };
    }
  }
  render() {
    return (
      <Page title="Unsubscribe Email">
        <Container
          display="flex"
          py={[5, 6]}
          px={2}
          flexDirection="column"
          alignItems="center"
          background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
        >
          <Box my={3}>
            <Email size={42} color={this.getIconColor(this.props.state)} />
          </Box>
          <MessageBox mb={3} type={this.props.state} withIcon>
            <FormattedMessage {...this.getFormattedMessageAttrs(this.props.state)} />
          </MessageBox>
        </Container>
      </Page>
    );
  }
}

export default withIntl(withUser(UnsubscribeEmail));
