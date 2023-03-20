import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Download as DownloadIcon } from '@styled-icons/feather/Download';
import { Info } from '@styled-icons/feather/Info';
import { saveAs } from 'file-saver';
import { Field, Form, Formik } from 'formik';
import { get } from 'lodash';
import QRCode from 'qrcode.react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import speakeasy from 'speakeasy';
import styled from 'styled-components';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { compose } from '../../../lib/utils';

import ConfirmationModal from '../../ConfirmationModal';
import Container from '../../Container';
import { Box, Flex, Grid } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Image from '../../Image';
import Loading from '../../Loading';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import { PasswordStrengthBar } from '../../PasswordStrengthBar';
import StyledButton from '../../StyledButton';
import StyledCard from '../../StyledCard';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import StyledTooltip from '../../StyledTooltip';
import { H3, P } from '../../Text';
import { TOAST_TYPE, withToasts } from '../../ToastProvider';
import { withUser } from '../../UserProvider';

const messages = defineMessages({
  errorWrongLength: {
    id: 'TwoFactorAuth.Setup.Form.ErrorLength',
    defaultMessage: 'Incorrect code length. Please re-enter your 6-digit code.',
  },
  errorWrongFormat: {
    id: 'TwoFactorAuth.Setup.Form.ErrorFormat',
    defaultMessage: 'Incorrect code format. Please enter only numbers.',
  },
  inputLabel: {
    id: 'TwoFactorAuth.Setup.Form.InputLabel',
    defaultMessage: 'Please enter your 6-digit code without any dashes.',
  },
});

const content = () => (
  <div>
    <P fontSize="12px" lineHeight="18px">
      <FormattedMessage
        id="TwoFactorAuth.Setup.AppInfo"
        defaultMessage="You can use 2FA apps such as Google Authenticator, Authy, 1Password, LastPass, or Microsoft Authenticator to scan the QR code."
      />
    </P>
  </div>
);

const TokenBox = styled(Box)`
  overflow-wrap: break-word;
  word-wrap: break-word;
`;

const Code = styled.code`
  background: ${props => props.theme.colors.black[100]};
  color: ${props => props.theme.colors.black[700]};
  word-break: break-all;
  display: block;
  margin-top: 8px;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #4d4f51;
  max-width: 350px;
`;

class UserSecurity extends React.Component {
  static propTypes = {
    /** From intl */
    intl: PropTypes.object.isRequired,
    /** From graphql query */
    setPassword: PropTypes.func.isRequired,
    addTwoFactorAuthTokenToIndividual: PropTypes.func.isRequired,
    removeTwoFactorAuthTokenFromIndividual: PropTypes.func.isRequired,
    /** From withUser */
    LoggedInUser: PropTypes.shape({
      isRoot: PropTypes.bool.isRequired,
      hasPassword: PropTypes.bool.isRequired,
      hasRole: PropTypes.func.isRequired,
      email: PropTypes.string.isRequired,
    }),
    login: PropTypes.func.isRequired,
    refetchLoggedInUser: PropTypes.func.isRequired,
    data: PropTypes.shape({
      individual: PropTypes.object,
      loading: PropTypes.bool,
    }),
    /** From withToasts */
    addToast: PropTypes.func.isRequired,
    /** From parent component */
    slug: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      disablingTwoFactorAuth: false,
      disableError: null,
      recoveryCodes: null,
      enablingTwoFactorAuth: false,
      showRecoveryCodesModal: false,
      /* Password management state */
      passwordLoading: false,
      passwordError: null,
      currentPassword: '',
      password: '',
      passwordKey: 1,
      passwordScore: null,
    };

