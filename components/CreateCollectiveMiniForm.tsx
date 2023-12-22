import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Field, Form, Formik } from 'formik';
import { assign, cloneDeep, get, pick } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import roles from '../lib/constants/roles';
import { i18nGraphqlException } from '../lib/errors';
import { gqlV1 } from '../lib/graphql/helpers';
import { isValidEmail } from '../lib/utils';

import Container from './Container';
import { Box } from './Grid';
import InputTypeCountry from './InputTypeCountry';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import StyledInputFormikField from './StyledInputFormikField';
import StyledTextarea from './StyledTextarea';
import { H5 } from './Text';
import { withUser } from './UserProvider';

const CreateNewMessages = defineMessages({
  [CollectiveType.COLLECTIVE]: {
    id: 'Collective.CreateNew',
    defaultMessage: 'Create new Collective',
  },
  [CollectiveType.USER]: {
    id: 'User.InviteNew',
    defaultMessage: 'Invite new User',
  },
  [CollectiveType.EVENT]: {
    id: 'Event.CreateNew',
    defaultMessage: 'Create new Event',
  },
  [CollectiveType.ORGANIZATION]: {
    id: 'Organization.CreateNew',
    defaultMessage: 'Create new Organization',
  },
  [CollectiveType.VENDOR]: {
    id: 'Vendor.CreateNew',
    defaultMessage: 'Create new Vendor',
  },
});

