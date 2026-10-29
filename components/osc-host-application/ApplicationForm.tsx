import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { AlertTriangle, ArrowLeft, ArrowRight, Info, Lock, Mail, UserPlus, X, XCircle } from 'lucide-react';
import { withRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import spdxLicenses from 'spdx-license-list';

import { suggestSlug } from '../../lib/collective';
import { OPENSOURCE_COLLECTIVE_ID } from '../../lib/constants/collectives';
import { type EcosystemsRepoSummary, fetchEcosystemsRepositoryInfo, toRepositorySnapshot } from '../../lib/ecosystems';
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
import { cn, isLocalEmail, isValidEmail } from '@/lib/utils';

import Avatar from '../Avatar';
import NextIllustration from '../collectives/HomeNextIllustration';
import { FormField } from '../FormField';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import Spinner from '../Spinner';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { FormSectionTitle } from '../ui/FormSectionTitle';
import { Input, InputGroup } from '../ui/Input';
import { DefaultCommandSelect } from '../ui/Select';
import { TagInput } from '../ui/TagInput';
import { Textarea } from '../ui/Textarea';
import { UserPicker } from '../UserPicker';

import {
  CONFIRMATION_MESSAGES,
  evaluateApplication,
  getSubmissionGate,
  RULE_MESSAGES,
  toSpdxLicenseId,
} from './applicationRules';
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

/** Cleans up the repository topics (e.g. GitHub topics) for the `collective.tags` field */
const toRepositoryTags = topics =>
  (topics || []).reduce((tags, topic) => {
    const tag = (topic ?? '').toString().trim();
    return tag && !tags.includes(tag) ? [...tags, tag] : tags;
  }, []);

/** Stable key for invited admins, whether they were picked by account or invited by email */
const getInviteKey = invite => invite?.memberAccount?.id || invite?.memberInfo?.email;

/**
 * Application rule notes displayed next to the form field they relate to (warnings and
 * info notes - errors stay in the submission panel).
 */
const RuleNotes = ({ field, notes, confirmedRuleIds, onToggleConfirmation }) => {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="mt-1.5 flex flex-col gap-1.5" data-cy={`ccf-form-rules-${field}`}>
      {notes.map(flag => (
        <div key={flag.id} className="flex items-start gap-1.5 text-sm leading-normal">
          {flag.severity === 'info' ? (
            <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-600" />
          )}
          <div className="flex flex-col gap-1.5">
            <span className={cn(flag.severity === 'info' ? 'text-blue-700' : 'text-yellow-700')}>
              <FormattedMessage {...RULE_MESSAGES[flag.id]} />
            </span>
            {CONFIRMATION_MESSAGES[flag.id] && (
              <label className="flex cursor-pointer items-start gap-2 text-sm leading-normal text-foreground">
                <Checkbox
                  checked={confirmedRuleIds.includes(flag.id)}
                  onCheckedChange={checked => onToggleConfirmation(flag.id, checked === true)}
                />
                <span>
                  <FormattedMessage {...CONFIRMATION_MESSAGES[flag.id]} />
                </span>
              </label>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Blocking application rule errors displayed above the form. Scrolls the page back to the top
 * when they appear (and when the set of errors changes), so the applicant sees why submission is
 * disabled even if they clicked the button from the bottom of the form.
 */
const RuleErrors = ({ flags }) => {
  const flagIds = flags.map(flag => flag.id).join(',');

  useEffect(() => {
    if (flagIds) {
      window.scrollTo(0, 0);
    }
  }, [flagIds]);

  if (flags.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-[993px] flex-col gap-2" data-cy="ccf-form-rules">
      {flags.slice(0, 1).map(flag => (
        <Alert key={flag.id} variant="destructive">
          <XCircle className="size-4" />
          <AlertDescription>
            <FormattedMessage {...RULE_MESSAGES[flag.id]} />
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

const ApplicationForm = ({
  LoggedInUser,
  loadingLoggedInUser,
  initialValues,
  onBack = null,
  loadingCollective,
  canApplyWithCollective,
  router,
  collective: collectiveWithSlug,
  host,
  refetchLoggedInUser,
  popularTags,
}) => {
  const intl = useIntl();
  const removeLabel = intl.formatMessage({ id: 'Remove', defaultMessage: 'Remove' });
  // Hosts can choose to omit blocking rules instead of blocking the submission (default: block)
  const blockOnErrors = host?.settings?.hostApplication?.blockOnErrors !== false;
  const [submitApplication, { loading: submitting, error }] = useApplicationMutation(canApplyWithCollective);

  const [codeSectionExpanded, setCodeSectionExpanded] = useState(false);
  const [communitySectionExpanded, setCommunitySectionExpanded] = useState(false);
  // Mirror of the `applicationData.repositoryUrl` field value (Formik values are only accessible in the render prop)
  const [repositoryUrl, setRepositoryUrl] = useState(initialValues?.applicationData?.repositoryUrl || '');
  // Repositories picked through the GitHub flow are verified and must not be changed in the form
  const isRepositoryUrlLocked = Boolean(initialValues?.applicationData?.useGithubValidation);
  // Latest ecosyste.ms info fetched for the repository URL ({ url, info })
  const [repositoryInfo, setRepositoryInfo] = useState(null);
  const {
    call: fetchRepositoryInfo,
    data: fetchedRepositoryInfo,
    error: repositoryInfoError,
  } = useAsyncCall((url: string): Promise<{ url: string; info: EcosystemsRepoSummary }> =>
    fetchEcosystemsRepositoryInfo(url).then(info => ({ url, info })),
  );
  // Last URL a fetch was started for (to attribute fetch errors to the current URL)
  const lastFetchUrlRef = useRef(null);
  // URL of the last repository info applied to the form (to reset tags when the repository changes)
  const previousRepositoryUrlRef = useRef(null);

  // Application rules state (see `applicationRules.ts`)
  const [confirmedRuleIds, setConfirmedRuleIds] = useState([]);

  const trimmedRepositoryUrl = (repositoryUrl || '').trim();

  // Fetch the ecosyste.ms repository info whenever the repository URL value changes (debounced)
  useEffect(() => {
    if (!trimmedRepositoryUrl || !isValidRepositoryUrl(trimmedRepositoryUrl)) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      lastFetchUrlRef.current = trimmedRepositoryUrl;
      fetchRepositoryInfo(trimmedRepositoryUrl);
    }, REPOSITORY_INFO_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [trimmedRepositoryUrl, fetchRepositoryInfo]);

  // Keep the latest fetch result for submit, ignoring responses that don't match the current URL
  useEffect(() => {
    setRepositoryInfo(
      fetchedRepositoryInfo && fetchedRepositoryInfo.url === trimmedRepositoryUrl ? fetchedRepositoryInfo : null,
    );
  }, [fetchedRepositoryInfo, trimmedRepositoryUrl]);

  // Compact projection of the fetched repository info, shared by the auto-filled fields and the rules
  const repositorySnapshot = useMemo(
    () => (repositoryInfo?.info ? toRepositorySnapshot(repositoryInfo.info) : null),
    [repositoryInfo],
  );

  // State of the repository lookup, for the application rules
  const repositoryInfoState =
    !trimmedRepositoryUrl || !isValidRepositoryUrl(trimmedRepositoryUrl)
      ? 'idle'
      : repositorySnapshot?.fullName
        ? 'found'
        : repositoryInfo?.info
          ? 'not-found'
          : repositoryInfoError && lastFetchUrlRef.current === trimmedRepositoryUrl
            ? 'error'
            : 'pending';

  // True while the repository lookup is in progress (debounce in flight or request underway):
  // the field shows a loading state and the application cannot be submitted
  const isRepositoryInfoLoading = repositoryInfoState === 'pending';

  // A handle on the Formik bag: the field values are only accessible in the render prop below
  const formikRef = useRef(null);
  // Latest rule flags/gate, computed in the render prop alongside the field values
  const rulesRef = useRef({
    flags: [],
    gate: { canSubmit: true, hardBlocks: [], needsConfirmation: [] },
  });

  // Automate the form filling from the fetched repository info: the license is always derived from
  // the repository, the repository topics are merged into the tags (existing tags are never removed)
  useEffect(() => {
    const formik = formikRef.current;
    const repository = repositoryInfo?.info?.repository;
    if (!formik || !repository) {
      return;
    }

    const isDifferentRepository =
      previousRepositoryUrlRef.current !== null && previousRepositoryUrlRef.current !== repositoryInfo.url;
    previousRepositoryUrlRef.current = repositoryInfo.url;

    formik.setFieldValue('applicationData.licenseSpdxId', toSpdxLicenseId(repository.license));
    if (!canApplyWithCollective) {
      // The tags field only exists when applying with a new collective. When the repository
      // changes, drop the tags from the previous repository (and any manual tags) and use the
      // new repository's topics instead.
      const existingTags = isDifferentRepository ? [] : formik.values.collective?.tags || [];
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
    // Never submit while the application rules block it (e.g. when submitted with the Enter key)
    const { flags: ruleFlags, gate: submissionGate } = rulesRef.current;
    if (!submissionGate.canSubmit) {
      return;
    }

    // Attach a compact snapshot of the ecosyste.ms data fetched for the submitted repository URL
    const repositoryUrl = (applicationData.repositoryUrl || '').trim();
    const applicationDataWithRepositoryInfo =
      repositoryInfo && repositoryInfo.url === repositoryUrl
        ? {
            ...applicationData,
            ecosystemsRepositoryInfo: toRepositorySnapshot(repositoryInfo.info, {
              applicantEmail: user?.email || LoggedInUser?.email,
            }),
          }
        : applicationData;

    // Keep a record of what the applicant confirmed, for the host review
    const ruleConfirmations = confirmedRuleIds.filter(id => ruleFlags.some(flag => flag.id === id));
    const applicationDataWithRules = {
      ...applicationDataWithRepositoryInfo,
      ...(ruleConfirmations.length > 0 && { ruleConfirmations }),
    };

    const variables = {
      collective: {
        ...(canApplyWithCollective
          ? { id: collectiveWithSlug.id, slug: collectiveWithSlug.slug }
          : { ...collective, repositoryUrl: applicationData.repositoryUrl }),
      },
      host: { legacyId: OPENSOURCE_COLLECTIVE_ID },
      user,
      applicationData: applicationDataWithRules,
      inviteMembers: inviteMembers.map(invite => {
        if (!invite.memberAccount) {
          return invite;
        }
        const { id, legacyId } = invite.memberAccount;
        return {
          ...invite,
          memberAccount: typeof id === 'string' ? { id } : { legacyId: id ?? legacyId },
        };
      }),
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

  useEffect(() => {
    if (error) {
      // Scroll the user to the top in order to see the error message
      window.scrollTo(0, 0);
    }
  }, [error]);

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

                // Application rules: warnings and blocking errors, from the form values + repository info
                const ruleFlags = evaluateApplication(
                  {
                    typeOfProject: values.applicationData.typeOfProject,
                    repositoryUrl: values.applicationData.repositoryUrl,
                    name: values.collective?.name,
                    message: values.message,
                    description: values.collective?.description,
                    teamSize: 1 + (values.inviteMembers?.length || 0),
                    applicationTextEngaged: Boolean(
                      (values.message || '').trim() ||
                      (values.collective?.description || '').trim() ||
                      touched.message ||
                      touched.description ||
                      formik.submitCount > 0,
                    ),
                    repositoryInfoState,
                    repository: repositorySnapshot,
                  },
                  { blockOnErrors },
                );
                const submissionGate = getSubmissionGate(ruleFlags, { confirmedRuleIds });
                // The repository lookup can still raise blocking rules: block the submission while it is pending
                const canSubmit = submissionGate.canSubmit && !isRepositoryInfoLoading;
                rulesRef.current = { flags: ruleFlags, gate: { ...submissionGate, canSubmit } };
                // Errors gate the submission and stay in the panel above the submit button
                const errorFlags = ruleFlags.filter(flag => flag.severity === 'error');
                const toggleRuleConfirmation = (ruleId, checked) =>
                  setConfirmedRuleIds(ids => (checked === true ? [...ids, ruleId] : ids.filter(id => id !== ruleId)));
                const ruleNotes = (field, fallback = null) => {
                  const notes = ruleFlags.filter(flag => flag.field === field && flag.severity !== 'error');
                  return notes.length > 0 ? (
                    <RuleNotes
                      field={field}
                      notes={notes}
                      confirmedRuleIds={confirmedRuleIds}
                      onToggleConfirmation={toggleRuleConfirmation}
                    />
                  ) : (
                    fallback
                  );
                };

                const applicantEmail = (values.user?.email || LoggedInUser?.email || '').trim().toLowerCase();
                const invitedEmails = new Set(
                  (values.inviteMembers || [])
                    .map(invite => (invite.memberInfo?.email || invite.memberAccount?.email)?.trim().toLowerCase())
                    .filter(Boolean),
                );
                const suggestedAdmins = [];
                const suggestedEmails = new Set();
                for (const committer of repositoryInfo?.info?.contributors?.past_year_committers || []) {
                  const email = committer.email?.trim();
                  const normalizedEmail = email?.toLowerCase();
                  if (
                    !email ||
                    !normalizedEmail ||
                    !isValidEmail(email) ||
                    isLocalEmail(email) ||
                    normalizedEmail === applicantEmail ||
                    invitedEmails.has(normalizedEmail) ||
                    suggestedEmails.has(normalizedEmail)
                  ) {
                    continue;
                  }
                  suggestedEmails.add(normalizedEmail);
                  suggestedAdmins.push({ ...committer, email });
                  if (suggestedAdmins.length >= 5) {
                    break;
                  }
                }
                const addSuggestedAdmin = committer =>
                  setFieldValue('inviteMembers', [
                    ...values.inviteMembers,
                    {
                      role: 'ADMIN',
                      memberInfo: {
                        name: committer.name || committer.login || committer.email,
                        email: committer.email,
                      },
                    },
                  ]);

                const handleSlugChange = e => {
                  if (!(touched.collective as { slug?: boolean })?.slug) {
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
                  <Form data-cy="ccf-form" className="flex flex-col gap-4">
                    <RuleErrors flags={errorFlags} />

                    <div className="mt-3 flex flex-col gap-8 rounded-lg border border-border p-4 sm:mt-0 sm:p-8">
                      <div className="flex flex-col gap-2">
                        <FormSectionTitle className="mb-0">
                          <FormattedMessage id="HostApplication.form.mainInfo" defaultMessage="Main info" />
                        </FormSectionTitle>
                        {!LoggedInUser && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                            <div>
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
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                          <FormSectionTitle className="mb-0">
                            <FormattedMessage
                              id="HostApplication.form.typeOfProject"
                              defaultMessage="Type of Project"
                            />
                          </FormSectionTitle>
                          <p className="mb-2 text-sm leading-5 text-muted-foreground">
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
                        {ruleNotes('typeOfProject')}
                      </div>
                      <div className="flex flex-col gap-8">
                        <CollapseSection
                          title={
                            <FormattedMessage
                              id="HostApplication.form.code"
                              defaultMessage="About your Code {optional}"
                              values={{
                                optional:
                                  values.applicationData.typeOfProject === 'COMMUNITY' ? (
                                    <span className="font-normal text-muted-foreground">
                                      (<FormattedMessage id="forms.optional" defaultMessage="Optional" />)
                                    </span>
                                  ) : null,
                              }}
                            />
                          }
                          isExpanded={codeSectionExpanded}
                          toggleExpanded={() => setCodeSectionExpanded(!codeSectionExpanded)}
                          subtitle={intl.formatMessage(i18nLabels.aboutYourCodeSubtitle)}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <FormField
                                  label={intl.formatMessage(i18nLabels.repositoryUrl)}
                                  name="applicationData.repositoryUrl"
                                  required={values.applicationData.typeOfProject === 'CODE' || undefined}
                                  hint={
                                    <div className="flex flex-col gap-1">
                                      {isRepositoryUrlLocked && (
                                        <span className="flex items-center gap-1.5">
                                          <Lock className="size-3.5 shrink-0" />
                                          <FormattedMessage
                                            id="HostApplication.form.repositoryUrl.locked"
                                            defaultMessage="This repository was verified with GitHub and can't be changed."
                                          />
                                        </span>
                                      )}
                                      {ruleNotes(
                                        'repositoryUrl',
                                        isRepositoryUrlLocked ? null : (
                                          <FormattedMessage
                                            id="HostApplication.repositoryUrlHint"
                                            defaultMessage="Can be GitHub, GitLab or any URL"
                                          />
                                        ),
                                      )}
                                    </div>
                                  }
                                >
                                  {({ field }) => (
                                    <InputGroup
                                      type="url"
                                      placeholder="https://github.com"
                                      className="w-full"
                                      aria-busy={isRepositoryInfoLoading}
                                      disabled={isRepositoryUrlLocked}
                                      append={
                                        isRepositoryInfoLoading ? (
                                          <div className="px-3 py-2">
                                            <Spinner
                                              size={16}
                                              className="text-muted-foreground"
                                              data-cy="ccf-form-repository-url-loading"
                                            />
                                          </div>
                                        ) : isRepositoryUrlLocked ? (
                                          <div className="px-3 py-2">
                                            <Lock
                                              size={16}
                                              className="text-muted-foreground"
                                              data-cy="ccf-form-repository-url-locked"
                                            />
                                          </div>
                                        ) : undefined
                                      }
                                      appendClassName="px-0 py-0 bg-background"
                                      {...field}
                                      onChange={e => {
                                        if (isRepositoryUrlLocked) {
                                          return;
                                        }
                                        setRepositoryUrl(e.target.value);
                                        setFieldValue('applicationData.repositoryUrl', e.target.value);
                                      }}
                                    />
                                  )}
                                </FormField>
                              </div>
                              <div>
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
                                {ruleNotes('licenseSpdxId')}
                              </div>
                            </div>

                            <FormField
                              name="applicationData.extraLicenseInfo"
                              label={intl.formatMessage(i18nLabels.extraLicenseInfo)}
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
                          title={
                            <FormattedMessage
                              id="HostApplication.form.aboutYourCommunity"
                              defaultMessage="About your Community {optional}"
                              values={{
                                optional:
                                  values.applicationData.typeOfProject === 'CODE' ? (
                                    <span className="font-normal text-muted-foreground">
                                      (<FormattedMessage id="forms.optional" defaultMessage="Optional" />)
                                    </span>
                                  ) : null,
                              }}
                            />
                          }
                          isExpanded={communitySectionExpanded}
                          toggleExpanded={() => setCommunitySectionExpanded(!communitySectionExpanded)}
                          subtitle={intl.formatMessage(i18nLabels.aboutYourCommunitySubtitle)}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      </div>

                      <div className="flex flex-col gap-2">
                        <FormSectionTitle className="mb-0">
                          <FormattedMessage id="HostApplication.form.team" defaultMessage="Your team" />
                        </FormSectionTitle>
                        <div className="flex flex-col gap-1">
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
                          <div className="flex w-full flex-wrap items-center gap-2" data-cy="profile-card">
                            {(LoggedInUser || values.user?.name) && (
                              <Badge size="sm" type="outline" className="truncate text-nowrap" data-cy="admin-badge">
                                <Avatar
                                  collective={LoggedInUser ? LoggedInUser.collective : values.user}
                                  radius={16}
                                  displayTitle={false}
                                />
                                <span className="ml-1 truncate" data-cy="name-of-admins">
                                  {LoggedInUser ? LoggedInUser.collective.name : values.user.name}
                                </span>
                              </Badge>
                            )}
                            {values.inviteMembers?.map(invite => {
                              const inviteKey = getInviteKey(invite);
                              const inviteName =
                                invite.memberAccount?.name || invite.memberInfo?.name || invite.memberInfo?.email;
                              const inviteEmail = invite.memberInfo?.email;
                              const showInviteEmail = Boolean(inviteEmail) && inviteEmail !== inviteName;
                              return (
                                <Badge
                                  key={inviteKey}
                                  size="sm"
                                  type="outline"
                                  className="max-w-full gap-1 pr-1"
                                  data-cy="admin-badge"
                                >
                                  {invite.memberAccount ? (
                                    <Avatar collective={invite.memberAccount} radius={16} displayTitle={false} />
                                  ) : (
                                    <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                                  )}
                                  <span className="truncate" data-cy="name-of-admins">
                                    {inviteName}
                                  </span>
                                  {!invite.memberAccount && showInviteEmail && (
                                    <span className="truncate text-muted-foreground">({inviteEmail})</span>
                                  )}
                                  <button
                                    type="button"
                                    data-cy="remove-user"
                                    aria-label={`${removeLabel} ${inviteName}`}
                                    className="rounded-full p-0.5 transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-ring"
                                    onClick={() =>
                                      setFieldValue(
                                        'inviteMembers',
                                        values.inviteMembers.filter(i => getInviteKey(i) !== inviteKey),
                                      )
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className="text-base font-semibold text-foreground">
                            <FormattedMessage id="InviteAdministrators" defaultMessage="Invite Administrators" />
                          </h4>
                          <UserPicker
                            onSelect={selection =>
                              setFieldValue('inviteMembers', [...values.inviteMembers, { role: 'ADMIN', ...selection }])
                            }
                            excludedIds={values.inviteMembers.map(invite => invite.memberAccount?.id).filter(Boolean)}
                            excludedEmails={values.inviteMembers
                              .map(invite => invite.memberInfo?.email?.toLowerCase())
                              .filter(Boolean)}
                            data-cy="admin-picker"
                          />

                          {suggestedAdmins.length > 0 && (
                            <div className="mt-2 flex flex-col gap-2" data-cy="suggested-admins">
                              <p className="text-sm text-muted-foreground">
                                <FormattedMessage
                                  id="HostApplication.form.suggestedAdmins"
                                  defaultMessage="Suggested admins from past-year repository contributors"
                                />
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {suggestedAdmins.map(committer => (
                                  <Button
                                    key={committer.email}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-auto max-w-full gap-1.5 py-1.5"
                                    onClick={() => addSuggestedAdmin(committer)}
                                    data-cy="suggested-admin"
                                  >
                                    <UserPlus className="size-3.5 shrink-0" />
                                    <span className="truncate">
                                      {committer.name || committer.login || committer.email}
                                    </span>
                                    <span className="truncate text-muted-foreground">({committer.email})</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          {ruleNotes('team')}
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
                      <div className="flex flex-col gap-2">
                        <FormSectionTitle className="mb-0">
                          <FormattedMessage
                            id="HostApplication.form.HostApplication"
                            defaultMessage="This Application"
                          />
                        </FormSectionTitle>

                        <div className="flex flex-col gap-4">
                          <FormField
                            name="message"
                            required={true}
                            label={intl.formatMessage(i18nLabels.tellUsMoreLabel)}
                            hint={ruleNotes('message', <FormattedMessage {...i18nLabels.tellUsMoreHelpText} />)}
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
                          <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-semibold text-foreground">
                              <FormattedMessage defaultMessage="Terms of service" id="company.termsOfService" />
                            </h4>
                            <FormField name="termsOfServiceOC" required>
                              {({ field }) => (
                                <label className="flex cursor-pointer items-center gap-2 text-sm leading-normal">
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
                          <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-semibold text-foreground">
                              <FormattedMessage {...i18nLabels.legalEntityTitle} />
                            </h4>
                            <p className="text-sm leading-5 text-muted-foreground">
                              <FormattedMessage {...i18nLabels.hasLegalEntityNotice} />
                            </p>

                            <FormField name="applicationData.hasLegalEntity">
                              {({ field }) => (
                                <label className="flex cursor-pointer items-center gap-2 text-sm leading-normal">
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
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-12 flex justify-center">
                      <div className="grid w-full max-w-[672px] flex-1 grid-cols-1 gap-8 px-12 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            onBack?.();
                            if (typeof window !== 'undefined') {
                              window.history.back();
                            }
                          }}
                        >
                          <ArrowLeft size={16} />
                          <FormattedMessage id="Back" defaultMessage="Back" />
                        </Button>
                        <Button
                          type="submit"
                          size="lg"
                          loading={submitting}
                          disabled={!canSubmit}
                          data-cy="ccf-form-submit"
                        >
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