    this.enableTwoFactorAuth = this.enableTwoFactorAuth.bind(this);
    this.disableTwoFactorAuth = this.disableTwoFactorAuth.bind(this);
    this.setPassword = this.setPassword.bind(this);
  }

  componentDidMount() {
    // speakeasy options object does not add issuer as expected so we add it ourselves to the otp url
    // do not use URLParams from universal-url or the web API to encode the issuer
    // see https://github.com/opencollective/opencollective-frontend/pull/4520#discussion_r447690237 for discussion
    let issuer;
    if (window.location.hostname === 'localhost') {
      issuer = '&issuer=Open%20Collective%20Local';
    } else if (window.location.hostname === 'staging.opencollective.com') {
      issuer = '&issuer=Open%20Collective%20Staging';
    } else {
      issuer = '&issuer=Open%20Collective';
    }
    const options = {
      name: this.props.LoggedInUser.email,
      length: 64,
    };
    const secret = speakeasy.generateSecret(options);
    const otpAuthUrl = secret.otpauth_url + issuer;
    this.setState({ secret, base32: secret.base32, otpAuthUrl });
  }

  async enableTwoFactorAuth(values) {
    try {
      // verify QR code
      const { twoFactorAuthenticatorCode } = values;
      const verified = speakeasy.totp.verify({
        secret: this.state.base32,
        encoding: 'base32',
        token: twoFactorAuthenticatorCode,
        window: 2,
      });

      // if not verified, ask the user to try again
      if (!verified) {
        this.setState({ error: '2FA token not verified. Please try again.' });
      }

      // if ok, send secret to backend
      if (verified) {
        const account = {
          id: this.props.data.individual.id,
        };

        await this.props
          .addTwoFactorAuthTokenToIndividual({
            variables: {
              account,
              token: this.state.base32,
            },
          })
          .then(data => {
            this.setState({ recoveryCodes: get(data, 'data.addTwoFactorAuthTokenToIndividual.recoveryCodes') });
          })
          .then(() => {
            this.props.refetchLoggedInUser(); // No need to await
          });
        this.setState({ error: null, enablingTwoFactorAuth: true });
      }
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ error: errorMsg });
    }
  }

  async disableTwoFactorAuth(values) {
    try {
      const { twoFactorAuthenticatorCode } = values;
      const account = {
        id: this.props.data.individual.id,
      };

      await this.props.removeTwoFactorAuthTokenFromIndividual({
        variables: {
          account,
          code: twoFactorAuthenticatorCode,
        },
      });
      this.props.refetchLoggedInUser(); // No need to await
      this.setState({ disablingTwoFactorAuth: false, error: null });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ disableError: errorMsg });
    }
  }

  async setPassword() {
    const { password, passwordKey, currentPassword, passwordScore } = this.state;

    if (password === currentPassword) {
      this.setState({
        passwordError: <FormattedMessage defaultMessage="Password can't be the same as current password" />,
      });
      return;
    }

    if (passwordScore <= 1) {
      this.setState({
        passwordError: (
          <FormattedMessage defaultMessage="Password is too weak. Try to use more characters or use a password manager to generate a strong one." />
        ),
      });
      return;
    }

    try {
      this.setState({ passwordLoading: true });
      const hadPassword = this.props.LoggedInUser.hasPassword;
      const result = await this.props.setPassword({ variables: { password, currentPassword } });
      if (result.data.setPassword.token) {
        await this.props.login(result.data.setPassword.token);
      }
      await this.props.refetchLoggedInUser();
      this.setState({
        currentPassword: '',
        password: '',
        passwordError: null,
        passwordScore: null,
        passwordLoading: false,
        passwordKey: Number(passwordKey) + 1,
      });
      this.props.addToast({
        type: TOAST_TYPE.SUCCESS,
        message: hadPassword ? (
          <FormattedMessage defaultMessage="Password successfully updated" />
        ) : (
          <FormattedMessage defaultMessage="Password successfully set" />
        ),
      });
    } catch (e) {
      this.setState({ passwordError: e.message, passwordLoading: false });
    }
  }

  renderPasswordManagement() {
    const { LoggedInUser } = this.props;
    const { password, passwordError, passwordLoading, passwordKey, currentPassword } = this.state;

    return (
      <Fragment>
        <H3 fontSize="18px" fontWeight="700" mb={2}>
          <FormattedMessage id="Password" defaultMessage="Password" />
        </H3>
        {passwordError && (
          <MessageBox type="error" withIcon my={2} data-cy="password-error">
            {passwordError}
          </MessageBox>
        )}
        <Container mb="4">
          <P py={2} mb={2}>
            {LoggedInUser.hasPassword ? (
              <FormattedMessage
                id="Password.Change.Info"
                defaultMessage="You already have a password set, you can change it using the following form."
              />
            ) : (
              <FormattedMessage
                id="Password.Set.Info"
                defaultMessage="Setting a password is optional but can be useful if you're using a password manager."
              />
            )}
          </P>

          {/* We're adding a hidden email field to helper password managers remember the credentials */}
          <StyledInput
            style={{ display: 'none' }}
            id="email"
            autoComplete="email"
            name="email"
            value={LoggedInUser.email}
            type="email"
          />

          {LoggedInUser.hasPassword && (
            <StyledInputField
              label={<FormattedMessage defaultMessage="Current Password" />}
              labelFontWeight="bold"
              htmlFor="current-password"
              mb={2}
              width="100%"
            >
              <StyledInput
                key={`current-password-${passwordKey}`}
                fontSize="14px"
                id="current-password"
                autoComplete="current-password"
                name="current-password"
                type="password"
                required
                onChange={e => {
                  this.setState({ passwordError: null, currentPassword: e.target.value });
                }}
              />
            </StyledInputField>
          )}

          <StyledInputField
            label={<FormattedMessage defaultMessage="New Password" />}
            labelFontWeight="bold"
            htmlFor="new-password"
            mt={2}
            mb={2}
            width="100%"
            hint={
              <FormattedMessage
                defaultMessage="Strong password recommended. Short or weak one restricted. <link>The strength of a password is a function of length, complexity, and unpredictability.</link>"
                values={{
                  link: getI18nLink({
                    href: 'https://en.wikipedia.org/wiki/Password_strength',
                    openInNewTab: true,
                  }),
                }}
              />
            }
          >
            <StyledInput
              key={`current-password-${passwordKey}`}
              fontSize="14px"
              id="new-password"
              autoComplete="new-password"
              type="password"
              required
              onChange={e => {
                this.setState({ passwordError: null, password: e.target.value });
              }}
            />
          </StyledInputField>

          <div data-cy="password-strength-bar">
            <PasswordStrengthBar
              password={password}
              onChangeScore={passwordScore => {
                this.setState({ passwordScore });
              }}
            />
          </div>

          <StyledButton
            my={2}
            minWidth={140}
            loading={passwordLoading}
            disabled={!password || (LoggedInUser.hasPassword && !currentPassword)}
            onClick={this.setPassword}
          >
            {LoggedInUser.hasPassword ? (
              <FormattedMessage id="Security.UpdatePassword.Button" defaultMessage="Update Password" />
            ) : (
              <FormattedMessage id="Security.SetPassword.Button" defaultMessage="Set Password" />
            )}
          </StyledButton>
        </Container>
      </Fragment>
    );
  }

  render() {
    const { intl, data } = this.props;
    const {
      error,
      disableError,
      secret,
      base32,
      otpAuthUrl,
      disablingTwoFactorAuth,
      enablingTwoFactorAuth,
      recoveryCodes,
      showRecoveryCodesModal,
    } = this.state;

    const { loading } = data;

    if (loading) {
      return <Loading />;
    }

    const account = get(data, 'individual', null);
    const doesAccountAlreadyHave2FA = get(account, 'hasTwoFactorAuth', false);

    const initialSetupFormValues = {
      twoFactorAuthenticatorCode: '',
    };

    const initialDisableFormValues = {
      twoFactorAuthenticatorCode: '',
    };

    const validate = values => {
      const errors = {};

      if (values.twoFactorAuthenticatorCode.toString().length !== 6) {
        errors.twoFactorAuthenticatorCode = intl.formatMessage(messages.errorWrongLength);
      }

      return errors;
    };

    return (
      <Flex flexDirection="column">
        {this.renderPasswordManagement()}

        <H3 fontSize="18px" fontWeight="700" mb={2}>
          <FormattedMessage id="TwoFactorAuth" defaultMessage="Two-factor authentication" />
        </H3>
        {error && (
          <MessageBox type="error" withIcon my={2} data-cy="add-two-factor-auth-error">
            {error}
          </MessageBox>
        )}
        <Flex flexDirection="column">
          {doesAccountAlreadyHave2FA && !enablingTwoFactorAuth ? (
            <Fragment>
              <P>
                <FormattedMessage
                  id="TwoFactorAuth.Setup.Info"
                  defaultMessage="Two-factor authentication adds an extra layer of security for your account when logging in or performing admin actions."
                />
              </P>
              <StyledCard
                display="flex"
                flexWrap="wrap"
                alignItems="center"
                justifyContent="center"
                my="32px"
                p="36px"
                maxWidth="496px"
                data-cy="add-two-factor-auth-success"
                padding="36px"
                borderWidth="2px"
                borderColor="green.500"
              >
                <Box flex="0 0 183px">
                  <Image src="/static/images/lock-green.png" width="183px" height="183px" alt="" />
                </Box>
                <Box flex="1 1 223px" pr="9px">
                  <P fontSize="20px" fontWeight="500">
                    <FormattedMessage
                      id="TwoFactorAuth.Setup.AlreadyAdded"
                      defaultMessage="Two-factor authentication (2FA) is enabled on this account. Well done! 🎉"
                    />
                  </P>
                </Box>
              </StyledCard>
              <Container>
                <StyledButton
                  my={1}
                  minWidth={140}
                  buttonStyle={'danger'}
                  onClick={() => this.setState({ disablingTwoFactorAuth: true })}
                >
                  <FormattedMessage id="TwoFactorAuth.Disable.Button" defaultMessage="Disable 2FA" />
                </StyledButton>
                {disablingTwoFactorAuth && (
                  <Formik
                    validate={validate}
                    initialValues={initialDisableFormValues}
                    onSubmit={this.disableTwoFactorAuth}
                  >
                    {formik => {
                      const { values, errors, touched, handleSubmit, isSubmitting } = formik;

                      return (
                        <StyledModal width="570px" onClose={() => this.setState({ disablingTwoFactorAuth: false })}>
                          <ModalHeader>
                            <FormattedMessage
                              id="TwoFactorAuth.Disable.Header"
                              defaultMessage="Are you sure you want to remove two-factor authentication from your account?"
                            />
                          </ModalHeader>
                          <ModalBody>
                            <MessageBox type="warning" withIcon my={3}>
                              <FormattedMessage
                                id="TwoFactorAuth.Disable.Warning"
                                defaultMessage="Removing 2FA from your account can make it less secure."
                              />
                            </MessageBox>
                            {disableError && (
                              <MessageBox type="error" withIcon mb={3}>
                                {disableError}
                              </MessageBox>
                            )}
                            <P>
                              <FormattedMessage
                                id="TwoFactorAuth.Disable.Info"
                                defaultMessage="If you would like to remove 2FA from your account, you will need to enter the code from your authenticator app one more time."
                              />
                            </P>
                            <Form>
                              <StyledInputField
                                name="twoFactorAuthenticatorCode"
                                htmlFor="twoFactorAuthenticatorCode"
                                error={touched.twoFactorAuthenticatorCode && errors.twoFactorAuthenticatorCode}
                                label={intl.formatMessage(messages.inputLabel)}
                                value={values.twoFactorAuthenticatorCode}
                                required
                                mt={2}
                                mb={3}
                              >
                                {inputProps => (
                                  <Field
                                    as={StyledInput}
                                    {...inputProps}
                                    width={240}
                                    minHeight={75}
                                    fontSize="20px"
                                    autoComplete="off"
                                    placeholder="123456"
                                    pattern="[0-9]{6}"
                                    inputMode="numeric"
                                    autoFocus
                                  />
                                )}
                              </StyledInputField>
                            </Form>
                          </ModalBody>
                          <ModalFooter>
                            <Container display="flex" justifyContent="flex-end">
                              <StyledButton mx={20} onClick={() => this.setState({ disablingTwoFactorAuth: false })}>
                                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                              </StyledButton>
                              <StyledButton buttonStyle="danger" loading={isSubmitting} onClick={handleSubmit}>
                                <FormattedMessage id="actions.continue" defaultMessage="Continue" />
                              </StyledButton>
                            </Container>
                          </ModalFooter>
                        </StyledModal>
                      );
                    }}
                  </Formik>
                )}
              </Container>
            </Fragment>
          ) : (
            <Fragment>
              {recoveryCodes ? (
                <Fragment>
                  <P>
                    <FormattedMessage
                      id="TwoFactorAuth.Setup.RecoveryCodes.Info"
                      defaultMessage="Recovery codes are used to access your account in case you can't access it with your authenticator app (for example, if you have lost your phone). Each code can only be used once. Save your 2FA recovery codes in a safe place, like a password manager app."
                    />
                  </P>
                  <Container>
                    <Box>
                      <Flex alignItems="center" mt={3}>
                        <H3 fontSize="18px" mr={1}>
                          <FormattedMessage
                            id="TwoFactorAuth.Setup.StepThree"
                            defaultMessage="Step three: save your recovery codes"
                          />
                        </H3>
                      </Flex>
                      <Container maxWidth={480} border="2px solid black" borderRadius={8} my={3}>
                        <Grid
                          gridTemplateColumns={['1fr', '1fr 1fr']}
                          p="32px"
                          gridGap="16px"
                          data-cy="recovery-codes-container"
                        >
                          {recoveryCodes.map(code => {
                            return (
                              <P key={code} fontSize="16px" fontWeight="700" m="0 16px 16px 0">
                                {code}
                              </P>
                            );
                          })}
                        </Grid>
                      </Container>
                      <Container>
                        <Flex justifyContent={['center', 'left']} mb={4} gap="16px">
                          <StyledButton
                            minWidth="148px"
                            buttonStyle="primary"
                            onClick={() => this.setState({ showRecoveryCodesModal: true })}
                            loading={showRecoveryCodesModal}
                            data-cy="add-two-factor-auth-confirm-recovery-codes-button"
                          >
                            <FormattedMessage id="TwoFactorAuth.Setup.Form.FinishSetup" defaultMessage="Finish setup" />
                          </StyledButton>
                          <StyledButton
                            onClick={() =>
                              saveAs(
                                new Blob([recoveryCodes.join('\n')], { type: 'text/plain;charset=utf-8' }),
                                'opencollective-recovery-codes.txt',
                              )
                            }
                          >
                            <FormattedMessage defaultMessage="Download codes" />
                            &nbsp;
                            <DownloadIcon size="1em" />
                          </StyledButton>
                        </Flex>
                      </Container>
                    </Box>
                  </Container>
                  {showRecoveryCodesModal && (
                    <ConfirmationModal
                      isDanger
                      type="confirm"
                      onClose={() => this.setState({ showRecoveryCodesModal: false })}
                      continueHandler={() =>
                        this.setState({
                          recoveryCodes: null,
                          enablingTwoFactorAuth: false,
                          showRecoveryCodesModal: false,
                        })
                      }
                      header={
                        <FormattedMessage
                          id="TwoFactorAuth.Setup.RecoveryCodes.ConfirmationModal.Header"
                          defaultMessage="Are you sure?"
                        />
                      }
                    >
                      <FormattedMessage
                        id="TwoFactorAuth.Setup.RecoveryCodes.ConfirmationModal.Body"
                        defaultMessage="Once you click 'Confirm', you will no longer have access to your recovery codes."
                      />
                    </ConfirmationModal>
                  )}
                </Fragment>
              ) : (
                <Fragment>
                  <P>
                    <FormattedMessage
                      id="TwoFactorAuth.Setup.Info"
                      defaultMessage="Two-factor authentication adds an extra layer of security for your account when logging in or performing admin actions."
                    />
                  </P>
                  <Container>
                    <Box>
                      <Flex alignItems="center" mt={3}>
                        <H3 fontSize="18px" fontWeight="700" mr={1}>
                          <FormattedMessage
                            id="TwoFactorAuth.Setup.StepOne"
                            defaultMessage="Step one: scan this QR code with an authenticator app"
                          />
                        </H3>
                        <StyledTooltip content={content}>
                          <Info size={16} />
                        </StyledTooltip>
                      </Flex>
                      {secret ? (
                        <Flex flexDirection="column">
                          <QRCode
                            value={otpAuthUrl}
                            renderAs="svg"
                            size={256}
                            level="L"
                            includeMargin
                            data-cy="qr-code"
                          />
                          <TokenBox data-cy="manual-entry-2fa-token">
                            <P>
                              <FormattedMessage
                                id="TwoFactorAuth.Setup.ManualEntry"
                                defaultMessage="Manual entry: {token}"
                                values={{
                                  token: <Code>{base32}</Code>,
                                }}
                              />
                            </P>
                          </TokenBox>
                        </Flex>
                      ) : (
                        <LoadingPlaceholder height={256} width={256} />
                      )}
                    </Box>
                    <Box mt={3}>
                      <H3 fontSize="18px">
                        <FormattedMessage
                          id="TwoFactorAuth.Setup.StepTwo"
                          defaultMessage="Step two: enter the code from your authentication app"
                        />
                      </H3>
                      <Container>
                        <Formik
                          validate={validate}
                          initialValues={initialSetupFormValues}
                          onSubmit={this.enableTwoFactorAuth}
                        >
                          {formik => {
                            const { values, handleSubmit, errors, touched, isSubmitting } = formik;

                            return (
                              <Form>
                                <StyledInputField
                                  name="twoFactorAuthenticatorCode"
                                  htmlFor="twoFactorAuthenticatorCode"
                                  error={touched.twoFactorAuthenticatorCode && errors.twoFactorAuthenticatorCode}
                                  label={intl.formatMessage(messages.inputLabel)}
                                  value={values.twoFactorAuthenticatorCode}
                                  required
                                  mt={2}
                                  mb={3}
                                >
                                  {inputProps => (
                                    <Field
                                      as={StyledInput}
                                      {...inputProps}
                                      width={240}
                                      minHeight={60}
                                      fontSize="20px"
                                      lineHeight="28px"
                                      placeholder="123456"
                                      pattern="[0-9]{6}"
                                      inputMode="numeric"
                                      minLength={6}
                                      maxLength={6}
                                      data-cy="add-two-factor-auth-totp-code-field"
                                    />
                                  )}
                                </StyledInputField>

                                <Flex justifyContent={['center', 'left']} mb={4}>
                                  <StyledButton
                                    fontSize="13px"
                                    minWidth="148px"
                                    minHeight="36px"
                                    buttonStyle="primary"
                                    type="submit"
                                    onSubmit={handleSubmit}
                                    loading={isSubmitting}
                                    disabled={values.twoFactorAuthenticatorCode.length < 6}
                                    data-cy="add-two-factor-auth-totp-code-button"
                                  >
                                    <FormattedMessage
                                      id="TwoFactorAuth.Setup.Form.VerifyButton"
                                      defaultMessage="Verify & see recovery codes"
                                    />
                                  </StyledButton>
                                </Flex>
                              </Form>
                            );
                          }}
                        </Formik>
                      </Container>
                    </Box>
                  </Container>
                </Fragment>
              )}
            </Fragment>
          )}
        </Flex>
      </Flex>
    );
  }
}

