import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { Form, Formik } from 'formik';
import { get, omit } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../../../lib/constants/collectives';
import roles from '../../../../lib/constants/roles';
import formatMemberRole from '../../../../lib/i18n/member-role';

import Avatar from '../../../Avatar';
import Container from '../../../Container';
import { Box, Flex } from '../../../Grid';
import MemberRoleDescription, { hasRoleDescription } from '../../../MemberRoleDescription';
import StyledInput from '../../../StyledInput';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledSelect from '../../../StyledSelect';
import { P } from '../../../Text';

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
  inValidDateError: { defaultMessage: 'Please enter a valid date' },
});

const MemberForm = props => {
  const { intl, member, collectiveImg, bindSubmitForm, triggerSubmit } = props;

  const [memberRole, setMemberRole] = React.useState(member?.role || roles.ADMIN);

  const memberCollective = member && (member.account || member.memberAccount);

  const initialValues = {
    description: get(member, 'description') || '',
    role: get(member, 'role') || roles.ADMIN,
    since: get(member, 'since')
      ? dayjs(get(member, 'since')).format('YYYY-MM-DD')
      : dayjs(new Date()).format('YYYY-MM-DD'),
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
    if (!dayjs(values.since).isValid()) {
      errors.since = intl.formatMessage(memberFormMessages.inValidDateError);
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

          return (
            <Form>
              <StyledInputFormikField
                name="role"
                htmlFor="memberForm-role"
                label={<P fontWeight="bold"> {intl.formatMessage(memberFormMessages.roleLabel)} </P>}
                mt={3}
              >
                {({ form, field }) => (
                  <React.Fragment>
                    <StyledSelect
                      inputId={field.id}
                      error={field.error}
                      defaultValue={getOptions([memberRole])[0]}
                      onBlur={() => form.setFieldTouched(field.name, true)}
                      onChange={({ value }) => {
                        form.setFieldValue(field.name, value);
                        setMemberRole(value);
                      }}
                      options={getOptions([roles.ADMIN, roles.MEMBER, roles.ACCOUNTANT])}
                    />
                    {hasRoleDescription(memberRole) && (
                      <Flex mb={3}>
                        <Box mx={1} mt={1} fontSize="12px" color="black.600" fontStyle="italic">
                          <MemberRoleDescription role={memberRole} />
                        </Box>
                      </Flex>
                    )}
                  </React.Fragment>
                )}
              </StyledInputFormikField>
              <StyledInputFormikField
                name="description"
                htmlFor="memberForm-description"
                label={<P fontWeight="bold">{intl.formatMessage(memberFormMessages.descriptionLabel)}</P>}
                mt={3}
              >
                {({ field }) => <StyledInput {...field} />}
              </StyledInputFormikField>
              <StyledInputFormikField
                name="since"
                htmlFor="memberForm-since"
                inputType="date"
                label={<P fontWeight="bold">{intl.formatMessage(memberFormMessages.sinceLabel)}</P>}
                mt={3}
                required
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
            </Form>
          );
        }}
      </Formik>
    </Flex>
  );
};

MemberForm.propTypes = {
  bindSubmitForm: PropTypes.func,
  collectiveImg: PropTypes.string,
  intl: PropTypes.object.isRequired,
  member: PropTypes.object,
  triggerSubmit: PropTypes.func,
};

export default injectIntl(MemberForm);
