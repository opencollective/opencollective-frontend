import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';
import { Email } from 'styled-icons/material/Email';
import { getBaseApiUrl } from '../lib/utils';
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
    return { email: query.email, slug: query.slug, type: query.type, token: query.token };
  }
  static propTypes = {
    /** Unsubscription email, given in URL */
    email: PropTypes.string.isRequired,
    /** Unsubscription slug, given in URL */
    slug: PropTypes.string.isRequired,
    /** Unsubscription type, given in URL */
    type: PropTypes.string.isRequired,
    /** Unsubscription token, given in URL */
    token: PropTypes.string.isRequired,
  };
  constructor(props) {
    super(props);
    this.state = {
      state: 'white',
    };
  }
  async componentDidMount() {
    let state, errorMessage, response;
    await fetch(
      `${getBaseApiUrl()}/services/email/unsubscribe/${this.props.email}/${this.props.slug}/${this.props.type}/${
        this.props.token
      }`,
    ).then(res => {
      response = res.json();
    });
    response.then(res => {
      if (res.error) {
        state = 'error';
        errorMessage = res.error.message;
      } else {
        state = 'success';
      }
      this.setState({ state: state, errorMessage: errorMessage });
    });
  }
  getIconColor(state) {
    if (state === 'success') {
      return '#00A34C';
    } else if (state === 'error') {
      return '#CC1836';
    }
  }
  getFormattedMessageAttrs(state) {
    if (state === 'success') {
      return { id: 'unsubscribe.sucess', defaultMessage: "You've unsubscribed successfully !" };
    } else if (state === 'white') {
      return { id: 'unsubscribe.white', defaultMessage: 'Unsubscribing your email...' };
    } else {
      return { id: 'unsubscribe.error', defaultMessage: this.state.errorMessage };
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
            <Email size={42} color={this.getIconColor(this.state.state)} />
          </Box>
          <MessageBox mb={3} type={this.state.state} withIcon>
            <FormattedMessage {...this.getFormattedMessageAttrs(this.state.state)} />
          </MessageBox>
        </Container>
      </Page>
    );
  }
}

export default withIntl(withUser(UnsubscribeEmail));
