import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import dynamic from 'next/dynamic';
import { withRouter } from 'next/router';
import { FormattedMessage, injectIntl } from 'react-intl';

import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import Avatar from '../components/Avatar';
import Body from '../components/Body';
import Container from '../components/Container';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Image from '../components/Image';
import MessageBox from '../components/MessageBox';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import StyledInputField from '../components/StyledInputField';
import { P } from '../components/Text';

// Dynamic imports
const PasswordStrengthBar = dynamic(() => import('react-password-strength-bar'));

class ResetPasswordPage extends React.Component {
  static getInitialProps({ query: { token } }) {
    return { token };
  }

  static propTypes = {
    /* From getInitialProps */
    token: PropTypes.string,
    /* From withRouter */
    router: PropTypes.object.isRequired,
    /* From injectIntl */
    intl: PropTypes.object.isRequired,
    /* From addResetPasswordMutation */
    resetPassword: PropTypes.func,

    /* From addResetPasswordAccountQuery */
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      /* Password management state */
      passwordLoading: false,
      passwordError: null,
      password: '',
      passwordScore: null,
    };
  }

  async submitResetPassword() {
    const { password, passwordScore } = this.state;

    if (passwordScore <= 1) {
      this.setState({
        passwordError: (
          <FormattedMessage defaultMessage="Password is too weak. Try to use more characters or use a password manager to generate a strong one." />
        ),
        showError: true,
      });
      return;
    }

    this.setState({ passwordLoading: true });

    try {
      await this.props.resetPassword({ variables: { password } });
      await this.props.router.push({ pathname: '/reset-password/completed' });
    } catch (error) {
      const errorMessage = i18nGraphqlException(this.props.intl, error);

      this.setState({ passwordError: errorMessage, showError: true, passwordLoading: false });
    }
  }

  render() {
    const { password, passwordLoading, passwordError, showError } = this.state;

    return (
      <Fragment>
        <Header
          menuItems={{ solutions: false, product: false, company: false, docs: false }}
          showSearch={false}
          showProfileAndChangelogMenu={false}
        />
        <Body>
          <Flex flexDirection="column" alignItems="center" my={[4, 6]} p={2}>
            <Fragment>
              <Box maxWidth={390} px={['20px', 0]}>
                <Flex justifyContent="center">
                  <Image src="/static/images/oc-logo-watercolor-256.png" height={128} width={128} />
                </Flex>

                <Flex
                  as="label"
                  fontWeight={700}
                  htmlFor="password"
                  fontSize={'32px'}
                  mb={12}
                  mt={3}
                  justifyContent="center"
                >
                  <FormattedMessage defaultMessage="Reset Password" />
                </Flex>

                <Flex fontWeight={400} fontSize="16px" color="black.700" mb="50px" justifyContent="center">
                  <FormattedMessage defaultMessage="Enter your new password" />
                </Flex>

                {!this.props.data?.loggedInAccount && (
                  <MessageBox type="error" withIcon my={2} data-cy="password-error">
                    <FormattedMessage defaultMessage="There was an error while trying to process your request to reset password. Try again or contact support if the problem persists." />
                  </MessageBox>
                )}

                {this.props.data?.loggedInAccount && (
                  <Container
                    as="form"
                    method="POST"
                    noValidate
                    data-cy="resetPassword-form"
                    onSubmit={event => {
                      event.preventDefault();
                      this.submitResetPassword();
                    }}
                  >
                    <Flex mb={'4'}>
                      <Avatar collective={this.props.data.loggedInAccount} radius={40} mr={2} />
                      <Box>
                        <P color="black.800" fontWeight="500" fontSize="14px" lineHeight="20px">
                          {this.props.data.loggedInAccount.name}
                        </P>
                        <P mt="2px" wordBreak="break-all" color="black.700" fontSize="13px">
                          {this.props.data.loggedInAccount.email}
                        </P>
                      </Box>
                    </Flex>

                    {/* We're adding a hidden email field to helper password managers remember the credentials */}
                    <StyledInput
                      style={{ display: 'none' }}
                      id="email"
                      readOnly
                      autoComplete="email"
                      name="email"
                      value={this.props.data.loggedInAccount.email}
                      type="email"
                    />

                    {showError && passwordError && (
                      <MessageBox type="error" withIcon my={2}>
                        {passwordError}
                      </MessageBox>
                    )}

                    <StyledInputField
                      labelFontWeight={600}
                      labelFontSize="13px"
                      alignItems="left"
                      width="100%"
                      label={<FormattedMessage defaultMessage="New Password" />}
                      htmlFor="new-password"
                      my={2}
                    >
                      <StyledInput
                        fontSize="14px"
                        id="new-password"
                        autoComplete="new-password"
                        type="password"
                        width={1}
                        autoFocus={true}
                        required={true}
                        onChange={({ target }) => {
                          this.setState({
                            password: target.value,
                            passwordError: target.validationMessage,
                            showError: false,
                          });
                        }}
                        onKeyDown={e => {
                          // See https://github.com/facebook/react/issues/6368
                          if (e.key === ' ') {
                            e.preventDefault();
                          } else if (e.key === 'Enter') {
                            this.setState({ passwordError: e.target.validationMessage, showError: true });
                          }
                        }}
                        onBlur={() => this.setState({ showError: true })}
                        onInvalid={event => {
                          event.preventDefault();
                          this.setState({ passwordError: event.target.validationMessage });
                        }}
                      />
                    </StyledInputField>

                    <PasswordStrengthBar
                      style={{ visibility: password ? 'visible' : 'hidden' }}
                      password={password}
                      onChangeScore={passwordScore => {
                        this.setState({ passwordScore });
                      }}
                    />

                    <Flex justifyContent="center" mb="24px" mt="26px">
                      <StyledButton
                        data-cy="signin-btn"
                        buttonStyle="primary"
                        fontWeight="500"
                        disabled={!password}
                        loading={passwordLoading}
                        minWidth={157}
                        type="submit"
                        whiteSpace="nowrap"
                      >
                        <FormattedMessage id="actions.continue" defaultMessage="Continue" />
                      </StyledButton>
                    </Flex>
                  </Container>
                )}
              </Box>
            </Fragment>
          </Flex>
        </Body>
      </Fragment>
    );
  }
}

const resetPasswordMutation = gql`
  mutation ResetPassword($password: String!) {
    setPassword(password: $password) {
      id
    }
  }
`;

const resetPasswordAccountQuery = gql`
  query ResetPasswordAccount {
    loggedInAccount {
      id
      slug
      name
      email
      imageUrl
    }
  }
`;

const addResetPasswordMutation = graphql(resetPasswordMutation, {
  name: 'resetPassword',
  options: props => {
    return {
      context: {
        ...API_V2_CONTEXT,
        headers: { authorization: `Bearer ${props.token}` },
      },
    };
  },
});

const addResetPasswordAccountQuery = graphql(resetPasswordAccountQuery, {
  options: props => {
    return {
      context: {
        ...API_V2_CONTEXT,
        headers: { authorization: `Bearer ${props.token}` },
      },
    };
  },
});

export default withRouter(injectIntl(addResetPasswordAccountQuery(addResetPasswordMutation(ResetPasswordPage))));
