import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { resetPassword } from '../lib/api';

import Body from '../components/Body';
import Container from '../components/Container';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Image from '../components/Image';
import MessageBox from '../components/MessageBox';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import StyledInputField from '../components/StyledInputField';

// Dynamic imports
const PasswordStrengthBar = dynamic(() => import('react-password-strength-bar'));

class ResetPasswordPage extends React.Component {
  static getInitialProps({ query: { token } }) {
    return { token };
  }

  static propTypes = {
    token: PropTypes.string,
    router: PropTypes.object,
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
    const accessToken = this.props.token;
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
      await resetPassword(accessToken, password);
      await this.props.router.push({ pathname: '/reset-password/completed' });
    } catch (error) {
      this.setState({ passwordError: error.message, showError: true, passwordLoading: false });
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
                  {showError && passwordError && (
                    <MessageBox type="error" withIcon my={2} data-cy="password-error">
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
              </Box>
            </Fragment>
          </Flex>
        </Body>
      </Fragment>
    );
  }
}

export default withRouter(ResetPasswordPage);
