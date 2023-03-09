import React from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { Form, Formik } from 'formik';
import { get, trim } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { suggestSlug } from '../../lib/collective.lib';
import { requireFields, verifyChecked, verifyFieldLength } from '../../lib/form-utils';
import withData from '../../lib/withData';

import Avatar from '../Avatar';
import CollectivePickerAsync from '../CollectivePickerAsync';
import NextIllustration from '../collectives/HomeNextIllustration';
import CollectiveTagsInput from '../CollectiveTagsInput';
import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import MessageBox from '../MessageBox';
import OnboardingProfileCard from '../onboarding-modal/OnboardingProfileCard';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import StyledLink from '../StyledLink';
import StyledTextarea from '../StyledTextarea';
import { H1, P } from '../Text';

export const BackButton = styled(StyledButton)`
  color: ${themeGet('colors.black.600')};
  font-size: 14px;
`;

const ContainerWithImage = styled(Container)`
  width: 100%;
  @media screen and (min-width: 40em) {
    background: url('/static/images/create-collective/formIllustration.png');
    background-repeat: no-repeat;
    background-size: 40%;
    background-position: right 17px bottom;
  }
`;

const placeholders = {
  name: 'Agora Collective',
  slug: 'agora',
};

const messages = defineMessages({
  nameLabel: { id: 'createCollective.form.nameLabel', defaultMessage: 'Collective name' },
  slugLabel: { id: 'createCollective.form.slugLabel', defaultMessage: 'Set your URL' },
  suggestedLabel: { id: 'createCollective.form.suggestedLabel', defaultMessage: 'Suggested' },
  descriptionLabel: {
    id: 'createCollective.form.descriptionLabel',
    defaultMessage: 'What does your Collective do?',
  },
  tagsLabel: { id: 'Tags', defaultMessage: 'Tags' },
  descriptionHint: {
    id: 'createCollective.form.descriptionHint',
    defaultMessage: 'Write a short description (150 characters max)',
  },
  descriptionPlaceholder: {
    id: 'create.collective.placeholder',
    defaultMessage: 'Making the world a better place',
  },
  errorSlugHyphen: {
    id: 'createCollective.form.error.slug.hyphen',
    defaultMessage: 'Collective slug URL cannot start or end with a hyphen',
  },
});

const LABEL_STYLES = { fontWeight: 500, fontSize: '14px', lineHeight: '17px' };

class CreateCollectiveForm extends React.Component {
  static propTypes = {
    error: PropTypes.string,
    host: PropTypes.object,
    loading: PropTypes.bool,
    onSubmit: PropTypes.func,
    intl: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    router: PropTypes.object.isRequired,
    loggedInUser: PropTypes.object,
    popularTags: PropTypes.arrayOf(PropTypes.string),
  };

  hasHostTerms() {
    if (!this.props.host) {
      return false;
    } else {
      return Boolean(this.props.host.termsUrl);
    }
  }