const addTwoFactorAuthToIndividualMutation = gql`
  mutation AddTwoFactorAuthToIndividual($account: AccountReferenceInput!, $token: String!) {
    addTwoFactorAuthTokenToIndividual(account: $account, token: $token) {
      account {
        id
        hasTwoFactorAuth
      }
      recoveryCodes
    }
  }
`;

const removeTwoFactorAuthFromIndividualMutation = gql`
  mutation RemoveTwoFactorAuthFromIndividual($account: AccountReferenceInput!, $code: String!) {
    removeTwoFactorAuthTokenFromIndividual(account: $account, code: $code) {
      id
      hasTwoFactorAuth
    }
  }
`;

const accountHasTwoFactorAuthQuery = gql`
  query AccountHasTwoFactorAuth($slug: String) {
    individual(slug: $slug) {
      id
      slug
      name
      type
      id
      slug
      name
      type
      hasTwoFactorAuth
    }
  }
`;

const setPasswordMutation = gql`
  mutation SetPassword($password: String!, $currentPassword: String) {
    setPassword(password: $password, currentPassword: $currentPassword) {
      individual {
        id
        hasPassword
      }
      token
    }
  }
`;

const addGraphql = compose(
  graphql(setPasswordMutation, {
    name: 'setPassword',
    options: { context: API_V2_CONTEXT },
  }),
  graphql(addTwoFactorAuthToIndividualMutation, {
    name: 'addTwoFactorAuthTokenToIndividual',
    options: { context: API_V2_CONTEXT },
  }),
  graphql(removeTwoFactorAuthFromIndividualMutation, {
    name: 'removeTwoFactorAuthTokenFromIndividual',
    options: { context: API_V2_CONTEXT },
  }),
  graphql(accountHasTwoFactorAuthQuery, {
    options: props => ({
      context: API_V2_CONTEXT,
      variables: {
        slug: props.slug,
      },
    }),
  }),
);

export default injectIntl(withToasts(withUser(addGraphql(UserSecurity))));
