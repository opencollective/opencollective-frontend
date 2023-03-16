import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { compact, isEmpty, pick, values } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Container from './Container';
import { Box, Flex } from './Grid';
import { getI18nLink } from './I18nFormatters';
import Image from './Image';
import Link from './Link';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledCheckbox from './StyledCheckbox';
import StyledHr from './StyledHr';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import StyledLinkButton from './StyledLinkButton';
import { P, Span } from './Text';

const messages = defineMessages({
  newsletter: {
    defaultMessage: 'Subscribe to our monthly newsletter',
  },
  nameLabel: {
    defaultMessage: 'Your name',
  },
  email: {
    defaultMessage: 'Your email',
  },
});

const Tab = ({ active, children, setActive, 'data-cy': dataCy }) => (
  <Container
    bg={active ? 'white.full' : 'black.50'}
    color="black.700"
    cursor="pointer"
    px={3}
    py={20}
    textAlign="center"
    width={0.5}
    tabIndex={0}
    onClick={setActive}
    onKeyDown={event => event.key === 'Enter' && setActive(event)}
    data-cy={dataCy}
  >
    <P fontWeight={active ? '600' : 'normal'}>{children}</P>
  </Container>
);

Tab.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  setActive: PropTypes.func,
  'data-cy': PropTypes.string,
};

const SecondaryAction = ({ children, loading, onSecondaryAction, asLink }) => {
  const Button = asLink ? StyledLinkButton : StyledButton;
  return typeof onSecondaryAction === 'string' ? (
    <Button as={Link} mt="24px" mr="16px" width="120px" href={onSecondaryAction} disabled={loading} fontSize="14px">
      {children}
    </Button>
  ) : (
    <Button mt="24px" mr="16px" width="120px" fontSize="14px" onClick={onSecondaryAction} disabled={loading}>
      {children}
    </Button>
  );
};

SecondaryAction.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool,
  onSecondaryAction: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  asLink: PropTypes.bool,
};

const NewsletterCheckBox = ({ onChange, checked }) => {
  const intl = useIntl();
  return (
    <StyledCheckbox
      onChange={({ checked, name }) => onChange({ target: { name, value: checked } })}
      checked={checked}
      name="newsletterOptIn"
      label={intl.formatMessage(messages.newsletter)}
    />
  );
};

NewsletterCheckBox.propTypes = {
  onChange: PropTypes.func,
  checked: PropTypes.bool,
};

const TOSCheckBox = ({ onChange, checked }) => {
  return (
    <StyledCheckbox
      onChange={({ checked, name }) => onChange({ target: { name, value: checked } })}
      checked={checked}
      name="tosOptIn"
      label={
        <FormattedMessage
          defaultMessage="I agree with the <TOSLink>terms of service</TOSLink> of Open Collective"
          values={{
            TOSLink: getI18nLink({
              href: '/tos',
              openInNewTabNoFollow: true,
              onClick: e => e.stopPropagation(), // don't check the checkbox when clicking on the link
            }),
          }}
        />
      }
    />
  );
};

TOSCheckBox.propTypes = {
  onChange: PropTypes.func,
  checked: PropTypes.bool,
};

const useForm = ({ onEmailChange, onFieldChange, name, newsletterOptIn, tosOptIn, errors }) => {
  const [state, setState] = useState({ errors, name, newsletterOptIn, tosOptIn });

  return {
    getFieldProps: name => ({
      defaultValue: state[name] || '',
      fontSize: '14px',
      lineHeight: '20px',
      type: 'text',
      width: 1,
      onChange: ({ target }) => {
        // Email state is not local so any changes should be handled separately
        let value = target.value;
        if (target.name === 'email') {
          value = undefined;
          onEmailChange(target.value);
        } else {
          onFieldChange(target.name, value);
        }
        setState({
          ...state,
          [target.name]: value,
          errors: { ...state.errors, [target.name]: null },
        });
      },
      onInvalid: event => {
        event.persist();
        event.preventDefault();
        setState({
          ...state,
          errors: { ...state.errors, [event.target.name]: event.target.validationMessage },
        });
      },
    }),
    getFieldError: name => {
      if (state.errors && state.errors[name]) {
        return state.errors[name];
      }
    },
    state,
  };
};

