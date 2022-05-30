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
import StyledLink from './StyledLink';
import { P } from './Text';

const messages = defineMessages({
  heading: {
    defaultMessage: 'Create your personal account',
  },
  subHeading: {
    defaultMessage: 'Set up your personal details to continue',
  },
  newsletter: {
    id: 'newsletter.label',
    defaultMessage: 'Receive our monthly newsletter',
  },
  nameLabel: {
    defaultMessage: 'Your name',
  },
  email: {
    defaultMessage: 'Your email',
  },
  disclaimer: {
    defaultMessage: 'I agree with the terms of service of Open Collective',
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

const SecondaryAction = ({ children, loading, onSecondaryAction }) => {
  return typeof onSecondaryAction === 'string' ? (
    <StyledLink as={Link} href={onSecondaryAction} disabled={loading} fontSize="14px">
      {children}
    </StyledLink>
  ) : (
    <StyledButton asLink fontSize="14px" onClick={onSecondaryAction} disabled={loading}>
      {children}
    </StyledButton>
  );
};

SecondaryAction.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool,
  onSecondaryAction: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
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
  const intl = useIntl();
  return (
    <StyledCheckbox
      onChange={({ checked, name }) => onChange({ target: { name, value: checked } })}
      checked={checked}
      name="tosOptIn"
      label={intl.formatMessage(messages.disclaimer)}
    />
  );
};

TOSCheckBox.propTypes = {
  onChange: PropTypes.func,
  checked: PropTypes.bool,
};

const useForm = ({ onEmailChange, errors }) => {
  const [state, setState] = useState({ errors, newsletterOptIn: false, tosOptIn: false });

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
        }
        setState({
          ...state,
          [target.name]: value,
          errors: state.errors,
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

const CreateProfileV2 = ({ email, submitting, errors, onEmailChange, onSubmit, ...props }) => {
  const { formatMessage } = useIntl();
  const { getFieldError, getFieldProps, state } = useForm({ onEmailChange, errors, formatMessage });
  const isValid = isEmpty(compact(values(state.errors)));

  return (
    <React.Fragment>
      <Flex>
        <Image src="/static/images/create-profile-page-logo.png" alt="Open Collective logo" height={160} width={160} />
        <Container mt="16px">
          <Flex fontSize="32px" fontWeight="700" color="black.900" lineHeight="40px">
            {formatMessage(messages.heading)}
          </Flex>
          <Flex fontSize="16px" fontWeight="500" color="black.700" lineHeight="24px" pt="14px">
            {formatMessage(messages.subHeading)}
          </Flex>
        </Container>
      </Flex>
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
                  <StyledInput {...inputProps} {...getFieldProps(inputProps.name)} placeholder="e.g., John Doe" />
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
              <NewsletterCheckBox checked={state.newsletterOptIn} {...getFieldProps('newsletterOptIn')} />
            </Box>
            <Box mt="17px">
              <TOSCheckBox checked={state.tosOptIn} {...getFieldProps('tosOptIn')} />
            </Box>
          </Box>
        </StyledCard>
        <MessageBox type="info" mt="24px">
          <Box fontSize="13px" fontWeight={700}>
            <FormattedMessage defaultMessage="Do you want to create an organization profile?" />
          </Box>
          <Box mt="8px" fontSize="12px" fontWeight={400}>
            <FormattedMessage
              defaultMessage="You are creating your personal account first, once inside, you will be able to create a profile for your business to appear as financial contributor, enable your employees to contribute on behalf of your company, and more. <Link>Read more about organizations</Link>"
              values={{
                Link: getI18nLink({
                  href: `https://docs.opencollective.com/help/financial-contributors/organizations#what-is-an-organization`,
                  openInNewTab: true,
                }),
              }}
            />
          </Box>
        </MessageBox>
        <Flex justifyContent="center">
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

CreateProfileV2.propTypes = {
  /** a map of errors to the matching field name, e.g., `{ email: 'Invalid email' }` will display that message until the email field */
  errors: PropTypes.objectOf(PropTypes.string),
  /** handles submissions of personal profile form */
  onSubmit: PropTypes.func.isRequired,
  /** Disable submit and show a spinner on button when set to true */
  submitting: PropTypes.bool,
  /** Set the value of email input */
  email: PropTypes.string.isRequired,
  /** handles changes in the email input */
  onEmailChange: PropTypes.func.isRequired,
  /** All props from `StyledCard` */
  ...StyledCard.propTypes,
};

CreateProfileV2.defaultProps = {
  errors: {},
  submitting: false,
};

export default CreateProfileV2;
