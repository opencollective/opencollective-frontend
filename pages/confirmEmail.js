import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { Box } from '@rebass/grid';

import { Email } from '@styled-icons/material/Email';

import Page from '../components/Page';
import MessageBox from '../components/MessageBox';
import Container from '../components/Container';
import { withUser } from '../components/UserProvider';

/**
 * Main contribution flow entrypoint. Render all the steps from contributeAs
 * to payment.
 */
class ConfirmEmailPage extends React.Component {
  static getInitialProps({ query }) {
    return { token: query.token };
  }

  static propTypes = {
    /** Token to validate, given in URL */
    token: PropTypes.string.isRequired,
    // from graphql
    confirmUserEmail: PropTypes.func.isRequired,
    // from withUser
    loadingLoggedInUser: PropTypes.bool.isRequired,
    // from withUser
    refetchLoggedInUser: PropTypes.func.isRequired,
  };

  state = { status: 'submitting', error: null, validationTriggered: false };

  componentDidMount() {
    if (!this.props.loadingLoggedInUser) {
      return this.triggerEmailValidation();
    }
  }

  componentDidUpdate() {
    if (!this.state.validationTriggered && !this.props.loadingLoggedInUser) {
      return this.triggerEmailValidation();
    }
  }

  /**
   * The reason for the logic arround the trigger of this function is that `refetchLoggedInUser`
   * will not be effective if user is already loading (Apollo discards duplicate queries).
   */
  async triggerEmailValidation() {
    try {
      this.setState({ validationTriggered: true });
      await this.props.confirmUserEmail(this.props.token);
      setTimeout(this.props.refetchLoggedInUser, 3000);
      this.setState({ status: 'success' });
    } catch (e) {
      const error = get(e, 'graphQLErrors.0') || e;
      this.setState({ status: 'error', error: error });
    }
  }

  getIconColor(status) {
    if (status === 'submitting') {
      return '#3385FF';
    } else if (status === 'error') {
      return '#CC1836';
    } else {
      return '#00A34C';
    }
  }

  render() {
    const { status, error } = this.state;

    return (
      <Page title="Email confirmation">
        <Container
          display="flex"
          py={[5, 6]}
          px={2}
          flexDirection="column"
          alignItems="center"
          background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
        >
          <Box my={3}>
            <Email size={42} color={this.getIconColor(status)} />
          </Box>
          {status === 'submitting' && (
            <MessageBox type="info" isLoading>
              <FormattedMessage id="confirmEmail.validating" defaultMessage="Validating your new email" />
            </MessageBox>
          )}
          {status === 'success' && (
            <MessageBox mb={3} type="success" withIcon>
              <FormattedMessage id="confirmEmail.sucess" defaultMessage="Your email has been changed" />
            </MessageBox>
          )}
          {status === 'error' && (
            <MessageBox type="error" withIcon>
              {error.name === 'InvalidToken' ? (
                <FormattedMessage
                  id="confirmEmail.error.InvalidToken"
                  defaultMessage="The confirmation link is invalid or has expired"
                />
              ) : (
                error.message
              )}
            </MessageBox>
          )}
        </Container>
      </Page>
    );
  }
}

export const addConfirmUserEmailMutation = graphql(
  gql`
    mutation confirmUserEmail($token: String!) {
      confirmUserEmail(token: $token) {
        id
        email
        emailWaitingForValidation
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      confirmUserEmail: token => {
        return mutate({ variables: { token } });
      },
    }),
  },
);

export default addConfirmUserEmailMutation(withUser(ConfirmEmailPage));
