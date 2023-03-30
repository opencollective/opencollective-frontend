import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { Lock } from '@styled-icons/boxicons-solid/Lock';
import { ArrowLeft2 } from '@styled-icons/icomoon/ArrowLeft2';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { Question } from '@styled-icons/remix-line/Question';
import { Form, Formik } from 'formik';
import { get, isNil } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { suggestSlug } from '../../lib/collective.lib';
import { OPENCOLLECTIVE_FOUNDATION_ID } from '../../lib/constants/collectives';
import { formatCurrency } from '../../lib/currency-utils';
import { i18nGraphqlException } from '../../lib/errors';
import { requireFields, verifyChecked, verifyEmailPattern, verifyFieldLength } from '../../lib/form-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { i18nOCFApplicationFormLabel } from '../../lib/i18n/ocf-form';

import CollectivePickerAsync from '../CollectivePickerAsync';
import NextIllustration from '../collectives/HomeNextIllustration';
import CollectiveTagsInput from '../CollectiveTagsInput';
import Container from '../Container';
import OCFHostApplicationFAQ from '../faqs/OCFHostApplicationFAQ';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import OnboardingProfileCard from '../onboarding-modal/OnboardingProfileCard';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import StyledTextarea from '../StyledTextarea';
import StyledTooltip from '../StyledTooltip';
import { H1, H4, P } from '../Text';

import OCFPrimaryButton from './OCFPrimaryButton';

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
        host {
          id
          slug
        }
      }
    }
  }
