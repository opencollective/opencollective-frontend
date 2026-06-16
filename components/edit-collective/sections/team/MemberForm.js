import React from 'react';
import dayjs from 'dayjs';
import { Form, Formik } from 'formik';
import { get, omit } from 'lodash-es';
import { defineMessages } from 'react-intl';
import { styled } from 'styled-components';

import { CollectiveType } from '../../../../lib/constants/collectives';
import roles from '../../../../lib/constants/roles';
import formatMemberRole from '../../../../lib/i18n/member-role';
import injectIntl from '@/lib/injectIntl';

import Avatar from '../../../Avatar';
import Container from '../../../Container';
import { Box, Flex } from '../../../Grid';
import MemberRoleDescription, { hasRoleDescription } from '../../../MemberRoleDescription';
import StyledInput from '../../../StyledInput';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledSelect from '../../../StyledSelect';
import { P } from '../../../Text';
import { Textarea } from '../../../ui/Textarea';

const MemberContainer = styled(Container)`
  border: 1px solid #dcdee0;
  border-radius: 10px;
  max-width: 250px;
  padding: 16px;
`;

const memberFormMessages = defineMessages({
  roleLabel: { id: 'members.role.label', defaultMessage: 'Role' },
  sinceLabel: { id: 'user.since.label', defaultMessage: 'Since' },
  descriptionLabel: { id: 'Fields.description', defaultMessage: 'Description' },
  privateNoteLabel: { id: 'Expense.PrivateNote', defaultMessage: 'Private note' },
  privateNotePlaceholder: {
    id: 'editTeam.member.invite.privateNote.placeholder',
    defaultMessage: 'Optional message included in the invitation email sent to the invitee.',
  },
  inValidDateError: { defaultMessage: 'Please enter a valid date', id: '6DCLcI' },
});

const MemberForm = props => {
  const {
    intl,
    member,
    collectiveImg,
    bindSubmitForm,
    triggerSubmit,
    isPrivateAccount,
    fixedRole,
    showDescription = true,
    showSince = true,
    showPrivateNote = true,
  } = props;

  const memberCollective = member && (member.account || member.memberAccount);

  const supportedRoles = isPrivateAccount
    ? [roles.ADMIN, roles.ACCOUNTANT]
    : [roles.ADMIN, roles.MEMBER, roles.COMMUNITY_MANAGER, roles.ACCOUNTANT];

  const providedMemberRole = fixedRole || get(member, 'role');
  const initialValues = {
    description: get(member, 'description') || '',
    role: fixedRole || (providedMemberRole && supportedRoles.includes(providedMemberRole) ? providedMemberRole : null),
    since: get(member, 'since')
      ? dayjs(get(member, 'since')).format('YYYY-MM-DD')
      : dayjs(new Date()).format('YYYY-MM-DD'),
    privateNote: '',
  };

  const submit = values => {
    triggerSubmit({
      ...values,
      since: dayjs(values.since).toISOString(),
    });
  };

  const getOptions = arr => {
    return arr.map(key => {
      return { value: key, label: formatMemberRole(intl, key) };
    });
  };

  const validate = values => {
    const errors = {};
    if (showSince && !dayjs(values.since).isValid()) {
      errors.since = intl.formatMessage(memberFormMessages.inValidDateError);
    } else if (!fixedRole && (!values.role || !supportedRoles.includes(values.role))) {
      // "Error.FieldRequired": "This field is required",
      errors.role = intl.formatMessage({ defaultMessage: 'This field is required', id: 'Error.FieldRequired' });
    }
    return errors;
  };

  return (
    <Flex flexDirection="column" justifyContent="center">
      {member && (
        <MemberContainer mb={2} mt={2}>
          <Flex>
            <Container position="relative">
              <Avatar src={get(memberCollective, 'imageUrl')} radius={48} />
              <Container mt={13} position="absolute" bottom="-10%" right="-10%">
                <Avatar type={CollectiveType.COLLECTIVE} backgroundColor="#ffffff" src={collectiveImg} radius={20} />
              </Container>
            </Container>
            <Box mx={10}>
              <P fontSize="16px" lineHeight="24px" fontWeight={500}>
                {get(memberCollective, 'name')}
              </P>
              <P fontSize="13px" lineHeight="20px" color="#4E5052" fontWeight={400}>
                {formatMemberRole(intl, get(member, 'role'))}
              </P>
            </Box>
          </Flex>
        </MemberContainer>
      )}
      <Formik validate={validate} initialValues={initialValues} onSubmit={submit} validateOnChange>
        {formik => {
          const { submitForm } = formik;

          bindSubmitForm(submitForm);
          const allRoleOptions = getOptions(Object.values(roles));
          const filteredRoleOptions = allRoleOptions.filter(option => supportedRoles.includes(option.value));
          return (
            <Form className="flex flex-col gap-2">
              {!fixedRole && (
                <StyledInputFormikField
                  name="role"
                  htmlFor="memberForm-role"
                  label={<P fontWeight="bold"> {intl.formatMessage(memberFormMessages.roleLabel)} </P>}
                >
                  {({ form, field }) => (
                    <React.Fragment>
                      <StyledSelect
                        inputId={field.id}
                        error={field.error}
                        value={field.value ? allRoleOptions.find(option => option.value === field.value) : null}
                        onBlur={() => form.setFieldTouched(field.name, true)}
                        onChange={({ value }) => {
                          form.setFieldValue(field.name, value);
                        }}
                        options={filteredRoleOptions}
                      />
                      {Boolean(field.value && hasRoleDescription(field.value)) && (
                        <div className="mt-2 gap-1 text-xs text-muted-foreground">
                          <MemberRoleDescription role={field.value} />
                        </div>
                      )}
                    </React.Fragment>
                  )}
                </StyledInputFormikField>
              )}
              {showDescription && (
                <StyledInputFormikField
                  name="description"
                  htmlFor="memberForm-description"
                  label={<P fontWeight="bold">{intl.formatMessage(memberFormMessages.descriptionLabel)}</P>}
                >
                  {({ field }) => <StyledInput {...field} />}
                </StyledInputFormikField>
              )}
              {showSince && (
                <StyledInputFormikField
                  name="since"
                  htmlFor="memberForm-since"
                  inputType="date"
                  label={<P fontWeight="bold">{intl.formatMessage(memberFormMessages.sinceLabel)}</P>}
                >
                  {({ form, field }) => (
                    <StyledInput
                      {...omit(field, ['value', 'onChange', 'onBlur'])}
                      required
                      onChange={event => {
                        form.setFieldValue(field.name, event.target.value);
                      }}
                      defaultValue={field.value}
                    />
                  )}
                </StyledInputFormikField>
              )}
              {showPrivateNote && (
                <StyledInputFormikField
                  name="privateNote"
                  htmlFor="memberForm-privateNote"
                  label={<P fontWeight="bold">{intl.formatMessage(memberFormMessages.privateNoteLabel)}</P>}
                >
                  {({ form, field }) => (
                    <Textarea
                      id={field.id}
                      name={field.name}
                      value={field.value}
                      className="min-h-20"
                      onChange={event => form.setFieldValue(field.name, event.target.value)}
                      onBlur={() => form.setFieldTouched(field.name, true)}
                      placeholder={intl.formatMessage(memberFormMessages.privateNotePlaceholder)}
                    />
                  )}
                </StyledInputFormikField>
              )}
            </Form>
          );
        }}
      </Formik>
    </Flex>
  );
};

export default injectIntl(MemberForm);
