import React from 'react';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import { Box } from '@rebass/grid';
import { isEmpty, pick } from 'lodash';
import { isEmail, isURL } from 'validator';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';

import { getErrorFromGraphqlException } from '../lib/utils';
import { CollectiveType } from '../lib/constants/collectives';
import { H5 } from './Text';
import StyledInputField from './StyledInputField';
import StyledInput from './StyledInput';
import Container from './Container';
import StyledButton from './StyledButton';
import MessageBox from './MessageBox';

const CreateNewMessages = defineMessages({
  [CollectiveType.COLLECTIVE]: {
    id: 'Collective.CreateNew',
    defaultMessage: 'Create new Collective',
  },
  [CollectiveType.USER]: {
    id: 'User.CreateNew',
    defaultMessage: 'Create new user',
  },
  [CollectiveType.EVENT]: {
    id: 'Event.CreateNew',
    defaultMessage: 'Create new event',
  },
  [CollectiveType.ORGANIZATION]: {
    id: 'Organization.CreateNew',
    defaultMessage: 'Create new Organization',
  },
});

const msg = defineMessages({
  emailTitle: {
    id: 'EditUserEmailForm.title',
    defaultMessage: 'Email address',
  },
  name: {
    id: 'Collective.Name',
    defaultMessage: 'Name',
  },
  fullName: {
    id: 'User.FullName',
    defaultMessage: 'Full name',
  },
  website: {
    id: 'collective.website.label',
    defaultMessage: 'Website',
  },
  cancel: {
    id: 'cancel',
    defaultMessage: 'Cancel',
  },
  save: {
    id: 'save',
    defaultMessage: 'Save',
  },
  invalidEmail: {
    id: 'error.email.invalid',
    defaultMessage: 'Invalid email address',
  },
  invalidWebsite: {
    id: 'error.website.invalid',
    defaultMessage: 'Invalid website address',
  },
  invalidName: {
    id: 'error.name.invalid',
    defaultMessage: 'Name is required',
  },
});

const getErrors = collective => {
  const errors = {};
  if (collective.type === CollectiveType.USER) {
    if (!collective.email || !isEmail(collective.email)) {
      errors.email = true;
    }
  }

  if (!collective.name || collective.name.length < 2) {
    errors.name = true;
  }

  if (collective.website && !isURL(collective.website)) {
    errors.website = true;
  }

  return errors;
};

const prepareMutationVariables = collective => {
  if (collective.type === CollectiveType.USER) {
    return { user: pick(collective, ['name', 'email']) };
  } else {
    return { collective: pick(collective, ['name', 'type', 'website']) };
  }
};

const CreateCollectiveMutation = gql`
  mutation CreateCollective($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id
      name
      slug
      type
      imageUrl(height: 64)
    }
  }
`;

const CreateUserMutation = gql`
  mutation CreateUser($user: UserInputType!) {
    createUser(user: $user, throwIfExists: false, sendSignInLink: false) {
      user {
        id
        collective {
          id
          name
          slug
          type
          imageUrl(height: 64)
          ... on User {
            email
          }
        }
      }
    }
  }
`;

/**
 * A mini-form to create collectives/orgs/users. Meant to be embed in popups or
 * small component where we want to provide just the essential fields.
 */
const CreateCollectiveMiniForm = ({ type, onCancel, onSuccess }) => {
  const isUser = type === CollectiveType.USER;
  const isCollective = type === CollectiveType.COLLECTIVE;
  const [createCollective, { loading, error }] = useMutation(isUser ? CreateUserMutation : CreateCollectiveMutation);
  const [collective, setCollective] = React.useState({ type });
  const [showErrors, setShowErrors] = React.useState({});
  const { formatMessage } = useIntl();
  const errors = getErrors(collective);
  const hasErrors = !isEmpty(errors);
  const i18nTitle = CreateNewMessages[type];

  // Form helpers
  const setValue = e => {
    setCollective({ ...collective, type, [e.target.name]: e.target.value });
    setShowErrors({ ...showErrors, [e.target.name]: false });
  };

  const onBlur = e => {
    setShowErrors({ ...showErrors, [e.target.name]: true });
  };

  const getError = field => {
    if (!showErrors[field] || !errors[field]) {
      return undefined;
    } else if (field === 'email') {
      return formatMessage(msg.invalidEmail);
    } else if (field === 'website') {
      return formatMessage(msg.invalidWebsite);
    } else if (field === 'name') {
      return formatMessage(msg.invalidName);
    } else {
      return true;
    }
  };

  return (
    <div>
      <H5 fontWeight={600}>{i18nTitle && formatMessage(i18nTitle)}</H5>
      <Box mt={3}>
        {isUser && (
          <StyledInputField htmlFor="email" error={getError('email')} label={formatMessage(msg.emailTitle)} mt={3}>
            {inputProps => (
              <StyledInput
                {...inputProps}
                type="email"
                placeholder="i.e. john-smith@youremail.com"
                onChange={setValue}
                onBlur={onBlur}
                required
              />
            )}
          </StyledInputField>
        )}
        <StyledInputField
          autoFocus
          htmlFor="name"
          error={getError('name')}
          label={formatMessage(isUser ? msg.fullName : msg.name)}
          mt={3}
        >
          {inputProps => (
            <StyledInput
              {...inputProps}
              onChange={setValue}
              onBlur={onBlur}
              required
              placeholder={
                isUser ? 'i.e. John Doe, Frank Zappa' : isCollective ? 'i.e. Webpack, Babel' : 'i.e. AirBnb, TripleByte'
              }
            />
          )}
        </StyledInputField>
        {!isUser && (
          <StyledInputField
            htmlFor="website"
            error={getError('website')}
            label={formatMessage(msg.website)}
            required={false}
            mt={3}
          >
            {inputProps => (
              <StyledInput {...inputProps} placeholder="i.e. opencollective.com" onChange={setValue} onBlur={onBlur} />
            )}
          </StyledInputField>
        )}
      </Box>
      {error && (
        <MessageBox type="error" withIcon mt={2}>
          {getErrorFromGraphqlException(error).message}
        </MessageBox>
      )}
      <Container display="flex" flexWrap="wrap" justifyContent="flex-end" borderTop="1px solid #D7DBE0" mt={4} pt={3}>
        <StyledButton mr={2} minWidth={100} onClick={() => onCancel()}>
          {formatMessage(msg.cancel)}
        </StyledButton>
        <StyledButton
          buttonStyle="primary"
          minWidth={100}
          disabled={hasErrors}
          loading={loading}
          onClick={() =>
            createCollective({ variables: prepareMutationVariables(collective) }).then(({ data }) => {
              return onSuccess(isUser ? data.createUser.user.collective : data.createCollective);
            })
          }
        >
          {formatMessage(msg.save)}
        </StyledButton>
      </Container>
    </div>
  );
};

CreateCollectiveMiniForm.propTypes = {
  /** The collective type to create */
  type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
  /** Called when cancel is clicked */
  onCancel: PropTypes.func.isRequired,
  /** Called with the collective created when the function succeed */
  onSuccess: PropTypes.func.isRequired,
};

export default CreateCollectiveMiniForm;