const msg = defineMessages({
  emailTitle: {
    id: 'User.EmailAddress',
    defaultMessage: 'Email address',
  },
  adminEmail: {
    id: 'NewOrganization.Admin.Email',
    defaultMessage: 'Admin email address',
  },
  adminName: {
    id: 'NewOrganization.Admin.Name',
    defaultMessage: 'Admin name',
  },
  legalName: {
    id: 'LegalName',
    defaultMessage: 'Legal Name',
  },
  displayName: {
    id: 'Fields.displayName',
    defaultMessage: 'Display name',
  },
  website: {
    id: 'Fields.website',
    defaultMessage: 'Website',
  },
  cancel: {
    id: 'actions.cancel',
    defaultMessage: 'Cancel',
  },
  save: {
    id: 'save',
    defaultMessage: 'Save',
  },
  saveUser: {
    id: 'InviteUser',
    defaultMessage: 'Invite user',
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
  examples: {
    id: 'examples',
    defaultMessage: 'e.g., {examples}',
  },
});

const labels = defineMessages({
  'location.address': {
    id: 'collective.address.label',
    defaultMessage: 'Address',
  },
  'location.country': {
    id: 'collective.country.label',
    defaultMessage: 'Country',
  },
});

/** Prepare mutation variables based on collective type */
const prepareMutationVariables = collective => {
  const includeLocation = collective.location?.address || collective.location?.country;
  const locationFields = includeLocation ? ['location.address', 'location.country'] : [];

  if (collective.type === CollectiveType.USER) {
    return { user: pick(collective, ['name', 'legalName', 'email', ...locationFields]) };
  } else if (collective.type === CollectiveType.ORGANIZATION) {
    collective.members.forEach(member => (member.role = roles.ADMIN));
    return { collective: pick(collective, ['name', 'legalName', 'type', 'website', 'members', ...locationFields]) };
  } else if (collective.type === CollectiveType.VENDOR) {
    return {
      collective: pick(collective, ['name', 'legalName', 'type', 'website', 'ParentCollectiveId']),
    };
  } else {
    return { collective: pick(collective, ['name', 'type', 'website', ...locationFields]) };
  }
};

const createCollectiveMutation = gqlV1/* GraphQL */ `
  mutation CreateCollectiveMiniForm($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id
      name
      legalName
      slug
      type
      imageUrl(height: 64)
      location {
        id
        address
        country
      }
      members {
        id
        role
        member {
          id
          slug
          name
        }
      }
    }
  }
`;

const createUserMutation = gqlV1/* GraphQL */ `
  mutation CreateUser($user: UserInputType!) {
    createUser(user: $user, throwIfExists: false, sendSignInLink: false) {
      user {
        id
        collective {
          id
          name
          legalName
          slug
          type
          location {
            id
            address
            country
          }
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
const CreateCollectiveMiniForm = ({
  type,
  onCancel,
  onSuccess,
  addLoggedInUserAsAdmin,
  LoggedInUser,
  refetchLoggedInUser,
  excludeAdminFields,
  optionalFields,
  email = '',
  name = '',
  otherInitialValues = {},
}) => {
  const isUser = type === CollectiveType.USER;
  const isCollective = type === CollectiveType.COLLECTIVE;
  const isOrganization = type === CollectiveType.ORGANIZATION;
  const isVendor = type === CollectiveType.VENDOR;
  const noAdminFields = isOrganization && excludeAdminFields;
  const mutation = isUser ? createUserMutation : createCollectiveMutation;
  const [createCollective, { error: submitError }] = useMutation(mutation);
  const intl = useIntl();
  const { formatMessage } = intl;

  const initialValues = {
    ...otherInitialValues,
    members: [{ member: { email, name } }],
    email,
    name,
    website: '',
  };

  const validate = values => {
    const errors: Record<string, unknown> = {};

    if (isOrganization && !excludeAdminFields) {
      if (!get(values, 'members[0].member.email') || !isValidEmail(get(values, 'members[0].member.email'))) {
        errors.members = [{ member: { email: formatMessage(msg.invalidEmail) } }];
      }
      if (!get(values, 'members[0].member.name')) {
        errors.members
          ? (errors.members[0].member.name = formatMessage(msg.invalidName))
          : [{ member: { name: formatMessage(msg.invalidName) } }];
      }
    } else if (isUser) {
      if (!values.email || !isValidEmail(values.email)) {
        errors.email = formatMessage(msg.invalidEmail);
      }
    }
    if (!values.name) {
      errors.name = formatMessage(msg.invalidName);
    }

    return errors;
  };

  const submit = formValues => {
    let values;
    if (excludeAdminFields) {
      const clonedValues = cloneDeep({ ...formValues, type });
      const assignAdmin = pick(clonedValues, ['name', 'legalName', 'website', 'type']);
      values = assign(assignAdmin, { members: [{ member: { id: LoggedInUser.CollectiveId } }] });
    } else {
      values = cloneDeep({ ...formValues, type });
      if (addLoggedInUserAsAdmin && LoggedInUser && values.members) {
        values.members.push({ member: { id: LoggedInUser.CollectiveId } });
      }
    }
    return createCollective({ variables: prepareMutationVariables(values) }).then(({ data }) => {
      if (addLoggedInUserAsAdmin) {
        refetchLoggedInUser();
      }

      return onSuccess(isUser ? data.createUser.user.collective : data.createCollective);
    });
  };

  return (
    <Formik validate={validate} initialValues={initialValues} onSubmit={submit} validateOnChange={true}>
      {formik => {
        const { values, errors, touched, isSubmitting } = formik;

        return (
          <Form data-cy="create-collective-mini-form">
            <H5 fontWeight={600}>{CreateNewMessages[type] ? formatMessage(CreateNewMessages[type]) : null}</H5>
            <Box mt={3}>
              {(isUser || isOrganization) && !noAdminFields && (
                <StyledInputField
                  name={isOrganization ? 'members[0].member.email' : 'email'}
                  htmlFor={isOrganization ? 'members[0].member.email' : 'email'}
                  label={formatMessage(isOrganization ? msg.adminEmail : msg.emailTitle)}
                  error={
                    isOrganization
                      ? get(touched, 'members[0].member.email') && get(errors, 'members[0].member.email')
                      : touched.email && errors.email
                  }
                  mt={3}
                  value={isOrganization ? get(values, 'members[0].member.email') : values.email}
                >
                  {inputProps => (
                    <Field
                      as={StyledInput}
                      {...inputProps}
                      type="email"
                      width="100%"
                      placeholder="e.g., jane-doe@youremail.com"
                      data-cy="mini-form-email-field"
                    />
                  )}
                </StyledInputField>
              )}
              {isOrganization && !noAdminFields && (
                <StyledInputField
                  autoFocus
                  name="members[0].member.name"
                  htmlFor="members[0].member.name"
                  label={formatMessage(msg.adminName)}
                  error={get(touched, 'members[0].member.name') && get(errors, 'members[0].member.name')}
                  mt={3}
                  value={get(values, 'members[0].member.name')}
                >
                  {inputProps => (
                    <Field as={StyledInput} {...inputProps} width="100%" placeholder="e.g., Jane Doe, Frank Zappa" />
                  )}
                </StyledInputField>
              )}
              <StyledInputField
                autoFocus
                name="name"
                htmlFor="name"
                label={formatMessage(msg.displayName)}
                error={touched.name && errors.name}
                mt={3}
                value={values.name}
              >
                {inputProps => (
                  <Field
                    as={StyledInput}
                    {...inputProps}
                    width="100%"
                    placeholder={
                      isUser
                        ? 'e.g., Jane Doe, Frank Zappa'
                        : isCollective
                          ? 'e.g., Webpack, Babel'
                          : 'e.g., AirBnb, TripleByte'
                    }
                    data-cy="mini-form-name-field"
                  />
                )}
              </StyledInputField>
              {(isUser || isOrganization || isVendor) && (
                <StyledInputField
                  name="legalName"
                  htmlFor="legalName"
                  required={false}
                  label={formatMessage(msg.legalName)}
                  mt={3}
                  value={values.legalName}
                  isPrivate={isUser}
                  hint={
                    <FormattedMessage
                      id="editCollective.legalName.description"
                      defaultMessage="Legal names are private and used in receipts, tax forms, payment details on expenses, and other non-public contexts. Legal names are only visible to admins."
                    />
                  }
                >
                  {inputProps => (
                    <Field
                      as={StyledInput}
                      {...inputProps}
                      placeholder={intl.formatMessage(msg.examples, {
                        examples: isUser ? 'Jane Mary Doe, Frank Vincent Zappa' : 'Open Collective Inc.',
                      })}
                      width="100%"
                      data-cy="mini-form-legalName-field"
                    />
                  )}
                </StyledInputField>
              )}
              {!(isUser || isVendor) && (
                <StyledInputField
                  name="website"
                  htmlFor="website"
                  label={formatMessage(msg.website)}
                  error={errors.website}
                  mt={3}
                  value={values.website}
                >
                  {inputProps => (
                    <Field
                      as={StyledInput}
                      {...inputProps}
                      placeholder="e.g., opencollective.com"
                      width="100%"
                      data-cy="mini-form-website-field"
                    />
                  )}
                </StyledInputField>
              )}
              {optionalFields?.map(name => (
                <StyledInputFormikField
                  key={name}
                  name={name}
                  htmlFor={`createCollectiveMiniForm-${name}`}
                  label={formatMessage(labels[name])}
                  required={false}
                  mt={3}
                >
                  {({ field, form }) => {
                    switch (field.name) {
                      case 'location.address':
                        return <StyledTextarea {...field} />;
                      case 'location.country':
                        return (
                          <InputTypeCountry
                            {...field}
                            inputId="location.country"
                            onChange={country => form.setFieldValue(name, country)}
                            maxMenuHeight={95}
                          />
                        );
                      default:
                        return null;
                    }
                  }}
                </StyledInputFormikField>
              ))}
            </Box>
            {submitError && (
              <MessageBox type="error" withIcon mt={2}>
                {i18nGraphqlException(intl, submitError)}
              </MessageBox>
            )}
            <Container
              display="flex"
              flexWrap="wrap"
              justifyContent="flex-end"
              borderTop="1px solid #D7DBE0"
              mt={4}
              pt={3}
            >
              <StyledButton mr={2} minWidth={100} onClick={() => onCancel()} disabled={isSubmitting}>
                {formatMessage(msg.cancel)}
              </StyledButton>
              <StyledButton
                type="submit"
                buttonStyle="primary"
                minWidth={100}
                loading={isSubmitting}
                data-cy="mini-form-save-button"
              >
                {isUser ? formatMessage(msg.saveUser) : formatMessage(msg.save)}
              </StyledButton>
            </Container>
          </Form>
        );
      }}
    </Formik>
  );
};

CreateCollectiveMiniForm.propTypes = {
  /** The collective type to create */
  type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
  /** Called when cancel is clicked */
  onCancel: PropTypes.func.isRequired,
  /** Called with the collective created when the function succeed */
  onSuccess: PropTypes.func.isRequired,
  /** If true, the logged in user will be added as an admin of the collective */
  addLoggedInUserAsAdmin: PropTypes.bool,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
  /** @ignore from withUser */
  refetchLoggedInUser: PropTypes.func,
  /** If true, this does not render the 'admin name' and 'admin email' for create org form */
  excludeAdminFields: PropTypes.bool,
  /** The collective email */
  email: PropTypes.string,
  /** The collective name */
  name: PropTypes.string,
  /** A list of optional fields to include in the form */
  optionalFields: PropTypes.arrayOf(PropTypes.oneOf(['location.address', 'location.country'])),
  /** Any other initial values to pass to the form */
  otherInitialValues: PropTypes.object,
};

export default withUser(CreateCollectiveMiniForm);
