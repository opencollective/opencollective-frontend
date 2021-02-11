import React, { Fragment } from 'react';
import { PropTypes } from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Field, Form, Formik } from 'formik';
import { pick } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { isEmail } from 'validator';

import { checkUserExistence, signin } from '../lib/api';
import { getWebsiteUrl } from '../lib/utils';
import { Router } from '../server/pages';

import CreateProfileFAQ from './faqs/CreateProfileFAQ';
import CreateProfile from './CreateProfile';
import { Box, Flex } from './Grid';
import I18nFormatters, { I18nSupportLink } from './I18nFormatters';
import Loading from './Loading';
import MessageBoxGraphqlError from './MessageBoxGraphqlError';
import SignIn from './SignIn';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import { H5, P } from './Text';

const messages = defineMessages({
  twoFactorAuthCodeInputLabel: {
    id: 'TwoFactorAuth.Setup.Form.InputLabel',
    defaultMessage: 'Please enter your 6-digit code without any dashes.',
  },
  recoveryCodeInputLabel: {
    id: 'TwoFactorAuth.RecoveryCodes.Form.InputLabel',
    defaultMessage: 'Please enter your alphanumeric recovery code.',
  },
});

/**
 * Shows a SignIn form by default, with the ability to switch to SignUp form. It
 * also has the API methods binded, so you can use it directly.
 */
