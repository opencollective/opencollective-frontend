import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { pick } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { Link } from '../server/pages';
import Container from './Container';
import { P } from './Text';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledInputField from './StyledInputField';
import StyledInputGroup from './StyledInputGroup';
import StyledInput from './StyledInput';
import StyledLink from './StyledLink';
import StyledCheckbox from './StyledCheckbox';

const messages = defineMessages({
  newsletter: {
    id: 'newsletter.label',
    defaultMessage: 'Receive our monthly newsletter',
  },
});

const Tab = ({ active, children, setActive }) => (
  <Container
    bg={active ? 'white.full' : 'black.50'}
    color="black.700"
    cursor="pointer"
    px={4}
    py={3}
    textAlign="center"
    width={0.5}
    tabIndex={0}
    onClick={setActive}
    onKeyDown={event => event.key === 'Enter' && setActive(event)}
  >
    <P fontWeight={active ? '600' : 'normal'}>{children}</P>
  </Container>
);

Tab.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  setActive: PropTypes.func,
};

const SecondaryAction = ({ children, loading, onSecondaryAction }) => {
  return typeof onSecondaryAction === 'string' ? (
    <Link route={onSecondaryAction} passHref>
      <StyledLink disabled={loading} fontSize="Paragraph" fontWeight="bold">
        {children}
      </StyledLink>
    </Link>
  ) : (
    <StyledButton asLink fontSize="Paragraph" fontWeight="bold" onClick={onSecondaryAction} disabled={loading}>
      {children}
    </StyledButton>
  );
};

SecondaryAction.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool,
  onSecondaryAction: PropTypes.func,
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

