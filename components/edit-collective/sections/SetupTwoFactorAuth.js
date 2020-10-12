import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { Info } from '@styled-icons/feather/Info';
import { Field, Form, Formik } from 'formik';
import QRCode from 'qrcode.react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import speakeasy from 'speakeasy';
import styled from 'styled-components';

import { confettiFireworks } from '../../../lib/confettis';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { compose } from '../../../lib/utils';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Loading from '../../Loading';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import StyledTooltip from '../../StyledTooltip';
import { H2, H3, P } from '../../Text';
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
        defaultMessage="You can use apps such as Google Authenticator, Authy, 1Password, LastPass, or Microsoft Authenticator to scan the QR code and receive a code to input."
      />
    </P>
  </div>
);

const TokenBox = styled(Box)`
  overflow-wrap: break-word;
  word-wrap: break-word;
`;

class SetupTwoFactorAuth extends React.Component {
  static propTypes = {
    /** From intl */
    intl: PropTypes.object.isRequired,
    /** From graphql query */
    addTwoFactorAuthTokenToIndividual: PropTypes.func.isRequired,
    data: PropTypes.object,
    /** From parent component */
    slug: PropTypes.string,
    userEmail: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      tokenAdded: null,
    };

    this.submit = this.submit.bind(this);
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
    const fullOtpauthUrl = secret.otpauth_url + issuer; // eslint-disable-line camelcase
    this.setState({ secret, base32: secret.base32, otpauthUrl: fullOtpauthUrl });
  }

  async submit(values) {
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
          .then(() => {
            confettiFireworks(2000, { zIndex: 3000 });
          });
        this.setState({ tokenAdded: true, error: null });
      }
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ error: errorMsg });
    }
  }

  render() {
    const { intl, data } = this.props;
    const { error, tokenAdded, secret, base32, otpauthUrl } = this.state;

    const { loading } = data;

    if (loading) {
      return <Loading />;
    }

    const account = data && data.individual;
    const doesAccountAlreadyHave2FA = tokenAdded || account.hasTwoFactorAuth;

    const initialValues = {
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
        {error && (
          <MessageBox type="error" withIcon my={2} data-cy="add-two-factor-auth-error">
            {error}
          </MessageBox>
        )}
        <Flex flexDirection="column" my={2}>
          <H2>
            <FormattedMessage id="TwoFactorAuth.Setup.Title" defaultMessage="Set up two-factor authentication" />
          </H2>
          {doesAccountAlreadyHave2FA ? (
            <Flex alignItems="center">
              <MessageBox type="success" withIcon my={2} data-cy="add-two-factor-auth-success">
                <FormattedMessage
                  id="TwoFactorAuth.Setup.AlreadyAdded"
                  defaultMessage="Two-factor authentication is enabled on this account. Well done! 🎉"
                />
              </MessageBox>
            </Flex>
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
                  <Flex alignItems="center">
                    <H3 mr={1}>
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
                      <QRCode value={otpauthUrl} renderAs="svg" size={256} level="L" includeMargin data-cy="qr-code" />
                      <TokenBox maxWidth={350} data-cy="manual-entry-2fa-token">
                        <P>
                          <FormattedMessage
                            id="TwoFactorAuth.Setup.ManualEntry"
                            defaultMessage="Manual entry: {token}"
                            values={{
                              token: base32,
                            }}
                          />
                        </P>
                      </TokenBox>
                    </Flex>
                  ) : (
                    <LoadingPlaceholder height={256} width={256} />
                  )}
                </Box>
                <Box>
                  <H3>
                    <FormattedMessage
                      id="TwoFactorAuth.Setup.StepTwo"
                      defaultMessage="Step two: enter the code from your authentication app"
                    />
                  </H3>
                  <Container>
                    <Formik validate={validate} initialValues={initialValues} onSubmit={this.submit}>
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
                                  minHeight={75}
                                  fontSize="20px"
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
                                <FormattedMessage id="TwoFactorAuth.Setup.Form.VerifyButton" defaultMessage="Verify" />
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
        </Flex>
      </Flex>
    );
  }
}

const twoFactorAuthToAccountMutation = gqlV2/* GraphQL */ `
  mutation AddTwoFactorAuthToAccount($account: AccountReferenceInput!, $token: String!) {
    addTwoFactorAuthTokenToIndividual(account: $account, token: $token) {
      id
      ... on Individual {
        hasTwoFactorAuth
      }
    }
  }
`;

const addTwoFactorAuthToAccountMutation = graphql(twoFactorAuthToAccountMutation, {
  name: 'addTwoFactorAuthTokenToIndividual',
  options: { context: API_V2_CONTEXT },
});

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

const addGraphql = compose(addTwoFactorAuthToAccountMutation, addAccountHasTwoFactorAuthData);

export default injectIntl(withUser(addGraphql(SetupTwoFactorAuth)));
