import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Lock } from '@styled-icons/boxicons-solid/Lock';
import { ArrowLeft2 } from '@styled-icons/icomoon/ArrowLeft2';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { Form, Formik } from 'formik';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { suggestSlug } from '../../lib/collective.lib';
import { OPENSOURCE_COLLECTIVE_ID } from '../../lib/constants/collectives';
import { i18nGraphqlException } from '../../lib/errors';
import { requireFields, verifyChecked, verifyEmailPattern, verifyFieldLength } from '../../lib/form-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import NextIllustration from '../collectives/HomeNextIllustration';
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
import StyledTextarea from '../StyledTextarea';
import { H1, H4, P } from '../Text';

const createCollectiveMutation = gqlV2/* GraphQL */ `
  mutation CreateCollective(
    $collective: CollectiveCreateInput!
    $host: AccountReferenceInput
    $user: IndividualCreateInput
    $message: String
    $applicationData: JSON
    $inviteMembers: [InviteMemberInput]
    $automateApprovalWithGithub: Boolean
  ) {
    createCollective(
      collective: $collective
      host: $host
      user: $user
      message: $message
      applicationData: $applicationData
      inviteMembers: $inviteMembers
      automateApprovalWithGithub: $automateApprovalWithGithub
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

const applyToHostMutation = gqlV2/* GraphQL */ `
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
const LABEL_STYLES = { fontWeight: 500, fontSize: '14px', lineHeight: '17px' };

