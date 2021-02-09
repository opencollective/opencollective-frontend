import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { Info } from '@styled-icons/feather/Info';
import { Field, Form, Formik } from 'formik';
import { get } from 'lodash';
import QRCode from 'qrcode.react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import speakeasy from 'speakeasy';
import styled from 'styled-components';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { compose } from '../../../lib/utils';

import ConfirmationModal from '../../ConfirmationModal';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Loading from '../../Loading';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import StyledTooltip from '../../StyledTooltip';
import { H3, P } from '../../Text';
import { withUser } from '../../UserProvider';
import SettingsTitle from '../SettingsTitle';

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
        defaultMessage="You can use apps such as Google Authenticator, Authy, 1Password, LastPass, or Microsoft Authenticator to scan the QR code and receive a code to input."
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
`;

class UserTwoFactorAuth extends React.Component {
  static propTypes = {
    /** From intl */
    intl: PropTypes.object.isRequired,
    /** From graphql query */
    addTwoFactorAuthTokenToIndividual: PropTypes.func.isRequired,
    removeTwoFactorAuthTokenFromIndividual: PropTypes.func.isRequired,
    data: PropTypes.shape({
      individual: PropTypes.object,
      loading: PropTypes.bool,
    }),
    /** From parent component */
    slug: PropTypes.string,
    userEmail: PropTypes.string,
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
    };

    this.enableTwoFactorAuth = this.enableTwoFactorAuth.bind(this);
    this.disableTwoFactorAuth = this.disableTwoFactorAuth.bind(this);
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
      name: this.props.userEmail,
      length: 64,
    };
    const secret = speakeasy.generateSecret(options);
    const fullOTPUrl = secret.otpauth_url + issuer;
    this.setState({ secret, base32: secret.base32, otpauth_url: fullOTPUrl });
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
        this.setState({ error: 'Secret not verified. Please try again.' });
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
      this.setState({ disablingTwoFactorAuth: false, error: null });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ disableError: errorMsg });
    }
  }

  render() {
    const { intl, data } = this.props;
    const {
      error,
      disableError,
      secret,
      base32,
      otpauth_url,
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
        <SettingsTitle>
          {doesAccountAlreadyHave2FA ? (
            <FormattedMessage id="TwoFactorAuth" defaultMessage="Two-factor authentication" />
          ) : (
            <FormattedMessage id="TwoFactorAuth.Setup.Title" defaultMessage="Set up two-factor authentication" />
          )}
        </SettingsTitle>
        {error && (
          <MessageBox type="error" withIcon my={2} data-cy="add-two-factor-auth-error">
            {error}
          </MessageBox>
        )}
        <Flex flexDirection="column">
          {doesAccountAlreadyHave2FA && !enablingTwoFactorAuth ? (
            <Fragment>
              <Flex alignItems="center" mb={3}>
                <MessageBox type="success" withIcon data-cy="add-two-factor-auth-success">
                  <FormattedMessage
                    id="TwoFactorAuth.Setup.AlreadyAdded"
                    defaultMessage="Two-factor authentication (2FA) is enabled on this account. Well done! 🎉"
                  />
                </MessageBox>
              </Flex>
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
                        <Modal
                          show={this.state.disablingTwoFactorAuth}
                          width="570px"
                          onClose={() => this.setState({ disablingTwoFactorAuth: false })}
                        >
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
                                    minWidth={300}
                                    maxWidth={350}
                                    minHeight={75}
                                    fontSize="20px"
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
                        </Modal>
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
                        <H3 fontSize="15px" mr={1}>
                          <FormattedMessage
                            id="TwoFactorAuth.Setup.StepThree"
                            defaultMessage="Step three: save your recovery codes"
                          />
                        </H3>
                      </Flex>
                      <Container
                        display="flex"
                        flexWrap="wrap"
                        p={2}
                        border="2px solid black"
                        borderRadius={8}
                        my={3}
                        data-cy="recovery-codes-container"
                      >
                        {recoveryCodes.map(code => {
                          return (
                            <Flex key={code} flex="1 1 250px" my={2} alignItems="center" justifyContent="center">
                              <P fontSize="20px" fontWeight="700">
                                {code}
                              </P>
                            </Flex>
                          );
                        })}
                      </Container>
                      <Container>
                        <Flex justifyContent={['center', 'left']} mb={4}>
                          <StyledButton
                            fontSize="13px"
                            minWidth="148px"
                            minHeight="36px"
                            buttonStyle="primary"
                            onClick={() => this.setState({ showRecoveryCodesModal: true })}
                            loading={showRecoveryCodesModal}
                            data-cy="add-two-factor-auth-confirm-recovery-codes-button"
                          >
                            <FormattedMessage
                              id="TwoFactorAuth.Setup.Form.FinishSetup"
                              defaultMessage="Finish 2FA setup"
                            />
                          </StyledButton>
                        </Flex>
                      </Container>
                    </Box>
                  </Container>
                  <ConfirmationModal
                    show={showRecoveryCodesModal}
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
                </Fragment>
              ) : (
                <Fragment>
                  <P>
                    <FormattedMessage
                      id="TwoFactorAuth.Setup.Info"
                      defaultMessage="Two-factor authentication adds an extra layer of security for your account when logging in."
                    />
                  </P>
                  <Container>
                    <Box>
                      <Flex alignItems="center" mt={3}>
                        <H3 fontSize="15px" mr={1}>
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
                            value={otpauth_url}
                            renderAs="svg"
                            size={256}
                            level="L"
                            includeMargin
                            data-cy="qr-code"
                          />
                          <TokenBox maxWidth={350} data-cy="manual-entry-2fa-token">
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
                      <H3 fontSize="15px">
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
                                      minWidth={300}
                                      maxWidth={350}
                                      minHeight={60}
                                      fontSize="20px"
                                      lineHeight="28px"
                                      placeholder="123456"
                                      pattern="[0-9]{6}"
                                      inputMode="numeric"
                                      autoFocus
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

const addTwoFactorAuthToIndividualMutation = gqlV2/* GraphQL */ `
  mutation AddTwoFactorAuthToIndividual($account: AccountReferenceInput!, $token: String!) {
    addTwoFactorAuthTokenToIndividual(account: $account, token: $token) {
      account {
        id
        ... on Individual {
          hasTwoFactorAuth
        }
      }
      recoveryCodes
    }
  }