`;

export const APPLICATION_DATA_AMOUNT_FIELDS = ['totalAmountRaised', 'totalAmountToBeRaised'];

const useApplicationMutation = canApplyWithCollective =>
  useMutation(canApplyWithCollective ? applyToHostMutation : createCollectiveMutation, {
    context: API_V2_CONTEXT,
  });

const prepareApplicationData = applicationData => {
  const formattedApplicationData = { ...applicationData };
  APPLICATION_DATA_AMOUNT_FIELDS.forEach(key => {
    if (!isNil(applicationData[key])) {
      formattedApplicationData[key] = formatCurrency(applicationData[key], 'USD');
    }
  });

  return formattedApplicationData;
};

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
  popularTags,
}) => {
  const intl = useIntl();
  const [submitApplication, { loading: submitting, error }] = useApplicationMutation(canApplyWithCollective);
  const slugAlreadyExists = get(error, 'graphQLErrors.0.extensions.extraInfo.slugExists');

  const validate = values => {
    const errors = requireFields(values, [
      'user.name',
      'user.email',
      'collective.name',
      'collective.slug',
      'collective.description',
      'applicationData.location',
      'applicationData.initiativeDuration',
      'applicationData.expectedFundingPartner',
      'applicationData.missionImpactExplanation',
      'applicationData.websiteAndSocialLinks',
    ]);

    verifyEmailPattern(errors, values, 'user.email');

    // verifyFieldLength(intl, errors, values, 'collective.name', 1, 50);
    // verifyFieldLength(intl, errors, values, 'collective.slug', 1, 30);
    verifyFieldLength(intl, errors, values, 'collective.description', 1, 250);
    verifyFieldLength(intl, errors, values, 'applicationData.missionImpactExplanation', 1, 250);

    verifyChecked(errors, values, 'termsOfServiceOC');
    return errors;
  };
  const submit = async ({ user, collective, applicationData, inviteMembers }) => {
    const variables = {
      collective,
      host: { legacyId: OPENCOLLECTIVE_FOUNDATION_ID },
      user,
      applicationData: prepareApplicationData(applicationData),
      inviteMembers: inviteMembers.map(invite => ({
        ...invite,
        memberAccount: { legacyId: invite.memberAccount.id },
      })),
      ...(canApplyWithCollective && { collective: { id: collectiveWithSlug.id, slug: collectiveWithSlug.slug } }),
    };

    const response = await submitApplication({ variables });
    if (response.data.createCollective || response.data.applyToHost) {
      await router.push('/foundation/apply/success');
      window.scrollTo(0, 0);
    }
  };

  if (error) {
    // Scroll the user to the top in order to see the error message
    window.scrollTo(0, 0);
  }

  return (
    <React.Fragment>
      <Flex flexDirection="column" alignItems="center" justifyContent="center" mt={['24px', '48px']}>
        <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center" mb={[null, 3]}>
          <Box width={'160px'} height={'160px'} mb="24px">
            <NextIllustration
              alt="OCF Application form illustration"
              src="/static/images/ocf-host-application/ocf-applicationForm-illustration.png"
              width={160}
              height={160}
            />
          </Box>
          <Box textAlign={['center', 'left']} width={['256px', '404px']} mb={4} ml={[null, '24px']}>
            <H1
              fontSize="32px"
              lineHeight="40px"
              letterSpacing="-0.008em"
              color="black.900"
              textAlign={['center', 'left']}
              mb="14px"
            >
              <FormattedMessage id="OCFHostApplication.title" defaultMessage="Apply with your initiative" />
            </H1>
            <P fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700">
              <FormattedMessage
                id="OCFHostApplication.applicationForm.description"
                defaultMessage="Grantees and project participants will love the simplicity and accessibility, and you’ll love how much your overhead is reduced."
              />
            </P>
          </Box>
        </Flex>
      </Flex>
      <Flex flexDirection={['column', 'row']} alignItems={['center', 'flex-start']} justifyContent="center">
        <Flex flexDirection="column" alignItems="center" justifyContent="center">
          {error && !slugAlreadyExists && (
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
                  <Form>
                    <Container
                      justifyContent="center"
                      flexDirection="column"
                      alignItems={['center', 'flex-start']}
                      mb={4}
                      mt={[3, 0]}
                      border="1px solid #DCDEE0"
                      padding="32px 16px"
                      display="flex"
                      borderRadius="8px"
                      mr={[null, '36px', null, null, '102px']}
                    >
                      <Box width={['256px', '484px', '664px']}>
                        <Container display="flex" alignItems="center" justifyContent="space-between">
                          <H4 fontSize="16px" lineHeight="24px" color="black.900" mb={2}>
                            <FormattedMessage
                              id="OCFHostApplication.applicationForm.title"
                              defaultMessage="About you and your initiative {padlock} {questionMark}"
                              values={{
                                padlock: <Lock size="12px" color="#9D9FA3" />,
                                questionMark: (
                                  <StyledTooltip
                                    content={
                                      <FormattedMessage
                                        defaultMessage={
                                          'Tell us more about your collective. This information is private and only used for internal purposes.'
                                        }
                                      />
                                    }
                                  >
                                    <Question size="13px" color="#DADADA" />
                                  </StyledTooltip>
                                ),
                              }}
                            />
                          </H4>
                          <StyledHr display={['none', 'flex']} width={[null, '219px', '383px']} />
                        </Container>
                        <P fontSize="12px" lineHeight="16px" color="black.600">
                          <FormattedMessage
                            id="OCFHostApplication.applicationForm.instruction"
                            defaultMessage="All fields are mandatory."
                          />
                        </P>
                      </Box>
                      <Box width={['256px', '234px', '324px']}>
                        <StyledInputFormikField
                          label={i18nOCFApplicationFormLabel(intl, 'location')}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          required
                          htmlFor="location"
                          name="applicationData.location"
                          my={3}
                        >
                          {({ field }) => <StyledInput {...field} type="text" placeholder="Walnut, CA" px="7px" />}
                        </StyledInputFormikField>
                      </Box>
                      {!LoggedInUser && (
                        <Flex flexDirection={['column', 'row']}>
                          <Box mr={[null, 3]}>
                            <StyledInputFormikField
                              label={i18nOCFApplicationFormLabel(intl, 'name')}
                              labelFontSize="13px"
                              labelColor="#4E5052"
                              labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                              disabled={!!LoggedInUser}
                              name="user.name"
                              htmlFor="name"
                              width={['256px', '234px', '324px']}
                              my={2}
                              required
                            >
                              {({ field }) => (
                                <StyledInput type="text" placeholder="Thomas Anderson" px="7px" {...field} />
                              )}
                            </StyledInputFormikField>
                          </Box>
                          <Box my={2}>
                            <StyledInputFormikField
                              label={i18nOCFApplicationFormLabel(intl, 'email')}
                              labelFontSize="13px"
                              labelColor="#4E5052"
                              labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                              disabled={!!LoggedInUser}
                              name="user.email"
                              htmlFor="email"
                              type="email"
                              width={['256px', '234px', '324px']}
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
                        </Flex>
                      )}
                      {!canApplyWithCollective && (
                        <Flex flexDirection={['column', 'row']}>
                          <Box my={2} mr={[null, 3]}>
                            <StyledInputFormikField
                              label={i18nOCFApplicationFormLabel(intl, 'initiativeName')}
                              labelFontSize="13px"
                              labelColor="#4E5052"
                              labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                              name="collective.name"
                              htmlFor="initiativeName"
                              required
                              onChange={handleSlugChange}
                              width={['256px', '234px', '324px']}
                            >
                              {({ field }) => (
                                <StyledInput type="text" placeholder="Agora Collective" px="7px" {...field} />
                              )}
                            </StyledInputFormikField>
                          </Box>
                          <Box width={['256px', '234px', '324px']} my={2}>
                            <StyledInputFormikField
                              label={i18nOCFApplicationFormLabel(intl, 'slug')}
                              helpText={<FormattedMessage defaultMessage="This can be edited later" />}
                              labelFontSize="13px"
                              labelColor="#4E5052"
                              labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                              name="collective.slug"
                              htmlFor="slug"
                              required
                            >
                              {({ field }) => (
                                <StyledInputGroup
                                  prepend="opencollective.com/"
                                  type="url"
                                  placeholder="agora"
                                  {...field}
                                  onChange={e => setFieldValue('collective.slug', e.target.value)}
                                  px="7px"
                                  prependProps={{ color: '#9D9FA3', fontSize: '13px', lineHeight: '16px' }}
                                />
                              )}
                            </StyledInputFormikField>
                            {slugAlreadyExists ? (
                              <P fontSize="10px" color="red.600" mt="6px">
                                {i18nGraphqlException(intl, error)}
                              </P>
                            ) : (
                              <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                                <FormattedMessage
                                  id="createCollective.form.suggestedLabel"
                                  defaultMessage="Suggested"
                                />
                              </P>
                            )}
                          </Box>
                        </Flex>
                      )}
                      <Flex flexDirection={['column', 'row']}>
                        <Box mr={[null, 3]}>
                          <StyledInputFormikField
                            label={i18nOCFApplicationFormLabel(intl, 'initiativeDuration')}
                            labelFontSize="13px"
                            labelColor="#4E5052"
                            labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                            name="applicationData.initiativeDuration"
                            htmlFor="initiativeDuration"
                            required
                            width={['256px', '234px', '324px']}
                            my={2}
                          >
                            {({ field }) => (
                              <StyledInput type="text" placeholder="New initiatives are welcome!" {...field} px="7px" />
                            )}
                          </StyledInputFormikField>
                        </Box>
                        <Box width={['256px', '234px', '324px']} my={2}>
                          <StyledInputFormikField
                            label={i18nOCFApplicationFormLabel(intl, 'totalAmountRaised')}
                            labelFontSize="13px"
                            labelColor="#4E5052"
                            labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                            name="applicationData.totalAmountRaised"
                            htmlFor="totalAmountRaised"
                          >
                            {({ form, field }) => (
                              <StyledInputAmount
                                id={field.id}
                                currency="USD"
                                px="7px"
                                placeholder="It's fine if you're just starting out."
                                error={field.error}
                                value={field.value}
                                maxWidth="100%"
                                onChange={value => form.setFieldValue(field.name, value)}
                                onBlur={() => form.setFieldTouched(field.name, true)}
                              />
                            )}
                          </StyledInputFormikField>
                          <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                            <FormattedMessage
                              id="OCFHostApplication.applicationForm.totalAmountRaisedInstruction"
                              defaultMessage="If you haven't please type 0."
                            />
                          </P>
                        </Box>
                      </Flex>
                      <Flex flexDirection={['column', 'row']}>
                        <Box width={['256px', '234px', '324px']} my={2} mr={[null, 3]}>
                          <StyledInputFormikField
                            label={i18nOCFApplicationFormLabel(intl, 'totalAmountToBeRaised')}
                            labelFontSize="13px"
                            labelColor="#4E5052"
                            labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                            name="applicationData.totalAmountToBeRaised"
                            htmlFor="totalAmountToBeRaised"
                            required
                          >
                            {({ field, form }) => (
                              <StyledInputAmount
                                id={field.id}
                                placeholder="Be as ambitious as you want."
                                currency="USD"
                                px="7px"
                                error={field.error}
                                value={field.value}
                                maxWidth="100%"
                                onChange={value => form.setFieldValue(field.name, value)}
                                onBlur={() => form.setFieldTouched(field.name, true)}
                              />
                            )}
                          </StyledInputFormikField>
                        </Box>
                        <Box width={['256px', '234px', '324px']} my={2}>
                          <StyledInputFormikField
                            label={i18nOCFApplicationFormLabel(intl, 'expectedFundingPartner')}
                            labelFontSize="13px"
                            labelColor="#4E5052"
                            labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                            name="applicationData.expectedFundingPartner"
                            htmlFor="expectedFundingPartner"
                            required
                          >
                            {({ field }) => (
                              <StyledInput
                                type="text"
                                placeholder="An idea of your ideal partners."
                                {...field}
                                px="7px"
                              />
                            )}
                          </StyledInputFormikField>
                        </Box>
                      </Flex>
                      <Box width={['256px', '484px', '663px']} my={2}>
                        <StyledInputFormikField
                          label={i18nOCFApplicationFormLabel(intl, 'initiativeDescription')}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="collective.description"
                          htmlFor="initiativeDescription"
                          required
                        >
                          {({ field }) => (
                            <StyledTextarea
                              placeholder="We make sandwiches and give them to our neighbors in an outdoor community fridge. We collaborate with other organizations to figure out what the best flavor sandwich is."
                              {...field}
                              px="7px"
                            />
                          )}
                        </StyledInputFormikField>
                        <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                          <FormattedMessage
                            id="OCFHostApplication.applicationForm.whatDoesInitiativeDoInstruction"
                            defaultMessage="Write a short description of your initiative (250 characters max)"
                          />
                        </P>
                      </Box>
                      <Box width={['256px', '484px', '663px']} my={2}>
                        <StyledInputFormikField
                          label={i18nOCFApplicationFormLabel(intl, 'missionImpactExplanation')}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="applicationData.missionImpactExplanation"
                          htmlFor="missionImpactExplanation"
                          required
                        >
                          {({ field }) => (
                            <StyledTextarea
                              placeholder="We create a positive social impact and combat community deterioration by providing access to the best sandwiches to our neighbors and building a strong community around our love of sandwiches."
                              {...field}
                              px="7px"
                            />
                          )}
                        </StyledInputFormikField>
                        <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                          <FormattedMessage
                            id="OCFHostApplication.applicationForm.missionInstruction"
                            defaultMessage="Check the sidebar for more info (250 characters max)"
                          />
                        </P>
                      </Box>
                      <Box width={['256px', '484px', '663px']} my={2}>
                        <StyledInputFormikField
                          name="collective.tags"
                          htmlFor="tags"
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          label={intl.formatMessage({ id: 'Tags', defaultMessage: 'Tags' })}
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
                      <Box width={['256px', '484px', '663px']} my={2}>
                        <P fontSize="13px" lineHeight="16px" color="#4E5052">
                          <FormattedMessage id="onboarding.admins.header" defaultMessage="Add administrators" />
                        </P>
                        <Flex mt={1} width="100%">
                          <P my={2} fontSize="9px" textTransform="uppercase" color="black.700" letterSpacing="0.06em">
                            <FormattedMessage id="AddedAdministrators" defaultMessage="Added Administrators" />
                            {host?.policies?.COLLECTIVE_MINIMUM_ADMINS &&
                              ` (${1 + values.inviteMembers?.length}/${
                                host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins
                              })`}
                          </P>
                          <Flex flexGrow={1} alignItems="center">
                            <StyledHr width="100%" ml={2} />
                          </Flex>
                        </Flex>
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
                        <Flex mt={1} width="100%">
                          <P my={2} fontSize="9px" textTransform="uppercase" color="black.700" letterSpacing="0.06em">
                            <FormattedMessage id="InviteAdministrators" defaultMessage="Invite Administrators" />
                          </P>
                          <Flex flexGrow={1} alignItems="center">
                            <StyledHr width="100%" ml={2} />
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
                      <Box width={['256px', '484px', '663px']} my={2}>
                        <StyledInputFormikField
                          label={i18nOCFApplicationFormLabel(intl, 'websiteAndSocialLinks')}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="applicationData.websiteAndSocialLinks"
                          htmlFor="websiteAndSocialLinks"
                          required
                        >
                          {({ field }) => <StyledTextarea type="text" {...field} px="7px" />}
                        </StyledInputFormikField>
                        <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                          <FormattedMessage
                            id="OCFHostApplication.applicationForm.websiteInstruction"
                            defaultMessage="If you have something to send us, please upload it to a storage service (Dropbox, Drive) and paste the sharing link here."
                          />
                        </P>
                      </Box>
                      <Box width={['256px', '484px', '663px']} mb={2} mt="20px">
                        <StyledHr />
                      </Box>
                      <Container
                        width={['256px', '484px', '663px']}
                        display="flex"
                        alignSelf="flex-start"
                        alignItems="center"
                        my={2}
                      >
                        <Box mr={3}>
                          <StyledInputFormikField name="termsOfServiceOC" required>
                            {({ field }) => (
                              <StyledCheckbox
                                background="#396C6F"
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
                    <Flex
                      flexDirection={['column', 'row']}
                      alignItems="center"
                      alignSelf={[null, 'flex-start']}
                      justifyContent="center"
                      mb="40px"
                      mt={[null, 3]}
                    >
                      <Link href="/foundation/apply/fees">
                        <StyledButton
                          type="button"
                          mb={[3, 0]}
                          width={['286px', '120px']}
                          mr={[null, 3]}
                          onClick={() => setInitialValues({ ...initialValues, ...values })}
                        >
                          <ArrowLeft2 size="14px" />
                          &nbsp;
                          <FormattedMessage id="Back" defaultMessage="Back" />
                        </StyledButton>
                      </Link>
                      <OCFPrimaryButton
                        width={['286px', '120px']}
                        type="submit"
                        onSubmit={handleSubmit}
                        loading={submitting}
                      >
                        <FormattedMessage id="Apply" defaultMessage="Apply" />
                        &nbsp;
                        <ArrowRight2 size="14px" />
                      </OCFPrimaryButton>
                    </Flex>
                  </Form>
                );
              }}
            </Formik>
          )}
        </Flex>
        <Flex flexDirection="column" alignItems="center" justifyContent="center">
          <StyledHr width="1px" solid />
          <OCFHostApplicationFAQ width={['256px', '148px', '194px', null, '239px']} />
        </Flex>
      </Flex>
    </React.Fragment>
  );
};

ApplicationForm.propTypes = {
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.object,
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