const messages = defineMessages({
  nameLabel: { id: 'createCollective.form.nameLabel', defaultMessage: 'Collective name' },
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
  name: {
    id: 'OCFHostApplication.name.label',
    defaultMessage: 'Your Name',
  },
  email: {
    id: 'Form.yourEmail',
    defaultMessage: 'Your email address',
  },
  slug: {
    id: 'createCollective.form.slugLabel',
    defaultMessage: 'Set your URL',
  },
  collectiveDescription: {
    id: 'createCollective.form.descriptionLabel',
    defaultMessage: 'What does your Collective do?',
  },
});

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
  githubInfo,
}) => {
  const intl = useIntl();
  const [submitApplication, { loading: submitting, error }] = useApplicationMutation(canApplyWithCollective);

  const validate = values => {
    const errors = requireFields(values, [
      'user.name',
      'user.email',
      'collective.name',
      'collective.slug',
      'collective.description',
    ]);

    verifyEmailPattern(errors, values, 'user.email');
    verifyFieldLength(intl, errors, values, 'collective.description', 1, 250);

    verifyChecked(errors, values, 'termsOfServiceOC');

    return errors;
  };
  const submit = async ({ user, collective, applicationData, inviteMembers, message }) => {
    const variables = {
      collective: {
        ...(canApplyWithCollective ? { id: collectiveWithSlug.id, slug: collectiveWithSlug.slug } : collective),
      },
      host: { legacyId: OPENSOURCE_COLLECTIVE_ID },
      user,
      applicationData: { ...applicationData, githubHandle: githubInfo.handle },
      inviteMembers: inviteMembers.map(invite => ({
        ...invite,
        memberAccount: { legacyId: invite.memberAccount.id },
      })),
      message,
      ...(!canApplyWithCollective && { automateApprovalWithGithub: githubInfo ? true : false }),
    };

    const response = await submitApplication({ variables });
    if (response.data.createCollective || response.data.applyToHost) {
      await router.push('/opensource/apply/success');
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
              <FormattedMessage id="OSCHostApplication.header" defaultMessage="Apply with your Collective" />
            </H1>
            <P fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700">
              <FormattedMessage
                id="OSCHostApplication.form.subheader"
                defaultMessage="Introduce your Collective, please incude as much context as possible so we can give you the best service we can! Have doubts? {faqLink}"
                values={{
                  faqLink: (
                    <StyledLink href="https://docs.oscollective.org/faq/general" openInNewTab color="purple.500">
                      <FormattedMessage defaultMessage="Read our FAQs" />
                    </StyledLink>
                  ),
                }}
              />
            </P>
          </Box>
        </Flex>
      </Flex>
      <Flex flexDirection={['column', 'row']} alignItems={['center', 'flex-start']} justifyContent="center">
        <Flex flexDirection="column" alignItems="center" justifyContent="center">
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
                    >
                      <Box width={['256px', '484px', '664px']}>
                        <Flex alignItems="center" justifyContent="stretch" gap={6}>
                          <H4 fontSize="18px" lineHeight="24px" color="black.900" mb={2}>
                            <FormattedMessage
                              // id="OCFHostApplication.applicationForm.title"
                              defaultMessage="Main info {padlock}"
                              values={{
                                padlock: <Lock size="12px" color="#9D9FA3" />,
                              }}
                            />
                          </H4>
                          <StyledHr flex="1" />
                        </Flex>
                        <P fontSize="12px" lineHeight="16px" color="black.600">
                          <FormattedMessage
                            // id="OCFHostApplication.applicationForm.instruction"
                            defaultMessage="This information is private. We only use it to check your eligibility and legitimacy."
                          />
                        </P>
                      </Box>
                      {!LoggedInUser && (
                        <Flex flexDirection={['column', 'row']}>
                          <Box mr={[null, 3]}>
                            <StyledInputFormikField
                              label={intl.formatMessage(messages.name)}
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
                              label={intl.formatMessage(messages.email)}
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
                              label={intl.formatMessage(messages.nameLabel)}
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
                              label={intl.formatMessage(messages.slug)}
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
                            <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                              <FormattedMessage id="createCollective.form.suggestedLabel" defaultMessage="Suggested" />
                            </P>
                          </Box>
                        </Flex>
                      )}
                      <Box width={['256px', '484px', '663px']} my={2}>
                        <StyledInputFormikField
                          label={intl.formatMessage(messages.descriptionLabel)}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="collective.description"
                          htmlFor="initiativeDescription"
                          required
                        >
                          {({ field }) => (
                            <StyledTextarea
                              placeholder={intl.formatMessage(messages.descriptionPlaceholder)}
                              {...field}
                              px="7px"
                            />
                          )}
                        </StyledInputFormikField>
                        <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                          {intl.formatMessage(messages.descriptionHint)}
                        </P>
                      </Box>

                      <Box width={['256px', '484px', '664px']} mt={20}>
                        <Flex alignItems="center" justifyContent="stretch" gap={6}>
                          <H4 fontSize="18px" lineHeight="24px" color="black.900" mb={2}>
                            <FormattedMessage
                              // id="OCFHostApplication.applicationForm.title"
                              defaultMessage="Your team {padlock}"
                              values={{
                                padlock: <Lock size="12px" color="#9D9FA3" />,
                              }}
                            />
                          </H4>
                          <StyledHr flex="1" />
                        </Flex>
                        <P fontSize="12px" lineHeight="16px" color="black.600">
                          <FormattedMessage
                            // id="OCFHostApplication.applicationForm.instruction"
                            defaultMessage="This information is private. We only use it to check your eligibility and legitimacy."
                          />
                        </P>
                      </Box>

                      <Box width={['256px', '484px', '663px']} my={2}>
                        <H4 fontSize="16px" lineHeight="24px" color="black.800" mb={0}>
                          <FormattedMessage id="AddedAdministrators" defaultMessage="Added administrators" />
                        </H4>

                        {host?.policies?.COLLECTIVE_MINIMUM_ADMINS && (
                          <Flex mt={1} width="100%">
                            <P my={2} fontSize="9px" textTransform="uppercase" color="black.700" letterSpacing="0.06em">
                              {` (${1 + values.inviteMembers?.length}/${
                                host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins
                              })`}
                            </P>
                          </Flex>
                        )}

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
                            <FormattedMessage id="InviteAdministrators" defaultMessage="Invite administrators" />
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
                      <Box width={['256px', '484px', '663px']} my={2}>
                        <StyledInputFormikField
                          name="message"
                          htmlFor="apply-create-message"
                          labelProps={LABEL_STYLES}
                          required={false}
                          mt={24}
                          label={
                            <FormattedMessage
                              id="ApplyToHost.WriteMessage"
                              defaultMessage="Message to the Fiscal Host"
                            />
                          }
                        >
                          {({ field }) => (
                            <StyledTextarea {...field} width="100%" minHeight={76} maxLength={3000} showCount />
                          )}
                        </StyledInputFormikField>
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

                    <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gridGap={'32px'} my={4}>
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
                      >
                        <FormattedMessage defaultMessage="Submit application" />
                        &nbsp;
                        <ArrowRight2 size="14px" />
                      </StyledButton>
                    </Grid>
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
  loadingCollective: PropTypes.bool,
  canApplyWithCollective: PropTypes.bool,
  router: PropTypes.object,
  githubInfo: PropTypes.object,
};

export default withRouter(ApplicationForm);