`;

const removeTwoFactorAuthFromIndividualMutation = gqlV2/* GraphQL */ `
  mutation RemoveTwoFactorAuthFromIndividual($account: AccountReferenceInput!, $code: String!) {
    removeTwoFactorAuthTokenFromIndividual(account: $account, code: $code) {
      id
      ... on Individual {
        hasTwoFactorAuth
      }
    }
  }
`;

const accountHasTwoFactorAuthQuery = gqlV2/* GraphQL */ `
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
      ... on Individual {
        hasTwoFactorAuth
      }
    }
  }
`;

const addAccountHasTwoFactorAuthData = graphql(accountHasTwoFactorAuthQuery, {
  options: props => ({
    context: API_V2_CONTEXT,
    variables: {
      slug: props.slug,
    },
  }),
});

const addGraphql = compose(
  graphql(addTwoFactorAuthToIndividualMutation, {
    name: 'addTwoFactorAuthTokenToIndividual',
    options: { context: API_V2_CONTEXT },
  }),
  graphql(removeTwoFactorAuthFromIndividualMutation, {
    name: 'removeTwoFactorAuthTokenFromIndividual',
    options: { context: API_V2_CONTEXT },
  }),
  addAccountHasTwoFactorAuthData,
);

export default injectIntl(withUser(addGraphql(UserTwoFactorAuth)));
