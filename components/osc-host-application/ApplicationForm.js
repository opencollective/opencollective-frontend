import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { ArrowLeft2 } from '@styled-icons/icomoon/ArrowLeft2';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { Form, Formik } from 'formik';
import { withRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import spdxLicenses from 'spdx-license-list';

import { suggestSlug } from '../../lib/collective';
import { OPENSOURCE_COLLECTIVE_ID } from '../../lib/constants/collectives';
import { i18nGraphqlException } from '../../lib/errors';
import {
  requireFields,
  verifyChecked,
  verifyEmailPattern,
  verifyFieldLength,
  verifyURLPattern,
} from '../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { i18nLabels } from '../../lib/i18n/custom-application-form';

import CollectivePickerAsync from '../CollectivePickerAsync';
import NextIllustration from '../collectives/HomeNextIllustration';
import CollectiveTagsInput from '../CollectiveTagsInput';
import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import OnboardingProfileCard from '../onboarding-modal/OnboardingProfileCard';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import StyledLink from '../StyledLink';
import StyledSelect from '../StyledSelect';
import StyledTextarea from '../StyledTextarea';
import { H1, H4, P, Span } from '../Text';

import CollapseSection from './CollapseSection';
import ProjectTypeSelect from './ProjectTypeSelect';

const createCollectiveMutation = gql`
  mutation CreateCollective(
    $collective: CollectiveCreateInput!
    $host: AccountReferenceInput
    $user: IndividualCreateInput
    $message: String
    $applicationData: JSON
    $inviteMembers: [InviteMemberInput]
  ) {
    createCollective(
      collective: $collective
      host: $host
      user: $user
      message: $message
      applicationData: $applicationData
      inviteMembers: $inviteMembers
    ) {
      id
      slug
      isApproved
      host {
        id
        slug
      }
    }
  }
`;

const applyToHostMutation = gql`
  mutation ApplyToHost(
    $collective: AccountReferenceInput!
    $host: AccountReferenceInput!
    $message: String
    $applicationData: JSON
    $inviteMembers: [InviteMemberInput]
  ) {
    applyToHost(
      collective: $collective
      host: $host
      message: $message
      applicationData: $applicationData
      inviteMembers: $inviteMembers
    ) {
      id
      slug
      ... on AccountWithHost {
        isApproved
        host {
          id
          slug
        }
      }
    }
  }
`;

const useApplicationMutation = canApplyWithCollective =>
  useMutation(canApplyWithCollective ? applyToHostMutation : createCollectiveMutation, {
    context: API_V2_CONTEXT,
  });

const ApplicationForm = ({
  LoggedInUser,
  loadingLoggedInUser,
  initialValues,
  setInitialValues,
  loadingCollective,
  canApplyWithCollective,
  router,
  collective: collectiveWithSlug,
  host,
  refetchLoggedInUser,
  popularTags,
}) => {
  const intl = useIntl();
  const [submitApplication, { loading: submitting, error }] = useApplicationMutation(canApplyWithCollective);

  const [codeSectionExpanded, setCodeSectionExpanded] = useState(false);
  const [communitySectionExpanded, setCommunitySectionExpanded] = useState(false);

  useEffect(() => {
    const { typeOfProject } = initialValues?.applicationData || {};
    setCodeSectionExpanded(typeOfProject === 'CODE');
  }, [initialValues?.applicationData?.typeOfProject]);

  const validate = values => {
    const errors = requireFields(values, [
      'user.name',
      'user.email',
      'collective.name',
      'collective.slug',
      'message',
      'collective.description',
      'applicationData.typeOfProject',
    ]);

    // User is not inputting a Collective or User if there is already a Collective that they apply with
    if (!canApplyWithCollective) {
      verifyEmailPattern(errors, values, 'user.email');
      verifyFieldLength(intl, errors, values, 'collective.description', 1, 255);
    }
    verifyURLPattern(errors, values, 'applicationData.repositoryUrl');
    verifyChecked(errors, values, 'termsOfServiceOC');

    return errors;
  };
  const submit = async ({ user, collective, applicationData, inviteMembers, message }) => {
    const variables = {
      collective: {
        ...(canApplyWithCollective
          ? { id: collectiveWithSlug.id, slug: collectiveWithSlug.slug }
          : { ...collective, repositoryUrl: applicationData.repositoryUrl }),
      },
      host: { legacyId: OPENSOURCE_COLLECTIVE_ID },
      user,
      applicationData,
      inviteMembers: inviteMembers.map(invite => ({
        ...invite,
        memberAccount: { legacyId: invite.memberAccount.id },
      })),
      message,
    };

    const response = await submitApplication({ variables });
    const resCollective = response.data.createCollective || response.data.applyToHost;

    if (resCollective) {
      if (resCollective.isApproved) {
        await refetchLoggedInUser();

        await router.push(`/${resCollective.slug}/onboarding`);
      } else {
        await router.push('/opensource/apply/success');
      }
      window.scrollTo(0, 0);
    }
  };

  if (error) {
    // Scroll the user to the top in order to see the error message
    window.scrollTo(0, 0);
  }

  // Turn licenses into an array and sort them on label/name
  const spdxLicenseList = Object.keys(spdxLicenses)
    .map(key => ({
      label: spdxLicenses[key].name,
      value: key,
      key,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <React.Fragment>
      <Flex flexDirection="column" alignItems="center" justifyContent="center" mt={['24px', '48px']}>
        <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center">
          <Box width={'160px'} height={'160px'} mb="24px">
            <NextIllustration
              alt="Open Source Collective logotype"
              src="/static/images/osc-logo.png"
              width={160}
              height={160}
            />
          </Box>
          <Box textAlign={['center', 'left']} width={['288px', '488px']} mb={4} ml={[null, '24px']}>
            <H1
              fontSize="32px"
              lineHeight="40px"
              letterSpacing="-0.008em"
              color="black.900"
              textAlign={['center', 'left']}
              mb="14px"
            >
              <FormattedMessage id="HostApplication.header" defaultMessage="Apply with your Collective" />
            </H1>
            <P fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700">
              <FormattedMessage
                id="HostApplication.form.subheading"
                defaultMessage="Introduce your Collective, please include as much context as possible so we can give you the best service we can! Have doubts? {faqLink}"
                values={{
                  faqLink: (
                    <StyledLink href="https://docs.oscollective.org/faq/general" openInNewTab color="purple.500">
                      <FormattedMessage id="HostApplication.form.readFaqs" defaultMessage="Read our FAQs" />
                    </StyledLink>
                  ),
                }}
              />
            </P>
          </Box>
        </Flex>
      </Flex>
      <Flex justifyContent="center">
        <Flex flexDirection="column" flex={'1'} maxWidth="993px">
          {error && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon mb={[1, 3]}>
                {i18nGraphqlException(intl, error)}
              </MessageBox>
            </Flex>
          )}
          {loadingCollective ? (
            <LoadingPlaceholder
              width={['256px', '484px', '664px']}
              height={463}
              mb={4}
              mt={[3, 0]}
              mr={[null, '36px', null, null, '102px']}
              borderRadius="8px"
            />
          ) : (
            <Formik initialValues={initialValues} onSubmit={submit} validate={validate}>
              {formik => {
                const { values, touched, setFieldValue, setValues, handleSubmit } = formik;

                const handleSlugChange = e => {
                  if (!touched.slug) {
                    setFieldValue('collective.slug', suggestSlug(e.target.value));
                  }
                };

                if (!loadingLoggedInUser && LoggedInUser && !values.user.name && !values.user.email) {
                  setValues({
                    ...values,
                    user: {
                      name: LoggedInUser.collective.name,
                      email: LoggedInUser.email,
                    },
                    ...(collectiveWithSlug && {
                      collective: {
                        name: collectiveWithSlug.name,
                        slug: collectiveWithSlug.slug,
                        description: collectiveWithSlug.description,
                      },
                    }),
                  });
                }

                return (
                  <Form data-cy="ccf-form">
                    <Container
                      justifyContent="center"
                      flexDirection="column"
                      mb={4}
                      mt={[3, 0]}
                      border="1px solid #DCDEE0"
                      padding={['16px', '32px']}
                      display="flex"
                      borderRadius="8px"
                    >
                      <Flex alignItems="center" justifyContent="stretch" gap={12} mb={3}>
                        <H4 fontSize="18px" lineHeight="24px" color="black.900">
                          <FormattedMessage id="HostApplication.form.mainInfo" defaultMessage="Main info" />
                        </H4>
                        <StyledHr flex="1" />
                      </Flex>
                      {!LoggedInUser && (
                        <Grid gridTemplateColumns={['1fr', 'repeat(2, minmax(0, 1fr))']} gridGap={3} py={2}>
                          <Box>
                            <StyledInputFormikField
                              label={intl.formatMessage(i18nLabels.name)}
                              labelFontSize="16px"
                              labelProps={{ fontWeight: '600' }}
                              disabled={!!LoggedInUser}
                              name="user.name"
                              htmlFor="name"
                              my={2}
                              required
                            >
                              {({ field }) => (
                                <StyledInput type="text" placeholder="Thomas Anderson" px="7px" {...field} />
                              )}
                            </StyledInputFormikField>
                          </Box>
                          <Box>
                            <StyledInputFormikField
                              label={intl.formatMessage(i18nLabels.email)}
                              labelFontSize="16px"
                              labelProps={{ fontWeight: '600' }}
                              disabled={!!LoggedInUser}
                              name="user.email"
                              htmlFor="email"
                              type="email"
                              required
                            >
                              {({ field }) => (
                                <StyledInput type="email" placeholder="tanderson@gmail.com" px="7px" {...field} />
                              )}
                            </StyledInputFormikField>
                            <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                              <FormattedMessage
                                id="OCFHostApplication.applicationForm.emailInstruction"
                                defaultMessage="We will use this email to create your account."
                              />
                            </P>
                          </Box>
                        </Grid>
                      )}
                      {!canApplyWithCollective && (
                        <React.Fragment>
                          <Grid gridTemplateColumns={['1fr', 'repeat(2, minmax(0, 1fr))']} gridGap={3} mb={3}>
                            <Box>
                              <StyledInputFormikField
                                label={intl.formatMessage(i18nLabels.nameLabel)}
                                labelFontSize="16px"
                                labelProps={{ fontWeight: '600' }}
                                name="collective.name"
                                htmlFor="initiativeName"
                                required
                                onChange={handleSlugChange}
                              >
                                {({ field }) => (
                                  <StyledInput type="text" placeholder="e.g Agora Collective" px="7px" {...field} />
                                )}
                              </StyledInputFormikField>
                            </Box>
                            <Box>
                              <StyledInputFormikField
                                label={intl.formatMessage(i18nLabels.slug)}
                                helpText={<FormattedMessage defaultMessage="This can be edited later" />}
                                labelFontSize="16px"
                                labelProps={{ fontWeight: '600' }}
                                name="collective.slug"
                                htmlFor="slug"
                                required
                              >
                                {({ field }) => (
                                  <StyledInputGroup
                                    prepend="opencollective.com/"
                                    placeholder="agora"
                                    {...field}
                                    onChange={e => setFieldValue('collective.slug', e.target.value)}
                                    prependProps={{ color: '#9D9FA3' }}
                                  />
                                )}
                              </StyledInputFormikField>
                              <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                                <FormattedMessage
                                  id="createCollective.form.suggestedLabel"
                                  defaultMessage="Suggested"
                                />
                              </P>
                            </Box>
                          </Grid>
                          <Box mb={3}>
                            <StyledInputFormikField
                              name="collective.description"
                              htmlFor="description"
                              labelFontSize="16px"
                              labelProps={{ fontWeight: '600' }}
                              label={intl.formatMessage(i18nLabels.descriptionLabel)}
                              required
                              data-cy="ccf-form-description"
                            >
                              {({ field }) => (
                                <StyledTextarea
                                  {...field}
                                  rows={3}
                                  width="100%"
                                  maxLength={150}
                                  showCount
                                  fontSize="14px"
                                  placeholder={intl.formatMessage(i18nLabels.descriptionPlaceholder)}
                                />
                              )}
                            </StyledInputFormikField>
                            <P fontSize="13px" lineHeight="20px" color="black.600" mt="6px">
                              {intl.formatMessage(i18nLabels.descriptionHint)}
                            </P>
                          </Box>
                          <Box>
                            <StyledInputFormikField
                              name="collective.tags"
                              htmlFor="tags"
                              labelFontSize="16px"
                              labelProps={{ fontWeight: '600' }}
                              label={intl.formatMessage(i18nLabels.tagsLabel)}
                              data-cy="ccf-form-tags"
                            >
                              {({ field }) => (
                                <CollectiveTagsInput
                                  {...field}
                                  defaultValue={field.value}
                                  onChange={tags => {
                                    setFieldValue(
                                      'collective.tags',
                                      tags.map(t => t.value),
                                    );
                                  }}
                                  suggestedTags={popularTags}
                                />
                              )}
                            </StyledInputFormikField>
                          </Box>
                        </React.Fragment>
                      )}

                      <Box mb={3} mt={'40px'}>
                        <Flex alignItems="center" justifyContent="stretch" gap={12} mb={3}>
                          <H4 fontSize="18px" lineHeight="24px" color="black.900">
                            <FormattedMessage
                              id="HostApplication.form.typeOfProject"
                              defaultMessage="Type of Project"
                            />
                          </H4>
                          <StyledHr flex="1" />
                        </Flex>

                        <P fontSize="14px" lineHeight="20px">
                          <FormattedMessage
                            id="HostApplication.form.typeOfProject.description"
                            defaultMessage="Open Source Collective hosts open source software projects and adjacent communities (meetup groups, educational programs and mentorship schemes etc). What is the primary focus of your project?"
                          />
                        </P>
                      </Box>

                      <StyledInputFormikField name="applicationData.typeOfProject" htmlFor="typeOfProject" required>
                        {({ field }) => {
                          return (
                            <ProjectTypeSelect
                              {...field}
                              onChange={e => {
                                const { value } = e.target;
                                if (value === 'COMMUNITY') {
                                  setCommunitySectionExpanded(true);
                                  if (!values.applicationData.repositoryUrl) {
                                    setCodeSectionExpanded(false);
                                  }
                                } else if (value === 'CODE') {
                                  setCodeSectionExpanded(true);
                                  setCommunitySectionExpanded(false);
                                }
                                setFieldValue('applicationData.typeOfProject', value);
                              }}
                            />
                          );
                        }}
                      </StyledInputFormikField>

                      <CollapseSection
                        title={intl.formatMessage(i18nLabels.aboutYourCodeTitle, {
                          optional:
                            values.applicationData.typeOfProject === 'COMMUNITY' ? (
                              <Span fontWeight={400} color="black.700">
                                (<FormattedMessage id="forms.optional" defaultMessage="Optional" />)
                              </Span>
                            ) : null,
                        })}
                        isExpanded={codeSectionExpanded}
                        toggleExpanded={() => setCodeSectionExpanded(!codeSectionExpanded)}
                        imageSrc="/static/images/night-sky.png"
                        subtitle={intl.formatMessage(i18nLabels.aboutYourCodeSubtitle)}
                      >
                        <Grid gridTemplateColumns={['1fr', 'repeat(2, minmax(0, 1fr))']} gridGap={3} pt={2}>
                          <Box>
                            <StyledInputFormikField
                              label={intl.formatMessage(i18nLabels.repositoryUrl)}
                              labelFontSize="16px"
                              labelProps={{ fontWeight: '600' }}
                              name="applicationData.repositoryUrl"
                              htmlFor="repositoryUrl"
                              required={values.applicationData.typeOfProject === 'CODE' || undefined}
                            >
                              {({ field }) => (
                                <StyledInputGroup
                                  type="url"
                                  placeholder="https://github.com"
                                  {...field}
                                  onChange={e => setFieldValue('applicationData.repositoryUrl', e.target.value)}
                                />
                              )}
                            </StyledInputFormikField>
                            <P fontSize="13px" lineHeight="20px" color="black.600" mt="6px">
                              <FormattedMessage
                                id="HostApplication.repositoryUrlHint"
                                defaultMessage="Can be GitHub, GitLab or any URL"
                              />
                            </P>
                          </Box>

                          <StyledInputFormikField
                            label={intl.formatMessage(i18nLabels.repositoryLicense)}
                            labelFontSize="16px"
                            labelProps={{ fontWeight: '600' }}
                            name="applicationData.licenseSpdxId"
                            htmlFor="licenseSpdxId"
                          >
                            {({ field }) => {
                              return (
                                <StyledSelect
                                  inputId={field.id}
                                  options={spdxLicenseList}
                                  {...field}
                                  value={spdxLicenseList.find(option => option.value === field.value)}
                                  onChange={({ value }) => {
                                    setFieldValue('applicationData.licenseSpdxId', value);
                                  }}
                                />
                              );
                            }}
                          </StyledInputFormikField>
                        </Grid>

                        <Box mt={20}>
                          <StyledInputFormikField
                            name="applicationData.extraLicenseInfo"
                            htmlFor="extraLicenseInformation"
                            labelFontSize="16px"
                            labelProps={{ fontWeight: '600' }}
                            label={intl.formatMessage(i18nLabels.extraLicenseInfo)}
                          >
                            {({ field }) => (
                              <StyledTextarea
                                {...field}
                                rows={4}
                                fontSize="14px"
                                placeholder={intl.formatMessage(i18nLabels.extraLicenseInfoHelpText)}
                              />
                            )}
                          </StyledInputFormikField>
                          <P fontSize="13px" lineHeight="20px" color="black.700" mt={2}>
                            <FormattedMessage {...i18nLabels.extraLicenseInfoHelpText} />
                          </P>
                        </Box>
                      </CollapseSection>

                      <CollapseSection
                        title={intl.formatMessage(i18nLabels.aboutYourCommunityTitle, {
                          optional:
                            values.applicationData.typeOfProject === 'CODE' ? (
                              <Span fontWeight={400} color="black.700">
                                (<FormattedMessage id="forms.optional" defaultMessage="Optional" />)
                              </Span>
                            ) : null,
                        })}
                        isExpanded={communitySectionExpanded}
                        toggleExpanded={() => setCommunitySectionExpanded(!communitySectionExpanded)}
                        imageSrc="/static/images/community.png"
                        subtitle={intl.formatMessage(i18nLabels.aboutYourCommunitySubtitle)}
                      >
                        <Grid gridTemplateColumns={['1fr', 'repeat(2, minmax(0, 1fr))']} gridGap={3} pt={2}>
                          <Box>
                            <StyledInputFormikField
                              label={intl.formatMessage(i18nLabels.amountOfMembers)}
                              labelFontSize="16px"
                              labelProps={{ fontWeight: '600' }}
                              name="applicationData.amountOfMembers"
                              htmlFor="amountOfMembers"
                              required={values.applicationData.typeOfProject === 'COMMUNITY' || undefined}
                            >
                              {({ field }) => (
                                <StyledInputGroup
                                  placeholder="0-10"
                                  {...field}
                                  onChange={e => setFieldValue('applicationData.amountOfMembers', e.target.value)}
                                />
                              )}
                            </StyledInputFormikField>
                          </Box>
                        </Grid>

                        <Box mt={20}>
                          <StyledInputFormikField
                            name="applicationData.previousEvents"
                            htmlFor="previousEvents"
                            labelFontSize="16px"
                            labelProps={{ fontWeight: '600' }}
                            label={intl.formatMessage(i18nLabels.linksToPreviousEvents)}
                          >
                            {({ field }) => (
                              <StyledTextarea
                                {...field}
                                rows={4}
                                fontSize="14px"
                                placeholder={intl.formatMessage(i18nLabels.linksToPreviousEventsPlaceholder)}
                              />
                            )}
                          </StyledInputFormikField>
                          <P fontSize="13px" lineHeight="20px" color="black.700" mt={2}>
                            <FormattedMessage {...i18nLabels.linksToPreviousEventsHelpText} />
                          </P>
                        </Box>
                      </CollapseSection>

                      <Flex alignItems="center" justifyContent="stretch" gap={12} mt={32} mb={3}>
                        <H4 fontSize="18px" lineHeight="24px" color="black.900">
                          <FormattedMessage id="HostApplication.form.team" defaultMessage="Your team" />
                        </H4>
                        <StyledHr flex="1" />
                      </Flex>

                      <Box mb={2}>
                        <H4 fontSize="16px" lineHeight="24px" color="black.800" mb={0}>
                          <FormattedMessage id="AddedAdministrators" defaultMessage="Added Administrators" />
                          {host?.policies?.COLLECTIVE_MINIMUM_ADMINS && (
                            <Span fontWeight="300" fontSize="11px" color="black.700" letterSpacing="0.06em">
                              {` (${1 + values.inviteMembers?.length}/${
                                host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins
                              })`}
                            </Span>
                          )}
                        </H4>

                        <Flex width="100%" flexWrap="wrap" data-cy="profile-card">
                          {LoggedInUser ? (
                            <OnboardingProfileCard
                              key={LoggedInUser.collective.id}
                              collective={LoggedInUser.collective}
                            />
                          ) : (
                            values.user?.name && <OnboardingProfileCard key="0" collective={values.user} />
                          )}
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

                        <Box>
                          <H4 mt={2} fontSize="16px" color="black.800">
                            <FormattedMessage id="InviteAdministrators" defaultMessage="Invite Administrators" />
                          </H4>
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
                      <Box mt={24}>
                        <StyledInputFormikField
                          name="message"
                          htmlFor="apply-create-message"
                          required={true}
                          labelFontSize="16px"
                          labelProps={{ fontWeight: '600' }}
                          label={intl.formatMessage(i18nLabels.tellUsMoreLabel)}
                          data-cy="ccf-form-message"
                        >
                          {({ field }) => (
                            <StyledTextarea
                              {...field}
                              rows={6}
                              fontSize="14px"
                              maxLength={3000}
                              placeholder={intl.formatMessage(i18nLabels.tellUsMorePlaceholder)}
                            />
                          )}
                        </StyledInputFormikField>
                        <P fontSize="13px" lineHeight="20px" color="black.700" mt={2}>
                          <FormattedMessage {...i18nLabels.tellUsMoreHelpText} />
                        </P>
                      </Box>

                      <Box mb={2} mt={40}>
                        <StyledHr />
                      </Box>
                      <Container display="flex" alignSelf="flex-start" alignItems="center" my={2}>
                        <Box mr={3}>
                          <StyledInputFormikField name="termsOfServiceOC" required>
                            {({ field }) => (
                              <StyledCheckbox
                                size="16px"
                                name={field.name}
                                required={field.required}
                                checked={field.value}
                                onChange={({ checked }) => setFieldValue(field.name, checked)}
                                error={field.error}
                                label={
                                  <P ml={1} fontSize="12px" lineHeight="16px" fontWeight="400" color="black.800">
                                    <FormattedMessage
                                      id="OC.tos.label"
                                      defaultMessage="I agree with the <TOSLink>terms of service</TOSLink> of Open Collective."
                                      values={{
                                        TOSLink: getI18nLink({
                                          href: '/tos',
                                          color: '#6F5AFA',
                                          openInNewTab: true,
                                          onClick: e => e.stopPropagation(), // don't check the checkbox when clicking on the link
                                        }),
                                      }}
                                    />
                                  </P>
                                }
                              />
                            )}
                          </StyledInputFormikField>
                        </Box>
                      </Container>
                    </Container>

                    <Flex justifyContent="center" mb={48}>
                      <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gridGap={'32px'} maxWidth={672} px={48} flex="1">
                        <StyledButton
                          buttonStyle="purpleSecondary"
                          buttonSize="large"
                          textAlign="center"
                          onClick={() => {
                            setInitialValues({ ...initialValues, ...values });
                            window && window.history.back();
                          }}
                        >
                          <ArrowLeft2 size="14px" />
                          &nbsp;
                          <FormattedMessage id="Back" defaultMessage="Back" />
                        </StyledButton>
                        <StyledButton
                          type="submit"
                          textAlign="center"
                          buttonSize="large"
                          buttonStyle="purple"
                          onSubmit={handleSubmit}
                          loading={submitting}
                          data-cy="ccf-form-submit"
                        >
                          <FormattedMessage id="actions.submitApplication" defaultMessage="Submit application" />
                          &nbsp;
                          <ArrowRight2 size="14px" />
                        </StyledButton>
                      </Grid>
                    </Flex>
                  </Form>
                );
              }}
            </Formik>
          )}
        </Flex>
      </Flex>
    </React.Fragment>
  );
};

ApplicationForm.propTypes = {
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.object,
  refetchLoggedInUser: PropTypes.func,
  initialValues: PropTypes.object,
  setInitialValues: PropTypes.func,
  collective: PropTypes.shape({
    id: PropTypes.string,
    slug: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    isAdmin: PropTypes.bool,
    description: PropTypes.description,
  }),
  host: PropTypes.shape({
    id: PropTypes.string,
    slug: PropTypes.string,
    policies: PropTypes.object,
  }),
  popularTags: PropTypes.arrayOf(PropTypes.string),
  loadingCollective: PropTypes.bool,
  canApplyWithCollective: PropTypes.bool,
  router: PropTypes.object,
};

export default withRouter(ApplicationForm);
