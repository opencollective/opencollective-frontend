import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Container from './Container';
import { Box, Flex } from './Grid';
import Image from './Image';
import Link from './Link';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import StyledLink from './StyledLink';
import StyledLinkButton from './StyledLinkButton';
import { Span } from './Text';

/**
 * Component for handing user sign-in or redirecting to sign-up.
 */
export default class SignIn extends React.Component {
  static propTypes = {
    /** handles the email input submission, a.k.a Sign In */
    onSubmit: PropTypes.func.isRequired,
    /** handles the redirect from sign-in, a.k.a Join Free. Accepts URLs (string) or custom action func */
    onSecondaryAction: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    /** When set to true, will show a spinner in Sign In button and will disable all actions */
    loading: PropTypes.bool,
    /** Whether user can click on "Join Free" */
    showSecondaryAction: PropTypes.bool,
    /** Set this to true to display the unknown email message */
    unknownEmail: PropTypes.bool,
    /** Set this to true to display the password field */
    passwordRequired: PropTypes.bool,
    /** Label, defaults to "Continue with your email" */
    label: PropTypes.node,
    /** Set the value of email input */
    email: PropTypes.string.isRequired,
    /** handles changes in the email input */
    onEmailChange: PropTypes.func.isRequired,
    /** handles changes in the password input */
    onPasswordChange: PropTypes.func.isRequired,
    /** Oauth Sign In **/
    isOAuth: PropTypes.bool,
    /** Oauth App Name **/
    oAuthAppName: PropTypes.string,
    /** Oauth App Image **/
    oAuthAppImage: PropTypes.string,
    /** Show/hide subheading **/
    showSubHeading: PropTypes.bool,
    /** Show/hide Open Collective Logo **/
    showOCLogo: PropTypes.bool,
  };

  static defaultProps = {
    showSubHeading: true,
    showOCLogo: true,
  };