class SignInOrJoinFree extends React.Component {
  static propTypes = {
    /** Redirect URL */
    redirect: PropTypes.string,
    /** To pre-fill the "email" field */
    defaultEmail: PropTypes.string,
    /** Provide this to automatically sign in the given email */
    email: PropTypes.string,
    /** createUserQuery binding */
    createUser: PropTypes.func,
    /** Use this prop to use this as a controlled component */
    form: PropTypes.oneOf(['signin', 'create-account']),
    /** Set the initial view for the component */
    defaultForm: PropTypes.oneOf(['signin', 'create-account']),
    /** If provided, component will use links instead of buttons to make the switch */
    routes: PropTypes.shape({
      signin: PropTypes.string,
      join: PropTypes.string,
    }),
    /** To customize which forms should be displayed */
    createProfileTabs: PropTypes.arrayOf(PropTypes.oneOf(['personal', 'organization'])),
    /** To replace the default labels */
    createProfileLabels: PropTypes.shape({ personal: PropTypes.string, organization: PropTypes.string }),
    /** To display a box shadow below the card */
    withShadow: PropTypes.bool,
    /** Label for signIn, defaults to "Sign in using your email address:" */
    signInLabel: PropTypes.node,
    intl: PropTypes.object,
    enforceTwoFactorAuthForLoggedInUser: PropTypes.bool,
    submitTwoFactorAuthenticatorCode: PropTypes.func,
    submitRecoveryCode: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      form: this.props.defaultForm || 'signin',
      error: null,
      submitting: false,
      unknownEmailError: false,
      email: props.email || props.defaultEmail || '',
      useRecoveryCodes: null,
    };
  }

  componentDidMount() {
    // Auto signin if an email is provided
    if (this.props.email && isEmail(this.props.email)) {
      this.signIn(this.props.email);
    }
  }

  switchForm = form => {
    // Update local state
    this.setState({ form });
  };

  getRedirectURL() {
    let currentPath = window.location.pathname;
    if (window.location.search) {
      currentPath = currentPath + window.location.search;
    }
    return encodeURIComponent(this.props.redirect || currentPath || '/');
  }

  signIn = async email => {
    if (this.state.submitting) {
      return false;
    }

    this.setState({ submitting: true, error: null });

    try {
      const userExists = await checkUserExistence(email);
      if (userExists) {
        const response = await signin({
          user: { email },
          redirect: this.getRedirectURL(),
          websiteUrl: getWebsiteUrl(),
        });

        // In dev/test, API directly returns a redirect URL for emails like
        // test*@opencollective.com.
        if (response.redirect) {
          await Router.replaceRoute(response.redirect);
        } else {
          await Router.pushRoute('signinLinkSent', { email });
        }
        window.scrollTo(0, 0);
      } else {
        this.setState({ unknownEmailError: true, submitting: false });
      }
    } catch (e) {
      this.setState({ error: e.message || 'Server error', submitting: false });
      window.scrollTo(0, 0);
    }
  };

  createProfile = async data => {
    if (this.state.submitting) {
      return false;
    }
    const user = pick(data, ['email', 'name', 'newsletterOptIn']);
    const organizationData = pick(data, ['orgName', 'githubHandle', 'twitterHandle', 'website']);
    const organization = Object.keys(organizationData).length > 0 ? organizationData : null;
    if (organization) {
      organization.name = organization.orgName;
      delete organization.orgName;
    }

    this.setState({ submitting: true, error: null });

    try {
      await this.props.createUser({
        variables: {
          user,
          organization,
          redirect: this.getRedirectURL(),
          websiteUrl: getWebsiteUrl(),
        },
      });
      await Router.pushRoute('signinLinkSent', { email: user.email });
      window.scrollTo(0, 0);
    } catch (error) {
      this.setState({ error: error.message, submitting: false });
      window.scrollTo(0, 0);
    }
  };

  renderTwoFactorAuthBox = () => {
    return (
      <StyledCard maxWidth={480} width={1} boxShadow={'0px 9px 14px 1px #dedede'}>
        <Box py={4} px={[3, 4]}>
          <H5 as="label" fontWeight="bold" htmlFor="twoFactorAuthenticatorCode" mb={3} textAlign="left" display="block">
            <FormattedMessage id="TwoFactorAuth.SignIn" defaultMessage="Please verify your login using the 2FA code:" />
          </H5>
          <Formik
            initialValues={{
              twoFactorAuthenticatorCode: '',
            }}
            onSubmit={(values, actions) => {
              this.props.submitTwoFactorAuthenticatorCode(values).then(() => {
                actions.setSubmitting(false);
              });
            }}
          >
            {formik => {
              const { values, handleSubmit, errors, touched, isSubmitting } = formik;

              return (
                <Form>
                  <StyledInputField
                    name="twoFactorAuthenticatorCode"
                    htmlFor="twoFactorAuthenticatorCode"
                    error={touched.twoFactorAuthenticatorCode && errors.twoFactorAuthenticatorCode}
                    label={this.props.intl.formatMessage(messages.twoFactorAuthCodeInputLabel)}
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
                        data-cy="signin-two-factor-auth-input"
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
                      disabled={values.twoFactorAuthenticatorCode.length < 6}
                      loading={isSubmitting}
                      onSubmit={handleSubmit}
                      data-cy="signin-two-factor-auth-button"
                    >
                      <FormattedMessage id="VerifyButton" defaultMessage="Verify" />
                    </StyledButton>
                  </Flex>
                </Form>
              );
            }}
          </Formik>
          <Box>
            <P fontWeight="bold" fontSize={14} mb={1} textAlign="left" display="block">
              <FormattedMessage id="login.twoFactorAuth.havingTrouble" defaultMessage="Having trouble?" />
            </P>
            <StyledButton
              type="button"
              buttonSize="tiny"
              isBorderless
              buttonStyle="secondary"
              mb={3}
              onClick={() => this.setState({ useRecoveryCodes: true })}
            >
              <P>
                <FormattedMessage id="login.twoFactorAuth.useRecoveryCodes" defaultMessage="Use 2FA recovery codes." />
              </P>
            </StyledButton>
          </Box>
        </Box>
      </StyledCard>
    );
  };

  renderRecoveryCodesBox = () => {
    return (
      <StyledCard maxWidth={480} width={1} boxShadow={'0px 9px 14px 1px #dedede'}>
        <Box py={4} px={[3, 4]}>
          <H5 as="label" fontWeight="bold" htmlFor="recoveryCode" mb={3} textAlign="left" display="block">
            <FormattedMessage
              id="TwoFactorAuth.SignIn.RecoveryCodes"
              defaultMessage="Please enter one of your 2FA recovery codes:"
            />
          </H5>
          <Formik
            initialValues={{
              recoveryCode: '',
            }}
            onSubmit={(values, actions) => {
              this.props.submitRecoveryCode(values).then(() => {
                actions.setSubmitting(false);
              });
            }}
          >
            {formik => {
              const { values, handleSubmit, errors, touched, isSubmitting } = formik;

              return (
                <Form>
                  <StyledInputField
                    name="recoveryCode"
                    htmlFor="recoveryCode"
                    error={touched.recoveryCode && errors.recoveryCode}
                    label={this.props.intl.formatMessage(messages.recoveryCodeInputLabel)}
                    value={values.recoveryCode}
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
                        pattern="[a-zA-Z0-9]{16}"
                        autoFocus
                        //data-cy="signin-two-factor-auth-input"
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
                      //disabled={values.recoveryCode.length < 16}
                      loading={isSubmitting}
                      onSubmit={handleSubmit}
                    >
                      <FormattedMessage id="VerifyButton" defaultMessage="Verify" />
                    </StyledButton>
                  </Flex>
                </Form>
              );
            }}
          </Formik>
          <Box>
            <P>
              <FormattedMessage
                id="login.twoFactorAuth.support"
                defaultMessage="If you can't login with 2FA or recovery codes, please contact <SupportLink></SupportLink>."
                values={{
                  SupportLink: I18nSupportLink,
                }}
              />
            </P>
          </Box>
        </Box>
      </StyledCard>
    );
  };

  render() {
    const { submitting, error, unknownEmailError, email, useRecoveryCodes } = this.state;
    const displayedForm = this.props.form || this.state.form;
    const routes = this.props.routes || {};
    const { enforceTwoFactorAuthForLoggedInUser } = this.props;

    // No need to show the form if an email is provided
    const hasError = Boolean(unknownEmailError || error);
    if (this.props.email && !hasError) {
      return <Loading />;
    }

    return (
      <Flex flexDirection="column" width={1} alignItems="center">
        {error && <MessageBoxGraphqlError error={error} mb={[3, 4]} />}
        {enforceTwoFactorAuthForLoggedInUser ? (
          useRecoveryCodes ? (
            this.renderRecoveryCodesBox()
          ) : (
            this.renderTwoFactorAuthBox()
          )
        ) : (
          <Fragment>
            {displayedForm !== 'create-account' ? (
              <SignIn
                email={email}
                onEmailChange={email => this.setState({ email })}
                onSecondaryAction={routes.join || (() => this.switchForm('create-account'))}
                onSubmit={this.signIn}
                loading={submitting}
                unknownEmail={unknownEmailError}
                withShadow={this.props.withShadow}
                label={this.props.signInLabel}
              />
            ) : (
              <Flex flexDirection="column" width={1} alignItems="center">
                <Flex justifyContent="center" width={1}>
                  <Box width={[0, null, null, 1 / 5]} />
                  <Box maxWidth={480} mx={[2, 4]} width="100%">
                    <CreateProfile
                      email={email}
                      onEmailChange={email => this.setState({ email })}
                      onPersonalSubmit={this.createProfile}
                      onOrgSubmit={this.createProfile}
                      onSecondaryAction={routes.signin || (() => this.switchForm('signin'))}
                      submitting={submitting}
                      labels={this.props.createProfileLabels}
                      tabs={this.props.createProfileTabs}
                    />
                    <P mt={4} color="black.500" fontSize="12px" mb={3} data-cy="join-conditions" textAlign="center">
                      <FormattedMessage
                        id="SignIn.legal"
                        defaultMessage="By joining, you agree to our <TOSLink>Terms of Service</TOSLink> and <PrivacyPolicyLink>Privacy Policy</PrivacyPolicyLink>."
                        values={I18nFormatters}
                      />
                    </P>
                  </Box>

                  <CreateProfileFAQ mt={4} display={['none', null, 'block']} width={1 / 5} minWidth="335px" />
                </Flex>
              </Flex>
            )}
          </Fragment>
        )}
      </Flex>
    );
  }
}

const signupMutation = gql`
  mutation Signup($user: UserInputType!, $organization: CollectiveInputType, $redirect: String, $websiteUrl: String) {
    createUser(user: $user, organization: $organization, redirect: $redirect, websiteUrl: $websiteUrl) {
      user {
        id
        email
        name
      }
      organization {
        id
        slug
      }
    }
  }
`;

export const addSignupMutation = graphql(signupMutation, { name: 'createUser' });

export default injectIntl(addSignupMutation(SignInOrJoinFree));
