import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { withRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import spdxLicenses from 'spdx-license-list';

import { suggestSlug } from '../../lib/collective';
import { OPENSOURCE_COLLECTIVE_ID } from '../../lib/constants/collectives';
import { fetchEcosystemsRepositoryInfo, toRepositorySnapshot } from '../../lib/ecosystems';
import { i18nGraphqlException } from '../../lib/errors';
import {
  requireFields,
  verifyChecked,
  verifyEmailPattern,
  verifyFieldLength,
  verifyURLPattern,
} from '../../lib/form-utils';
import { gql } from '../../lib/graphql/helpers';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import { i18nLabels } from '../../lib/i18n/custom-application-form';

import CollectivePickerAsync from '../CollectivePickerAsync';
import NextIllustration from '../collectives/HomeNextIllustration';
import { FormField } from '../FormField';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import OnboardingProfileCard from '../onboarding-modal/OnboardingProfileCard';
import { Alert, AlertDescription } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { FormSectionTitle } from '../ui/FormSectionTitle';
import { Input, InputGroup } from '../ui/Input';
import { DefaultCommandSelect } from '../ui/Select';
import { Separator } from '../ui/Separator';
import { TagInput } from '../ui/TagInput';
import { Textarea } from '../ui/Textarea';

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
  useMutation(canApplyWithCollective ? applyToHostMutation : createCollectiveMutation);

const REPOSITORY_INFO_DEBOUNCE_MS = 800;

const isValidRepositoryUrl = url => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const SPDX_LICENSE_ID_BY_LOWER_ID = Object.fromEntries(Object.keys(spdxLicenses).map(id => [id.toLowerCase(), id]));

/** Maps the license identifier reported by the repository host (e.g. `mit`) to the SPDX id used by the license select (e.g. `MIT`) */
const toSpdxLicenseId = license => SPDX_LICENSE_ID_BY_LOWER_ID[(license || '').trim().toLowerCase()] || null;

/** Cleans up the repository topics (e.g. GitHub topics) for the `collective.tags` field */
const toRepositoryTags = topics =>
  (topics || []).reduce((tags, topic) => {
    const tag = (topic ?? '').toString().trim();
    return tag && !tags.includes(tag) ? [...tags, tag] : tags;
  }, []);

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
  // Mirror of the `applicationData.repositoryUrl` field value (Formik values are only accessible in the render prop)
  const [repositoryUrl, setRepositoryUrl] = useState(initialValues?.applicationData?.repositoryUrl || '');
  // Latest ecosyste.ms info fetched for the repository URL ({ url, info })
  const [repositoryInfo, setRepositoryInfo] = useState(null);
  const { call: fetchRepositoryInfo, data: fetchedRepositoryInfo } = useAsyncCall(url =>
    fetchEcosystemsRepositoryInfo(url).then(info => ({ url, info })),
  );
  // `call` is re-created on each render: go through a ref to only re-fetch when the URL changes
  const fetchRepositoryInfoRef = useRef(fetchRepositoryInfo);
  fetchRepositoryInfoRef.current = fetchRepositoryInfo;

  const trimmedRepositoryUrl = (repositoryUrl || '').trim();

  // Fetch the ecosyste.ms repository info whenever the repository URL value changes (debounced)
  useEffect(() => {
    if (!trimmedRepositoryUrl || !isValidRepositoryUrl(trimmedRepositoryUrl)) {
      return undefined;
    }

    const timeout = setTimeout(() => fetchRepositoryInfoRef.current(trimmedRepositoryUrl), REPOSITORY_INFO_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [trimmedRepositoryUrl]);

  // Keep the latest fetch result for submit, ignoring responses that don't match the current URL
  useEffect(() => {
    setRepositoryInfo(
      fetchedRepositoryInfo && fetchedRepositoryInfo.url === trimmedRepositoryUrl ? fetchedRepositoryInfo : null,
    );
  }, [fetchedRepositoryInfo, trimmedRepositoryUrl]);

  // A handle on the Formik bag: the field values are only accessible in the render prop below
  const formikRef = useRef(null);

  // Automate the form filling from the fetched repository info: the license is always derived from
  // the repository, the repository topics are merged into the tags (existing tags are never removed)
  useEffect(() => {
    const formik = formikRef.current;
    const repository = repositoryInfo?.info?.repository;
    if (!formik || !repository) {
      return;
    }

    formik.setFieldValue('applicationData.licenseSpdxId', toSpdxLicenseId(repository.license));
    if (!canApplyWithCollective) {
      // The tags field only exists when applying with a new collective
      const existingTags = formik.values.collective?.tags || [];
      const repositoryTags = toRepositoryTags(repository.topics).filter(tag => !existingTags.includes(tag));
      formik.setFieldValue('collective.tags', [...existingTags, ...repositoryTags]);
    }
  }, [repositoryInfo, canApplyWithCollective]);

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
    // Attach a compact snapshot of the ecosyste.ms data fetched for the submitted repository URL
    const repositoryUrl = (applicationData.repositoryUrl || '').trim();
    const applicationDataWithRepositoryInfo =
      repositoryInfo && repositoryInfo.url === repositoryUrl
        ? { ...applicationData, ecosystemsRepositoryInfo: toRepositorySnapshot(repositoryInfo.info) }
        : applicationData;

    const variables = {
      collective: {
        ...(canApplyWithCollective
          ? { id: collectiveWithSlug.id, slug: collectiveWithSlug.slug }
          : { ...collective, repositoryUrl: applicationData.repositoryUrl }),
      },
      host: { legacyId: OPENSOURCE_COLLECTIVE_ID },
      user,
      applicationData: applicationDataWithRepositoryInfo,
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
      <div className="mt-6 flex flex-col items-center justify-center sm:mt-12">
        <div className="flex flex-col items-center justify-center sm:flex-row">
          <div className="mb-6 h-40 w-40">
            <NextIllustration
              alt="Open Source Collective logotype"
              src="/static/images/osc-logo.png"
              width={160}
              height={160}
            />
          </div>
          <div className="mb-4 w-72 text-center sm:ml-6 sm:w-[488px] sm:text-left">
            <h1 className="mb-3.5 text-[32px] leading-10 font-semibold tracking-tight text-foreground">
              <FormattedMessage id="HostApplication.header" defaultMessage="Apply with your Collective" />
            </h1>
            <p className="text-base leading-6 font-medium text-muted-foreground">
              <FormattedMessage
                id="HostApplication.form.subheading"
                defaultMessage="Introduce your Collective, please include as much context as possible so we can give you the best service we can! Have doubts? {faqLink}"
                values={{
                  faqLink: (
                    <Link
                      href="https://docs.oscollective.org/how-to-apply"
                      openInNewTab
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      <FormattedMessage id="HostApplication.form.readFaqs" defaultMessage="Visit our docs" />
                    </Link>
                  ),
                }}
              />
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="flex max-w-[993px] flex-1 flex-col">
          {error && (
            <div className="flex items-center justify-center">
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{i18nGraphqlException(intl, error)}</AlertDescription>
              </Alert>
            </div>
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
                const { values, touched, setFieldValue, setValues } = formik;
                formikRef.current = formik;

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
                    <div className="mt-3 mb-4 flex flex-col rounded-lg border border-border p-4 sm:mt-0 sm:p-8">
                      <FormSectionTitle>
                        <FormattedMessage id="HostApplication.form.mainInfo" defaultMessage="Main info" />
                      </FormSectionTitle>
                      {!LoggedInUser && (
                        <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
                          <div>
                            <FormField
                              label={intl.formatMessage(i18nLabels.name)}
                              name="user.name"
                              placeholder="Thomas Anderson"
                              disabled={!!LoggedInUser}
                              required
                            />
                          </div>
                          <div>
                            <FormField
                              label={intl.formatMessage(i18nLabels.email)}
                              name="user.email"
                              type="email"
                              placeholder="tanderson@gmail.com"
                              disabled={!!LoggedInUser}
                              required
                              hint={
                                <FormattedMessage
                                  id="OCFHostApplication.applicationForm.emailInstruction"
                                  defaultMessage="We will use this email to create your account."
                                />
                              }
                            />
                          </div>
                        </div>
                      )}
                      {!canApplyWithCollective && (
                        <React.Fragment>
                          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <FormField
                                label={intl.formatMessage(i18nLabels.nameLabel)}
                                name="collective.name"
                                placeholder="e.g Agora Collective"
                                required
                              >
                                {({ field }) => (
                                  <Input
                                    type="text"
                                    placeholder="e.g Agora Collective"
                                    {...field}
                                    onChange={e => {
                                      field.onChange(e);
                                      handleSlugChange(e);
                                    }}
                                  />
                                )}
                              </FormField>
                            </div>
                            <div>
                              <FormField
                                label={intl.formatMessage(i18nLabels.slug)}
                                name="collective.slug"
                                required
                                hint={<FormattedMessage defaultMessage="This can be edited later" id="03Q893" />}
                              >
                                {({ field }) => (
                                  <InputGroup
                                    prepend="opencollective.com/"
                                    placeholder="agora"
                                    className="w-full"
                                    {...field}
                                    onChange={e => setFieldValue('collective.slug', e.target.value)}
                                  />
                                )}
                              </FormField>
                            </div>
                          </div>
                          <div className="mb-3">
                            <FormField
                              name="collective.description"
                              label={intl.formatMessage(i18nLabels.descriptionLabel)}
                              required
                              hint={intl.formatMessage(i18nLabels.descriptionHint)}
                            >
                              {({ field }) => (
                                <Textarea
                                  {...field}
                                  rows={3}
                                  maxLength={150}
                                  showCount
                                  placeholder={intl.formatMessage(i18nLabels.descriptionPlaceholder)}
                                  data-cy="ccf-form-description"
                                />
                              )}
                            </FormField>
                          </div>
                          <div>
                            <div data-cy="ccf-form-tags">
                              <FormField name="collective.tags" label={intl.formatMessage(i18nLabels.tagsLabel)}>
                                {({ field }) => (
                                  <TagInput
                                    name={field.name}
                                    id={field.id}
                                    value={field.value || []}
                                    onChange={tags => setFieldValue('collective.tags', tags)}
                                    suggestedTags={popularTags}
                                  />
                                )}
                              </FormField>
                            </div>
                          </div>
                        </React.Fragment>
                      )}

                      <div className="mt-10 mb-3">
                        <FormSectionTitle>
                          <FormattedMessage id="HostApplication.form.typeOfProject" defaultMessage="Type of Project" />
                        </FormSectionTitle>

                        <p className="text-sm leading-5 text-muted-foreground">
                          <FormattedMessage
                            id="HostApplication.form.typeOfProject.description"
                            defaultMessage="Open Source Collective hosts open source software projects and adjacent communities (meetup groups, educational programs and mentorship schemes etc). What is the primary focus of your project?"
                          />
                        </p>
                      </div>

                      <FormField name="applicationData.typeOfProject" required>
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
                      </FormField>

                      <CollapseSection
                        title={intl.formatMessage(i18nLabels.aboutYourCodeTitle, {
                          optional:
                            values.applicationData.typeOfProject === 'COMMUNITY' ? (
                              <span className="font-normal text-muted-foreground">
                                (<FormattedMessage id="forms.optional" defaultMessage="Optional" />)
                              </span>
                            ) : null,
                        })}
                        isExpanded={codeSectionExpanded}
                        toggleExpanded={() => setCodeSectionExpanded(!codeSectionExpanded)}
                        imageSrc="/static/images/night-sky.png"
                        subtitle={intl.formatMessage(i18nLabels.aboutYourCodeSubtitle)}
                      >
                        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                          <FormField
                            label={intl.formatMessage(i18nLabels.repositoryUrl)}
                            name="applicationData.repositoryUrl"
                            required={values.applicationData.typeOfProject === 'CODE' || undefined}
                            hint={
                              <FormattedMessage
                                id="HostApplication.repositoryUrlHint"
                                defaultMessage="Can be GitHub, GitLab or any URL"
                              />
                            }
                          >
                            {({ field }) => (
                              <InputGroup
                                type="url"
                                placeholder="https://github.com"
                                className="w-full"
                                {...field}
                                onChange={e => {
                                  setRepositoryUrl(e.target.value);
                                  setFieldValue('applicationData.repositoryUrl', e.target.value);
                                }}
                              />
                            )}
                          </FormField>

                          <FormField
                            label={intl.formatMessage(i18nLabels.repositoryLicense)}
                            name="applicationData.licenseSpdxId"
                          >
                            {({ field }) => (
                              <DefaultCommandSelect
                                name={field.name}
                                placeholder={intl.formatMessage(i18nLabels.licensePlaceholder)}
                                searchPlaceholder={intl.formatMessage(i18nLabels.licenseSearchPlaceholder)}
                                emptyResultLabel={intl.formatMessage(i18nLabels.licenseEmptyResultLabel)}
                                options={spdxLicenseList}
                                value={field.value || ''}
                                setValue={value => setFieldValue(field.name, value)}
                              />
                            )}
                          </FormField>
                        </div>

                        <div className="mt-5">
                          <FormField
                            name="applicationData.extraLicenseInfo"
                            label={intl.formatMessage(i18nLabels.extraLicenseInfo)}
                            hint={<FormattedMessage {...i18nLabels.extraLicenseInfoHelpText} />}
                          >
                            {({ field }) => (
                              <Textarea
                                {...field}
                                rows={4}
                                placeholder={intl.formatMessage(i18nLabels.extraLicenseInfoHelpText)}
                              />
                            )}
                          </FormField>
                        </div>
                      </CollapseSection>

                      <CollapseSection
                        title={intl.formatMessage(i18nLabels.aboutYourCommunityTitle, {
                          optional:
                            values.applicationData.typeOfProject === 'CODE' ? (
                              <span className="font-normal text-muted-foreground">
                                (<FormattedMessage id="forms.optional" defaultMessage="Optional" />)
                              </span>
                            ) : null,
                        })}
                        isExpanded={communitySectionExpanded}
                        toggleExpanded={() => setCommunitySectionExpanded(!communitySectionExpanded)}
                        imageSrc="/static/images/community.png"
                        subtitle={intl.formatMessage(i18nLabels.aboutYourCommunitySubtitle)}
                      >
                        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                          <FormField
                            label={intl.formatMessage(i18nLabels.amountOfMembers)}
                            name="applicationData.amountOfMembers"
                            required={values.applicationData.typeOfProject === 'COMMUNITY' || undefined}
                          >
                            {({ field }) => (
                              <InputGroup
                                placeholder="0-10"
                                className="w-full"
                                {...field}
                                onChange={e => setFieldValue('applicationData.amountOfMembers', e.target.value)}
                              />
                            )}
                          </FormField>
                        </div>

                        <div className="mt-5">
                          <FormField
                            name="applicationData.previousEvents"
                            label={intl.formatMessage(i18nLabels.linksToPreviousEvents)}
                            hint={<FormattedMessage {...i18nLabels.linksToPreviousEventsHelpText} />}
                          >
                            {({ field }) => (
                              <Textarea
                                {...field}
                                rows={4}
                                placeholder={intl.formatMessage(i18nLabels.linksToPreviousEventsPlaceholder)}
                              />
                            )}
                          </FormField>
                        </div>
                      </CollapseSection>

                      <FormSectionTitle className="mt-8">
                        <FormattedMessage id="HostApplication.form.team" defaultMessage="Your team" />
                      </FormSectionTitle>

                      <div className="mb-2">
                        <h4 className="text-base leading-6 font-semibold text-foreground">
                          <FormattedMessage id="AddedAdministrators" defaultMessage="Added Administrators" />
                          {host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins > 1 && (
                            <span className="text-xs font-light tracking-wider text-muted-foreground">
                              {` (${1 + values.inviteMembers?.length}/${
                                host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins
                              })`}
                            </span>
                          )}
                        </h4>

                        <div className="flex w-full flex-wrap" data-cy="profile-card">
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
                        </div>

                        <div>
                          <h4 className="mt-2 text-base font-semibold text-foreground">
                            <FormattedMessage id="InviteAdministrators" defaultMessage="Invite Administrators" />
                          </h4>
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
                        </div>
                        {host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins > 1 && (
                          <Alert variant="info" className="mt-3">
                            <AlertDescription>
                              <FormattedMessage
                                defaultMessage="Your selected Fiscal Host requires you to add a minimum of {numberOfAdmins, plural, one {# admin} other {# admins} }. You can manage your admins from the Collective Settings."
                                id="GTK0Wf"
                                values={host.policies.COLLECTIVE_MINIMUM_ADMINS}
                              />
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <div className="mt-6">
                        <FormField
                          name="message"
                          required={true}
                          label={intl.formatMessage(i18nLabels.tellUsMoreLabel)}
                          hint={<FormattedMessage {...i18nLabels.tellUsMoreHelpText} />}
                        >
                          {({ field }) => (
                            <Textarea
                              {...field}
                              rows={6}
                              maxLength={3000}
                              className="h-24"
                              placeholder={intl.formatMessage(i18nLabels.tellUsMorePlaceholder)}
                              data-cy="ccf-form-message"
                            />
                          )}
                        </FormField>
                      </div>

                      <div className="mt-8">
                        <FormSectionTitle>
                          <FormattedMessage {...i18nLabels.legalEntityTitle} />
                        </FormSectionTitle>
                        <FormField name="applicationData.hasLegalEntity">
                          {({ field }) => (
                            <label className="flex cursor-pointer items-start gap-2 text-sm leading-normal">
                              <Checkbox
                                name={field.name}
                                checked={Boolean(field.value)}
                                onCheckedChange={checked => setFieldValue(field.name, checked === true)}
                              />
                              <span>
                                <FormattedMessage {...i18nLabels.hasLegalEntity} />
                              </span>
                            </label>
                          )}
                        </FormField>
                        <Alert variant="info" className="mt-3">
                          <Info className="h-5 w-5" />
                          <AlertDescription>
                            <FormattedMessage {...i18nLabels.hasLegalEntityNotice} />
                          </AlertDescription>
                        </Alert>
                      </div>

                      <Separator className="mt-10 mb-2" />
                      <div className="my-2 flex items-center">
                        <FormField name="termsOfServiceOC" required>
                          {({ field }) => (
                            <label className="flex cursor-pointer items-start gap-2 text-sm leading-normal">
                              <Checkbox
                                name={field.name}
                                data-cy="checkbox-termsOfServiceOC"
                                checked={Boolean(field.value)}
                                onCheckedChange={checked => setFieldValue(field.name, checked === true)}
                              />
                              <span>
                                <FormattedMessage
                                  id="OC.tos.label"
                                  defaultMessage="I agree with the <TOSLink>terms of service</TOSLink> of Open Collective."
                                  values={{
                                    TOSLink: chunks => (
                                      <Link
                                        href="/tos"
                                        openInNewTab
                                        className="text-primary underline-offset-4 hover:underline"
                                      >
                                        {chunks}
                                      </Link>
                                    ),
                                  }}
                                />
                              </span>
                            </label>
                          )}
                        </FormField>
                      </div>
                    </div>

                    <div className="mb-12 flex justify-center">
                      <div className="grid w-full max-w-[672px] flex-1 grid-cols-1 gap-8 px-12 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setInitialValues({ ...initialValues, ...values });
                            window && window.history.back();
                          }}
                        >
                          <ArrowLeft size={16} />
                          <FormattedMessage id="Back" defaultMessage="Back" />
                        </Button>
                        <Button type="submit" size="lg" loading={submitting} data-cy="ccf-form-submit">
                          <FormattedMessage id="actions.submitApplication" defaultMessage="Submit application" />
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default withRouter(ApplicationForm);