  constructor(props) {
    super(props);
    this.state = { error: null, showError: false };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.unknownEmail !== this.props.unknownEmail) {
      this.setState({ unknownEmail: this.props.unknownEmail });
    }
  }

  renderSecondaryAction(message) {
    const { loading, onSecondaryAction } = this.props;
    return typeof onSecondaryAction === 'string' ? (
      <StyledLink
        as={Link}
        href={onSecondaryAction}
        disabled={loading}
        fontSize="14px"
        data-cy="signin-secondary-action-btn"
        underlineOnHover
      >
        {message}
      </StyledLink>
    ) : (
      <StyledLinkButton
        fontSize="14px"
        onClick={onSecondaryAction}
        disabled={loading}
        data-cy="signin-secondary-action-btn"
        underlineOnHover
      >
        {message}
      </StyledLinkButton>
    );
  }

  getSignInPageHeading(unknownEmail) {
    if (this.props.isOAuth && unknownEmail) {
      return <FormattedMessage defaultMessage="Sign in to your Open Collective account" />;
    } else if (this.props.isOAuth) {
      return <FormattedMessage defaultMessage="Continue with your Open Collective account" />;
    } else {
      return this.props.label || <FormattedMessage defaultMessage="Continue with your email" />;
    }
  }

  getSignInPageSubHeading(oAuthAppName) {
    if (this.props.isOAuth) {
      return <FormattedMessage defaultMessage="and connect with {oAuthAppName}" values={{ oAuthAppName }} />;
    } else {
      return <FormattedMessage defaultMessage="Sign in or create a personal account to continue" />;
    }
  }

  render() {
    const { onSubmit, loading, email, onEmailChange, onPasswordChange, label } = this.props;
    const { error, showError } = this.state;
    return (
      <React.Fragment>
        <Box maxWidth={390} px={['20px', 0]}>
          {this.props.isOAuth ? (
            <React.Fragment>
              <Flex justifyContent="center" mb={40}>
                <Box minWidth={104}>
                  <Image src="/static/images/oc-logo-oauth.png" height={104} width={104} />
                </Box>
                <Box ml={24} mr={24} mt={32} minWidth={40}>
                  <Image src="/static/images/oauth-flow-connect.png" height={40} width={40} />
                </Box>
                <Box minWidth={104}>
                  <img src={this.props.oAuthAppImage} alt="" height={104} width={104} style={{ borderRadius: 10 }} />
                </Box>
              </Flex>
            </React.Fragment>
          ) : (
            this.props.showOCLogo && (
              <Flex justifyContent="center">
                <Image src="/static/images/oc-logo-watercolor-256.png" height={128} width={128} />
              </Flex>
            )
          )}
          <Flex
            as="label"
            fontWeight={700}
            htmlFor="email"
            fontSize={label ? '24px' : ['24px', '32px']}
            mb={12}
            mt={3}
            textAlign="center"
          >
            {label || this.getSignInPageHeading(this.state.unknownEmail)}
          </Flex>
          {this.props.showSubHeading && (
            <Flex fontWeight={400} fontSize="16px" color="black.700" mb="50px" justifyContent="center">
              {this.getSignInPageSubHeading(this.props.oAuthAppName)}
            </Flex>
          )}
          {!this.state.unknownEmail ? (
            <React.Fragment>
              <Container
                as="form"
                method="POST"
                noValidate
                data-cy="signIn-form"
                onSubmit={event => {
                  event.preventDefault();
                  if (error) {
                    return;
                  }
                  onSubmit(email);
                  this.setState({ unknownEmail: this.props.unknownEmail });
                }}
              >
                {!this.props.passwordRequired && (
                  <Fragment>
                    <Container fontWeight={600} fontSize="13px" alignItems="left" mb="4px" width="100%">
                      <FormattedMessage id="Form.yourEmail" defaultMessage="Your email address" />
                    </Container>
                    <StyledInput
                      error={!!error}
                      fontSize="14px"
                      id="email"
                      name="email"
                      minWidth={120}
                      onChange={({ target }) => {
                        target.value = target.value.trim();
                        onEmailChange(target.value);
                        this.setState({ error: target.validationMessage, showError: false });
                      }}
                      onKeyDown={e => {
                        // See https://github.com/facebook/react/issues/6368
                        if (e.key === ' ') {
                          e.preventDefault();
                        } else if (e.key === 'Enter') {
                          onEmailChange(e.target.value);
                          this.setState({ error: e.target.validationMessage, showError: true });
                        }
                      }}
                      onBlur={() => this.setState({ showError: true })}
                      onInvalid={event => {
                        event.preventDefault();
                        this.setState({ error: event.target.validationMessage });
                      }}
                      placeholder="e.g., yourname@yourhost.com"
                      required
                      value={email}
                      type="email"
                      width={1}
                    />
                  </Fragment>
                )}
                {this.props.passwordRequired && (
                  <Fragment>
                    <Container fontWeight={600} fontSize="13px" alignItems="left" mb="4px" width="100%">
                      <FormattedMessage id="Form.yourEmail" defaultMessage="Your password" />
                    </Container>
                    <StyledInput
                      fontSize="14px"
                      id="password"
                      name="password"
                      type="password"
                      required
                      width={1}
                      autoFocus
                      onChange={({ target }) => {
                        target.value = target.value.trim();
                        onPasswordChange(target.value);
                        this.setState({ error: target.validationMessage, showError: false });
                      }}
                      onKeyDown={e => {
                        // See https://github.com/facebook/react/issues/6368
                        if (e.key === ' ') {
                          e.preventDefault();
                        } else if (e.key === 'Enter') {
                          onPasswordChange(e.target.value);
                          this.setState({ error: e.target.validationMessage, showError: true });
                        }
                      }}
                      onBlur={() => this.setState({ showError: true })}
                      onInvalid={event => {
                        event.preventDefault();
                        this.setState({ error: event.target.validationMessage });
                      }}
                    />
                  </Fragment>
                )}
                {error && showError && (
                  <Span display="block" color="red.500" pt={2} fontSize="10px" lineHeight="14px" aria-live="assertive">
                    {error}
                  </Span>
                )}
                <Flex justifyContent="center" mb="24px" mt="26px">
                  <StyledButton
                    data-cy="signin-btn"
                    buttonStyle="primary"
                    fontWeight="500"
                    disabled={!email}
                    loading={loading}
                    minWidth={157}
                    type="submit"
                    whiteSpace="nowrap"
                  >
                    <FormattedMessage id="actions.continue" defaultMessage="Continue" />
                  </StyledButton>
                </Flex>
              </Container>

              {this.props.showSecondaryAction && (
                <Box>
                  <Flex color="black.800" mr={1} fontSize="14px" justifyContent="center">
                    <FormattedMessage defaultMessage="Don't have one?" />
                  </Flex>
                  <Flex fontSize="14px" justifyContent="center" mt={2}>
                    {this.renderSecondaryAction(<FormattedMessage defaultMessage="Create an account" />)}
                  </Flex>
                </Box>
              )}
            </React.Fragment>
          ) : (
            <Container
              textAlign="center"
              display="block"
              color="black.800"
              fontSize="14px"
              lineHeight="20px"
              aria-live="assertive"
              fontWeight={400}
            >
              <FormattedMessage
                defaultMessage="{email} does not exist on Open Collective. Would you like to create an account with this email?"
                values={{ email: <strong>{email}</strong> }}
              />{' '}
              <Box mt="24px">
                <Span mr="40px">
                  {this.renderSecondaryAction(<FormattedMessage defaultMessage="Yes, create an account" />)}
                </Span>
                <StyledLink onClick={() => this.setState({ unknownEmail: false })} underlineOnHover={true}>
                  <FormattedMessage defaultMessage="No, use a different email" />
                </StyledLink>
              </Box>
            </Container>
          )}
        </Box>
      </React.Fragment>
    );
  }
}