const useForm = ({ onEmailChange, errors }) => {
  const [state, setState] = useState({ errors, newsletterOptIn: false });

  return {
    getFieldProps: name => ({
      defaultValue: state[name] || '',
      fontSize: 'Paragraph',
      lineHeight: 'Paragraph',
      type: 'text',
      width: 1,
      onChange: ({ target }) => {
        // Email state is not local so any changes should be handled seprately
        if (target.name === 'email') {
          onEmailChange(target.value);
          setState({
            ...state,
            errors: { ...state.errors, [target.name]: null },
          });
        } else {
          setState({
            ...state,
            [target.name]: target.value,
            errors: { ...state.errors, [target.name]: null },
          });
        }
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
  submitting,
  errors,
  onEmailChange,
  onPersonalSubmit,
  onOrgSubmit,
  onSecondaryAction,
  ...props
}) => {
  const [tab, setTab] = useState('personal');
  const { getFieldError, getFieldProps, state } = useForm({ onEmailChange, errors });

  return (
    <StyledCard width={1} maxWidth={480} {...props}>
      <Flex>
        <Tab active={tab === 'personal'} setActive={() => setTab('personal')}>
          <FormattedMessage id="contribution.createPersoProfile" defaultMessage="Create Personal Profile" />
        </Tab>
        <Tab active={tab === 'organization'} setActive={() => setTab('organization')}>
          <FormattedMessage id="contribution.createOrgProfile" defaultMessage="Create Organization Profile" />
        </Tab>
      </Flex>

      {tab === 'personal' && (
        <Box
          as="form"
          p={4}
          onSubmit={event => {
            event.preventDefault();
            const data = pick(state, ['firstName', 'lastName', 'newsletterOptIn']);
            onPersonalSubmit({ ...data, email });
          }}
          method="POST"
        >
          <Box mb={3}>
            <StyledInputField label="Email" htmlFor="email" error={getFieldError('email')}>
              {inputProps => (
                <StyledInput
                  {...inputProps}
                  {...getFieldProps(inputProps.name)}
                  type="email"
                  placeholder="i.e. yourname@yourhost.com"
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

          <Box mb={3}>
            <StyledInputField label="First Name" htmlFor="firstName" error={getFieldError('firstName')}>
              {inputProps => <StyledInput {...inputProps} {...getFieldProps(inputProps.name)} />}
            </StyledInputField>
          </Box>

          <Box mb={4}>
            <StyledInputField label="Last Name" htmlFor="lastName" error={getFieldError('lastName')}>
              {inputProps => <StyledInput {...inputProps} {...getFieldProps(inputProps.name)} />}
            </StyledInputField>
          </Box>

          <Box mb={4}>
            <NewsletterCheckBox checked={state.newsletterOptIn} {...getFieldProps('newsletterOptIn')} />
          </Box>

          <StyledButton
            buttonStyle="primary"
            disabled={!email}
            width={1}
            type="submit"
            fontWeight="600"
            loading={submitting}
          >
            <FormattedMessage id="contribution.createPersoProfile" defaultMessage="Create Personal Profile" />
          </StyledButton>
        </Box>
      )}

      {tab === 'organization' && (
        <Box
          as="form"
          p={4}
          onSubmit={event => {
            event.preventDefault();
            const data = pick(state, [
              'firstName',
              'lastName',
              'orgName',
              'website',
              'githubHandle',
              'twitterHandle',
              'newsletterOptIn',
            ]);
            onOrgSubmit({ ...data, email });
          }}
          method="POST"
        >
          <P fontSize="LeadParagraph" lineHeight="LeadParagraph" color="black.600" mb={3} fontWeight="500">
            Your personal information
          </P>
          <Box mb={3}>
            <StyledInputField label="Email" htmlFor="email" error={getFieldError('email')}>
              {inputProps => (
                <StyledInput
                  {...inputProps}
                  {...getFieldProps(inputProps.name)}
                  type="email"
                  value={email}
                  placeholder="i.e. yourname@yourhost.com"
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

          <Box mb={3}>
            <StyledInputField label="First Name" htmlFor="firstName" error={getFieldError('firstName')}>
              {inputProps => <StyledInput {...inputProps} {...getFieldProps(inputProps.name)} />}
            </StyledInputField>
          </Box>

          <Box mb={4}>
            <StyledInputField label="Last Name" htmlFor="lastName" error={getFieldError('lastName')}>
              {inputProps => <StyledInput {...inputProps} {...getFieldProps(inputProps.name)} />}
            </StyledInputField>
          </Box>

          <P fontSize="LeadParagraph" lineHeight="LeadParagraph" color="black.600" mb={3} fontWeight="500">
            Organization&apos;s information
          </P>
          <Box mb={3}>
            <StyledInputField label="Org Name" htmlFor="orgName" error={getFieldError('orgName')}>
              {inputProps => (
                <StyledInput
                  {...inputProps}
                  {...getFieldProps(inputProps.name)}
                  placeholder="i.e. AirBnb, Women Who Code"
                  required
                />
              )}
            </StyledInputField>
          </Box>

          <Box mb={3}>
            <StyledInputField label="Website" htmlFor="website" error={getFieldError('website')}>
              {inputProps => <StyledInput {...inputProps} {...getFieldProps(inputProps.name)} type="url" />}
            </StyledInputField>
          </Box>

          <Box mb={3}>
            <StyledInputField label="GitHub (optional)" htmlFor="githubHandle" error={getFieldError('githubHandle')}>
              {inputProps => (
                <StyledInputGroup {...inputProps} {...getFieldProps(inputProps.name)} prepend="github.com/" />
              )}
            </StyledInputField>
          </Box>

          <Box mb={4}>
            <StyledInputField label="Twitter (optional)" htmlFor="twitterHandle" error={getFieldError('twitterHandle')}>
              {inputProps => <StyledInputGroup {...inputProps} {...getFieldProps(inputProps.name)} prepend="@" />}
            </StyledInputField>
          </Box>

          <Box mb={4}>
            <NewsletterCheckBox checked={state.newsletterOptIn} {...getFieldProps('newsletterOptIn')} />
          </Box>

          <StyledButton
            buttonStyle="primary"
            disabled={!email || !state.orgName}
            width={1}
            type="submit"
            fontWeight="600"
            loading={submitting}
          >
            <FormattedMessage id="contribution.createOrgProfile" defaultMessage="Create Organization Profile" />
          </StyledButton>
        </Box>
      )}

      <Container alignItems="center" bg="black.50" display="flex" justifyContent="space-between" px={4} py={3}>
        <P color="black.700">Already have an account?</P>
        <SecondaryAction onSecondaryAction={onSecondaryAction} loading={submitting}>
          <FormattedMessage id="signIn" defaultMessage="Sign In" />
        </SecondaryAction>
      </Container>
    </StyledCard>
  );
};

CreateProfile.propTypes = {
  /** a map of errors to the matching field name, i.e. `{ email: 'Invalid email' }` will display that message until the email field */
  errors: PropTypes.objectOf(PropTypes.string),
  /** handles submissions of personal profile form */
  onPersonalSubmit: PropTypes.func.isRequired,
  /** handles submission of organization profile form */
  onOrgSubmit: PropTypes.func.isRequired,
  /** handles redirect from profile create, i.e. Sign In */
  onSecondaryAction: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
  /** Disable submit and show a spinner on button when set to true */
  submitting: PropTypes.bool,
  /** Set the value of email input */
  email: PropTypes.string.isRequired,
  /** handles changes in the email input */
  onEmailChange: PropTypes.func.isRequired,
  /** All props from `StyledCard` */
  ...StyledCard.propTypes,
};

CreateProfile.defaultProps = {
  errors: {},
  submitting: false,
};

export default CreateProfile;