const CreateProfile = ({
  email,
  name,
  newsletterOptIn,
  tosOptIn,
  submitting,
  errors,
  onEmailChange,
  onFieldChange,
  onSubmit,
  onSecondaryAction,
  emailAlreadyExists,
  isOAuth,
  oAuthAppName,
  oAuthAppImage,
  ...props
}) => {
  const { formatMessage } = useIntl();
  const { getFieldError, getFieldProps, state } = useForm({
    onEmailChange,
    onFieldChange,
    name,
    newsletterOptIn,
    tosOptIn,
    errors,
    formatMessage,
  });
  const isValid = isEmpty(compact(values(state.errors)));

  return (
    <React.Fragment>
      <Container textAlign="center">
        {isOAuth ? (
          <React.Fragment>
            <Flex justifyContent="center" mb={40}>
              <Box minWidth={104}>
                <Image src="/static/images/oc-logo-oauth.png" height={104} width={104} />
              </Box>
              <Box ml={24} mr={24} mt={32} minWidth={40}>
                <Image src="/static/images/oauth-flow-connect.png" alt="OAuth Connect" height={40} width={40} />
              </Box>
              <Box minWidth={104}>
                <img src={oAuthAppImage} alt="OAuth Logo" height={104} width={104} style={{ borderRadius: 10 }} />
              </Box>
            </Flex>
          </React.Fragment>
        ) : (
          <Box>
            <Image src="/static/images/oc-logo-watercolor-256.png" height={96} width={96} />
          </Box>
        )}
        <Box pt="48px" fontSize="32px" fontWeight="700" color="black.900" lineHeight="40px">
          {isOAuth ? (
            <FormattedMessage defaultMessage="Create an account in Open Collective" />
          ) : (
            <FormattedMessage defaultMessage="Create your personal account" />
          )}
        </Box>
        <Box fontSize="16px" fontWeight="500" color="black.700" lineHeight="24px" pt="14px">
          {isOAuth ? (
            <FormattedMessage defaultMessage="and connect with {oAuthAppName}" values={{ oAuthAppName }} />
          ) : (
            <FormattedMessage defaultMessage="Set up your personal details to continue" />
          )}
        </Box>
      </Container>
      <Box
        as="form"
        onSubmit={event => {
          event.preventDefault();
          const data = pick(state, ['name', 'newsletterOptIn', 'tosOptIn']);
          onSubmit({ ...data, email });
        }}
        method="POST"
      >
        <StyledCard mt="16px" width={1} maxWidth={575} {...props}>
          <Flex
            fontSize="18px"
            fontWeight="700"
            color="black.900"
            lineHeight="26px"
            pt="31px"
            pl={4}
            alignItems="center"
            justifyContent="space-between"
          >
            <FormattedMessage id="CreateProfile.PersonalInfo" defaultMessage="Your personal information" />
            <StyledHr height="0.5px" borderColor="black.400" flex="1" ml={3} mr={4} />
          </Flex>
          <Box p={4}>
            <Box mb={24}>
              <StyledInputField
                htmlFor="name"
                labelFontSize="16px"
                labelFontWeight={700}
                labelColor="black.800"
                label={formatMessage(messages.nameLabel)}
                error={getFieldError('name')}
                required
              >
                {inputProps => (
                  <StyledInput
                    {...inputProps}
                    {...getFieldProps(inputProps.name)}
                    value={name}
                    placeholder="e.g., John Doe"
                  />
                )}
              </StyledInputField>
            </Box>

            <Box mb={24}>
              <StyledInputField
                labelColor="black.800"
                labelFontSize="16px"
                labelFontWeight={700}
                htmlFor="email"
                label={formatMessage(messages.email)}
                error={getFieldError('email')}
              >
                {inputProps => (
                  <StyledInput
                    {...inputProps}
                    {...getFieldProps(inputProps.name)}
                    type="email"
                    placeholder="e.g., yourname@yourhost.com"
                    value={email}
                    onKeyDown={e => {
                      // See https://github.com/facebook/react/issues/6368
                      if (e.key === ' ') {
                        e.preventDefault();
                      }
                    }}
                    required
                  />
                )}
              </StyledInputField>
            </Box>
            <StyledHr height="2px" borderColor="black.200" flex="1" />

            <Box mt="17px">
              <TOSCheckBox checked={state.tosOptIn} {...getFieldProps('tosOptIn')} />
            </Box>
            <Box mt="17px">
              <NewsletterCheckBox checked={state.newsletterOptIn} {...getFieldProps('newsletterOptIn')} />
            </Box>
          </Box>
        </StyledCard>
        <MessageBox type="info" mt="24px">
          <Box fontSize="13px" fontWeight={700}>
            <FormattedMessage defaultMessage="Do you want to create an account for your organization?" />
          </Box>
          <Box mt="8px" fontSize="12px" fontWeight={400} lineHeight="18px">
            <FormattedMessage defaultMessage="You are creating your personal account first, once inside, you will be able to create a profile for your company." />
            <Box mt="8px">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.opencollective.com/help/financial-contributors/organizations#what-is-an-organization"
              >
                <FormattedMessage defaultMessage="Read more about organization accounts" />
              </a>
            </Box>
          </Box>
        </MessageBox>
        {emailAlreadyExists && (
          <MessageBox type="warning" mt="24px">
            <Box fontSize="14px" fontWeight={400} lineHeight="20px">
              <FormattedMessage
                defaultMessage="{email} is already registered on Open Collective. Would you like to Sign In instead?"
                values={{ email: <strong>{email}</strong> }}
              />
              <Box mt="8px">
                <SecondaryAction onSecondaryAction={onSecondaryAction} loading={submitting} asLink>
                  <FormattedMessage defaultMessage="Sign me in" />
                </SecondaryAction>
              </Box>
            </Box>
          </MessageBox>
        )}
        <Flex justifyContent="center">
          <SecondaryAction onSecondaryAction={onSecondaryAction} loading={submitting}>
            <Span>
              &larr;{` `}
              <Span fontWeight="500" fontSize="14px">
                <FormattedMessage defaultMessage="Go back" />
              </Span>
            </Span>
          </SecondaryAction>
          <StyledButton
            mt="24px"
            buttonStyle="primary"
            disabled={!email || !state.name || !isValid || !state.tosOptIn}
            width="234px"
            type="submit"
            fontWeight="500"
            loading={submitting}
          >
            <FormattedMessage defaultMessage="Create account and continue" />
          </StyledButton>
        </Flex>
      </Box>
    </React.Fragment>
  );
};