  render() {
    const { intl, error, host, loading, popularTags, loggedInUser } = this.props;
    const hasHostTerms = this.hasHostTerms();

    const initialValues = {
      name: '',
      description: '',
      slug: '',
      message: '',
      tos: false,
      hostTos: false,
      inviteMembers: [],
    };

    const validate = values => {
      const errors = requireFields(values, ['name', 'slug', 'description']);

      if (values.slug !== trim(values.slug, '-')) {
        errors.slug = intl.formatMessage(messages.errorSlugHyphen);
      }

      verifyFieldLength(intl, errors, values, 'name', 1, 50);
      verifyFieldLength(intl, errors, values, 'slug', 1, 30);
      verifyFieldLength(intl, errors, values, 'description', 1, 160);
      verifyFieldLength(intl, errors, values, 'message', 0, 3000);

      verifyChecked(errors, values, 'tos');
      if (hasHostTerms) {
        verifyChecked(errors, values, 'hostTos');
      }

      return errors;
    };

    const submit = values => {
      const { description, name, slug, message, tags, inviteMembers } = values;
      this.props.onSubmit({ collective: { name, description, slug, tags }, message, inviteMembers });
    };

    return (
      <Grid gridTemplateColumns={['1fr', null, null, '1fr 576px 1fr']} pt={48}>
        <Container
          display={['none', null, null, 'flex']}
          minHeight="32px"
          justifyContent="center"
          alignItems="flex-start"
        >
          <BackButton asLink onClick={() => window && window.history.back()}>
            ←&nbsp;
            <FormattedMessage id="Back" defaultMessage="Back" />
          </BackButton>
        </Container>
        <Box>
          <Flex flexDirection="column" mb={[2, 4, 48]} px={2} pt={2}>
            {host ? (
              <Flex justifyContent="center" alignItems="center">
                <Box mr={3}>
                  <Avatar radius={96} collective={host} />
                </Box>
                <Box maxWidth={345}>
                  <H1
                    fontSize={['20px', '32px']}
                    lineHeight={['24px', '40px']}
                    fontWeight="500"
                    textAlign="left"
                    color="black.900"
                  >
                    <FormattedMessage
                      id="host.applyTo"
                      defaultMessage="Apply to {hostName}"
                      values={{ hostName: host.name }}
                    />
                  </H1>
                </Box>
              </Flex>
            ) : (
              <div>
                <Box mb={[2, 3]}>
                  <H1
                    fontSize={['20px', '32px']}
                    lineHeight={['24px', '36px']}
                    fontWeight="bold"
                    textAlign="center"
                    color="black.900"
                  >
                    <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
                  </H1>
                </Box>
                <P fontSize="16px" color="black.600" textAlign="center" mb={2}>
                  <FormattedMessage
                    id="createCollective.subtitle.introduce"
                    defaultMessage="Introduce your Collective to the community."
                  />
                </P>
              </div>
            )}
          </Flex>
          {error && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon mb={[1, 3]} data-cy="ccf-error-message">
                {error}
              </MessageBox>
            </Flex>
          )}
          <Flex alignItems="center" justifyContent="center">
            <ContainerWithImage
              mb={[1, 5]}
              border={[null, '1px solid #E6E8EB']}
              borderRadius={[0, '8px']}
              maxWidth={576}
              px={[2, 4]}
              pb={[0, 90]}
            >
              <Formik validate={validate} initialValues={initialValues} onSubmit={submit} validateOnChange={true}>
                {formik => {
                  const { values, handleSubmit, touched, setFieldValue } = formik;

                  const handleSlugChange = e => {
                    if (!touched.slug) {
                      setFieldValue('slug', suggestSlug(e.target.value));
                    }
                  };

                  return (
                    <Form data-cy="ccf-form">
                      <StyledInputFormikField
                        name="name"
                        htmlFor="collective-name-input"
                        labelProps={LABEL_STYLES}
                        label={intl.formatMessage(messages.nameLabel)}
                        onChange={handleSlugChange}
                        required
                        mt={4}
                        mb={3}
                        data-cy="ccf-form-name"
                      >
                        {({ field }) => <StyledInput {...field} placeholder={placeholders.name} />}
                      </StyledInputFormikField>
                      <StyledInputFormikField
                        name="slug"
                        htmlFor="collective-slug-input"
                        labelProps={LABEL_STYLES}
                        label={intl.formatMessage(messages.slugLabel)}
                        value={values.slug}
                        required
                        mt={3}
                        mb={2}
                        data-cy="ccf-form-slug"
                      >
                        {({ field }) => (
                          <StyledInputGroup
                            onChange={e => setFieldValue('slug', e.target.value)}
                            {...field}
                            prepend="opencollective.com/"
                            placeholder={placeholders.slug}
                          />
                        )}
                      </StyledInputFormikField>
                      {values.name.length > 0 && !touched.slug && (
                        <P fontSize="10px" color="black.600" fontStyle="italic">
                          {intl.formatMessage(messages.suggestedLabel)}
                        </P>
                      )}
                      <StyledInputFormikField
                        name="description"
                        htmlFor="description"
                        labelProps={LABEL_STYLES}
                        label={intl.formatMessage(messages.descriptionLabel)}
                        value={values.description}
                        required
                        mt={3}
                        mb={2}
                        data-cy="ccf-form-description"
                      >
                        {({ field }) => (
                          <StyledInput {...field} placeholder={intl.formatMessage(messages.descriptionPlaceholder)} />
                        )}
                      </StyledInputFormikField>
                      <P fontSize="11px" color="black.600">
                        {intl.formatMessage(messages.descriptionHint)}
                      </P>
                      {host && (
                        <Box mt={3} mb={2}>
                          <P {...LABEL_STYLES}>
                            <FormattedMessage id="onboarding.admins.header" defaultMessage="Add administrators" />
                          </P>
                          <Flex mt={1} width="100%">
                            <P my={2} fontSize="9px" textTransform="uppercase" color="black.700" letterSpacing="0.06em">
                              <FormattedMessage id="AddedAdministrators" defaultMessage="Added Administrators" />
                              {host?.policies?.COLLECTIVE_MINIMUM_ADMINS &&
                                ` (${1 + values.inviteMembers.length}/${
                                  host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins
                                })`}
                            </P>
                            <Flex flexGrow={1} alignItems="center">
                              <StyledHr width="100%" ml={2} borderColor="black.300" />
                            </Flex>
                          </Flex>
                          <Flex width="100%" flexWrap="wrap" data-cy="profile-card">
                            <OnboardingProfileCard
                              key={loggedInUser.collective.id}
                              collective={loggedInUser.collective}
                            />
                            {values.inviteMembers?.map(invite => (
                              <OnboardingProfileCard
                                key={invite.memberAccount.id}
                                collective={invite.memberAccount}
                                removeAdmin={() =>
                                  setFieldValue(
                                    'inviteMembers',
                                    values.inviteMembers.filter(i => i.memberAccount.id !== invite.memberAccount.id),
                                  )
                                }
                              />
                            ))}
                          </Flex>
                          <Flex mt={1} width="100%">
                            <P my={2} fontSize="9px" textTransform="uppercase" color="black.700" letterSpacing="0.06em">
                              <FormattedMessage id="InviteAdministrators" defaultMessage="Invite Administrators" />
                            </P>
                            <Flex flexGrow={1} alignItems="center">
                              <StyledHr width="100%" ml={2} borderColor="black.300" />
                            </Flex>
                          </Flex>
                          <Box>
                            <CollectivePickerAsync
                              inputId="onboarding-admin-picker"
                              creatable
                              collective={null}
                              types={['USER']}
                              data-cy="admin-picker"
                              filterResults={collectives =>
                                collectives.filter(
                                  collective =>
                                    !values.inviteMembers.some(invite => invite.memberAccount.id === collective.id),
                                )
                              }
                              onChange={option => {
                                setFieldValue('inviteMembers', [
                                  ...values.inviteMembers,
                                  { role: 'ADMIN', memberAccount: option.value },
                                ]);
                              }}
                            />
                          </Box>

                          {host?.policies?.COLLECTIVE_MINIMUM_ADMINS && (
                            <MessageBox type="info" mt={3} fontSize="13px">
                              <FormattedMessage
                                defaultMessage="Your selected Fiscal Host requires you to add a minimum of {numberOfAdmins, plural, one {# admin} other {# admins} }. You can manage your admins from the Collective Settings."
                                values={host.policies.COLLECTIVE_MINIMUM_ADMINS}
                              />
                            </MessageBox>
                          )}
                        </Box>
                      )}
                      <StyledInputFormikField
                        name="tags"
                        htmlFor="tags"
                        labelProps={LABEL_STYLES}
                        label={intl.formatMessage(messages.tagsLabel)}
                        value={values.tags}
                        required
                        mt={3}
                        mb={2}
                        data-cy="ccf-form-tags"
                      >
                        {({ field }) => (
                          <CollectiveTagsInput
                            {...field}
                            onChange={tags => {
                              formik.setFieldValue(
                                'tags',
                                tags.map(t => t.value.toLowerCase()),
                              );
                            }}
                            suggestedTags={popularTags}
                          />
                        )}
                      </StyledInputFormikField>
                      <MessageBox type="info" mt={3}>
                        <FormattedMessage
                          id="collective.tags.info"
                          defaultMessage="Tags help you improve your group’s discoverability and connect with similar initiatives across the world."
                        />
                      </MessageBox>
                      {host && (
                        <StyledInputFormikField
                          name="message"
                          htmlFor="apply-create-message"
                          labelProps={LABEL_STYLES}
                          required={false}
                          mt={24}
                          label={
                            get(host, 'settings.applyMessage') || (
                              <FormattedMessage
                                id="ApplyToHost.WriteMessage"
                                defaultMessage="Message to the Fiscal Host"
                              />
                            )
                          }
                        >
                          {({ field }) => (
                            <StyledTextarea {...field} width="100%" minHeight={76} maxLength={3000} showCount />
                          )}
                        </StyledInputFormikField>
                      )}

                      <Box mx={1} my={3}>
                        <StyledInputFormikField name="tos" required>
                          {({ field }) => (
                            <StyledCheckbox
                              name={field.name}
                              required={field.required}
                              checked={field.value}
                              onChange={({ checked }) => setFieldValue(field.name, checked)}
                              error={field.error}
                              label={
                                <FormattedMessage
                                  id="createcollective.tos.label"
                                  defaultMessage="I agree with the {toslink} of Open Collective."
                                  values={{
                                    toslink: (
                                      <StyledLink href="/tos" openInNewTab onClick={e => e.stopPropagation()}>
                                        <FormattedMessage id="tos" defaultMessage="terms of service" />
                                      </StyledLink>
                                    ),
                                  }}
                                />
                              }
                            />
                          )}
                        </StyledInputFormikField>
                        {hasHostTerms && (
                          <StyledInputFormikField name="hostTos" required mt={2}>
                            {({ field }) => (
                              <StyledCheckbox
                                name={field.name}
                                required={field.required}
                                checked={field.value}
                                onChange={({ checked }) => setFieldValue(field.name, checked)}
                                error={field.error}
                                label={
                                  <FormattedMessage
                                    id="Host.TOSCheckbox"
                                    defaultMessage="I agree with the <TOSLink>terms of service</TOSLink> of {hostName}"
                                    values={{
                                      hostName: host.name,
                                      TOSLink: getI18nLink({
                                        href: host.termsUrl,
                                        openInNewTabNoFollow: true,
                                        onClick: e => e.stopPropagation(), // don't check the checkbox when clicking on the link
                                      }),
                                    }}
                                  />
                                }
                              />
                            )}
                          </StyledInputFormikField>
                        )}
                      </Box>

                      <Flex justifyContent={['center', 'left']} mb={4}>
                        <StyledButton
                          fontSize="13px"
                          minWidth="148px"
                          minHeight="36px"
                          buttonStyle="primary"
                          type="submit"
                          loading={loading}
                          onSubmit={handleSubmit}
                          data-cy="ccf-form-submit"
                        >
                          <FormattedMessage id="collective.create" defaultMessage="Create Collective" />
                        </StyledButton>
                      </Flex>
                    </Form>
                  );
                }}
              </Formik>
              <Container justifyContent="center" mb={4} display={['flex', 'none']}>
                <NextIllustration src="/static/images/create-collective/mobileForm.png" width="320px" height="200px" />
              </Container>
            </ContainerWithImage>
          </Flex>
        </Box>
        <div />
      </Grid>
    );
  }
}

export default injectIntl(withData(withRouter(CreateCollectiveForm)));