CreateProfile.propTypes = {
  /** a map of errors to the matching field name, e.g., `{ email: 'Invalid email' }` will display that message until the email field */
  errors: PropTypes.objectOf(PropTypes.string),
  /** handles submissions of personal profile form */
  onSubmit: PropTypes.func.isRequired,
  /** Disable submit and show a spinner on button when set to true */
  submitting: PropTypes.bool,
  /** Set the value of email input */
  email: PropTypes.string.isRequired,
  /** Set the value of name input */
  name: PropTypes.string.isRequired,
  /** Set the value of newsLetterOptIn input */
  newsletterOptIn: PropTypes.bool.isRequired,
  /** Set the value of tosOptIn input */
  tosOptIn: PropTypes.bool.isRequired,
  /** handles changes in the email input */
  onEmailChange: PropTypes.func.isRequired,
  /** handles changes in input fields */
  onFieldChange: PropTypes.func.isRequired,
  /** specifies whether the email is already registered **/
  emailAlreadyExists: PropTypes.bool,
  /** All props from `StyledCard` */
  ...StyledCard.propTypes,
  /** Oauth Sign In **/
  isOAuth: PropTypes.bool,
  /** Oauth App Name **/
  oAuthAppName: PropTypes.string,
  /** Oauth App Image URL **/
  oAuthAppImage: PropTypes.string,
  data: PropTypes.object,
};

CreateProfile.defaultProps = {
  errors: {},
  submitting: false,
};

export default CreateProfile;
