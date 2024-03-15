import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { Form, Formik } from 'formik';
import { get, isNil, map, pick } from 'lodash';
import { ArrowRight } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { requireFields } from '../../../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';

import Avatar from '../../../Avatar';
import CollectivePicker from '../../../CollectivePicker';
import CollectivePickerAsync from '../../../CollectivePickerAsync';
import { Box, Flex } from '../../../Grid';
import HTMLContent from '../../../HTMLContent';
import { getI18nLink } from '../../../I18nFormatters';
import LinkCollective from '../../../LinkCollective';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import OnboardingProfileCard from '../../../onboarding-modal/OnboardingProfileCard';
import StepsProgress from '../../../StepsProgress';
import StyledCheckbox from '../../../StyledCheckbox';
import StyledHr from '../../../StyledHr';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledLink from '../../../StyledLink';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../../StyledModal';
import StyledTextarea from '../../../StyledTextarea';
import { H1, P, Span } from '../../../Text';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

const duplicateAccountMutation = gql`
  mutation DuplicateAccount(
    $account: AccountReferenceInput!
    $include: DuplicateAccountDataTypeInput
    $oldName: String
  ) {
    duplicateAccount(account: $account, include: $include, connect: true, oldName: $oldName) {
      id
      legacyId
      slug
      duplicatedFromAccount {
        id
        legacyId
        slug
        name
      }
      projects: childrenAccounts(accountType: PROJECT) {
        totalCount
      }
      events: childrenAccounts(accountType: EVENT) {
        totalCount
      }
    }
  }
`;

const hostFields = gql`
  fragment ApplyToHostFields on Host {
    id
    legacyId
    type
    slug
    name
    createdAt
    currency
    isOpenToApplications
    termsUrl
    longDescription
    hostFeePercent
    settings
    policies {
      id
      COLLECTIVE_MINIMUM_ADMINS {
        numberOfAdmins
      }
    }
  }
`;

const accountFields = gql`
  fragment ApplyToHostAccountFields on Account {
    id
    slug
    name
    type
    imageUrl
    memberInvitations(role: [ADMIN]) {
      id
      role
      memberAccount {
        id
        type
        slug
        name
        imageUrl
      }
    }
    admins: members(role: ADMIN) {
      nodes {
        id
        role
        account {
          id
          type
          slug
          name
          imageUrl
        }
      }
    }
  }
`;

const applyToHostQuery = gql`
  query ApplyToHost($hostSlug: String!, $collectiveSlug: String!) {
    host(slug: $hostSlug) {
      id
      ...ApplyToHostFields
    }
    account(slug: $collectiveSlug) {
      id
      ...ApplyToHostAccountFields
    }
  }
  ${hostFields}
  ${accountFields}
`;

/**
 * A query similar to `applyToHostQuery`, except we also fetch user's administrated collectives for the picker
 */
const applyToHostWithAccountsQuery = gql`
  query ApplyToHostWithAccounts($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      ...ApplyToHostFields
    }
    loggedInAccount {
      id
      memberOf(role: ADMIN, accountType: [COLLECTIVE, FUND], isApproved: false, isArchived: false) {
        nodes {
          id
          account {
            id
            ...ApplyToHostAccountFields
            ... on AccountWithHost {
              host {
                id
                legacyId
              }
            }
          }
        }
      }
    }
  }
  ${hostFields}
  ${accountFields}
`;

const applyToHostMutation = gql`
  mutation ApplyToNewHost(
    $collective: AccountReferenceInput!
    $host: AccountReferenceInput!
    $message: String
    $inviteMembers: [InviteMemberInput]
  ) {
    applyToHost(collective: $collective, host: $host, message: $message, inviteMembers: $inviteMembers) {
      id
      slug
      ... on AccountWithHost {
        isActive
        isApproved
        host {
          id
          ...ApplyToHostFields
        }
      }
    }
  }
  ${hostFields}
`;

const GQL_CONTEXT = { context: API_V2_CONTEXT };
const INITIAL_FORM_VALUES = { message: '', areTosChecked: false, collective: null, inviteMembers: [] };
const STEPS = {
  INFORMATION: { key: 'INFORMATION', name: 'Information', label: <FormattedMessage defaultMessage="Information" /> },
  APPLY: { key: 'APPLY', name: 'Apply', label: <FormattedMessage id="Apply" defaultMessage="Apply" /> },
} as const;

const getAccountInput = collective => {
  return typeof collective.id === 'number' ? { legacyId: collective.id } : { id: collective.id };
};

const ConfirmButtons = ({ onClose, onBack, onSubmit, isSubmitting, canSubmit }) => {
  return (
    <div className="flex justify-end gap-3">
      <Button type="button" onClick={onBack || onClose} disabled={isSubmitting} variant="outline">
        {onBack ? (
          <FormattedMessage id="Back" defaultMessage="Back" />
        ) : (
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        )}
      </Button>

      <Button
        type="submit"
        disabled={!canSubmit}
        loading={isSubmitting}
        onClick={onSubmit}
        data-cy="afc-host-submit-button"
        className="min-w-[150px]"
      >
        Duplicate Collective & Submit application
      </Button>
    </div>
  );
};

ConfirmButtons.propTypes = {
  onClose: PropTypes.func,
  onBack: PropTypes.func,
  onSubmit: PropTypes.func,
  isSubmitting: PropTypes.bool,
  canSubmit: PropTypes.bool,
};

/**
 * A copy-paste of `ApplyToHostModal` specialized for the OCF shutdown transfer.
 */
const OCFDuplicateAndApplyToHostModal = ({ hostSlug, collective, onClose, onSuccess, ...props }) => {
  const query = collective ? applyToHostQuery : applyToHostWithAccountsQuery;
  const [successResult, setSuccessResult] = React.useState(null);
  const { refetchLoggedInUser } = useLoggedInUser();
  const { data, loading, error } = useQuery(query, {
    ...GQL_CONTEXT,
    variables: { hostSlug, collectiveSlug: collective?.slug },
    fetchPolicy: 'network-only',
  });
  const [applyToHost] = useMutation(applyToHostMutation, GQL_CONTEXT);
  const [duplicateAccount] = useMutation(duplicateAccountMutation, { context: API_V2_CONTEXT });
  const intl = useIntl();
  const { toast } = useToast();
  const [stepKey, setStepKey] = React.useState<keyof typeof STEPS>('INFORMATION');
  const contentRef = React.useRef();
  const canApply = Boolean(data?.host?.isOpenToApplications);
  const collectives = map(get(data, 'loggedInAccount.memberOf.nodes'), 'account');
  const selectedCollective = collective
    ? { ...collective, ...pick(data?.account, ['admins', 'memberInvitations']) }
    : collectives.length === 1
      ? collectives[0]
      : undefined;
  const host = data?.host;
  const useTwoSteps = !isNil(data?.host?.longDescription);

  React.useEffect(() => {
    if (host && !useTwoSteps) {
      setStepKey('APPLY');
    }
  }, [host, useTwoSteps]);

  const currentStep = STEPS[stepKey];
  return (
    <StyledModal onClose={() => onClose(successResult)} width="570px" {...props}>
      {loading ? (
        <React.Fragment>
          <ModalHeader hideCloseIcon>
            <LoadingPlaceholder width="100%" height={163} />
          </ModalHeader>
          <ModalBody>
            <StyledHr my={32} borderColor="black.300" />
            <LoadingPlaceholder width="100%" height={225} />
          </ModalBody>
        </React.Fragment>
      ) : successResult ? (
        <React.Fragment>
          <ModalBody>
            <div className="my-3 text-center text-2xl font-bold">Your Fiscal Host migration was successful</div>
            <div className="flex items-center justify-center gap-5">
              <Avatar collective={{ slug: 'foundation' }} type="ORGANIZATION" radius={64} />
              <ArrowRight size={24} />
              <Avatar collective={host} radius={64} />
            </div>
            <MessageBox type="info" mt={3}>
              <ol className="list-inside list-decimal font-bold">
                <li>
                  Your new Collective{' '}
                  <StyledLink as={LinkCollective} collective={successResult.newCollective}>
                    @{successResult.newCollective.slug}
                  </StyledLink>{' '}
                  was created
                  {successResult.newCollective.projects.totalCount > 0 ||
                  successResult.newCollective.events.totalCount > 0 ? (
                    <p>We successfully duplicated your collective and its active projects/events.</p>
                  ) : null}
                </li>
                <li>
                  <StyledLink as={LinkCollective} collective={collective}>
                    @{collective.slug}
                  </StyledLink>{' '}
                  will remain under OCF until your balance is zero’d.
                  <p className="font-normal">
                    Once your balance gets zero’d, we will merge both profiles and transaction history.
                  </p>
                </li>
                <li>
                  <StyledLink as={LinkCollective} collective={successResult.newCollective}>
                    @{successResult.newCollective.slug}
                  </StyledLink>{' '}
                  is waiting approval from {host.name}.
                  <p className="font-normal">
                    If accepted, you will be able to resume your fundraising efforts and reactivate your recurring
                    contributions.
                  </p>
                </li>
              </ol>
            </MessageBox>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-center">
              <Button onClick={() => onClose(successResult)}>Finish</Button>
            </div>
          </ModalFooter>
        </React.Fragment>
      ) : (
        <Formik
          validateOnBlur={false}
          initialValues={{ ...INITIAL_FORM_VALUES, collective: selectedCollective }}
          validate={values => {
            return requireFields(values, host.termsUrl ? ['areTosChecked', 'collective'] : ['collective']);
          }}
          onSubmit={async values => {
            try {
              // 1. Duplicate account
              const duplicateResult = await duplicateAccount({
                variables: {
                  account: getAccountInput(values.collective),
                  newSlug: `${values.collective.slug}-new`,
                  newName: values.collective.name,
                  oldName: `${values.collective.name} (OCF)`,
                  include: {
                    tiers: true,
                    admins: true,
                    projects: true,
                    events: true,
                  },
                },
              });

              // 2. Apply to host
              const newCollective = duplicateResult.data.duplicateAccount;
              const result = await applyToHost({
                variables: {
                  host: getAccountInput(host),
                  collective: getAccountInput(duplicateResult.data.duplicateAccount),
                  message: values.message,
                  inviteMembers: values.inviteMembers.map(invite => ({
                    ...invite,
                    memberAccount: { legacyId: invite.memberAccount.id },
                  })),
                },
              });

              try {
                // Refetch logged in user's data, to make sure permissions are ok and the new collective appears in the user menu
                await refetchLoggedInUser();

                if (onSuccess) {
                  await onSuccess(result);
                }
              } catch (e) {
                // Add a toast to make sure any failure in the following requests does not confuse the user
                toast({
                  variant: 'error',
                  message: `${collective.name} has been duplicated and applied to ${host.name} but we couldn't refresh your data. Please refresh the page.`,
                });
              }

              setSuccessResult({ newCollective });
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
          }}
        >
          {({ handleSubmit, values, setFieldValue, isSubmitting }) => (
            <React.Fragment>
              <ModalHeader hideCloseIcon>
                {loading ? (
                  <LoadingPlaceholder width="100%" height={163} />
                ) : host ? (
                  <Flex flexDirection="column" alignItems="center" width="100%">
                    <Avatar collective={host} type={host.type} radius={64} />
                    <H1 fontSize="20px" lineHeight="28px" color="black.900" mt={3} mb={3}>
                      {host.name}
                    </H1>
                    <Flex justifyContent="center" width="100%" gap="32px" flexWrap="wrap">
                      <Flex flexDirection="column">
                        <P fontWeight="400" fontSize="12px" lineHeight="18px" color="black.600" mb={1}>
                          <FormattedMessage id="HostSince" defaultMessage="Host since" />
                        </P>
                        <P fontSize="16px" fontWeight="500" lineHeight="24px">
                          <FormattedDate value={host.createdAt} month="short" year="numeric" />
                        </P>
                      </Flex>
                      <Flex flexDirection="column">
                        <P fontWeight="400" fontSize="12px" lineHeight="18px" color="black.600" mb={1}>
                          <FormattedMessage id="Currency" defaultMessage="Currency" />
                        </P>
                        <P fontSize="16px" fontWeight="500" lineHeight="24px">
                          {host.currency}
                        </P>
                      </Flex>
                      <Flex flexDirection="column">
                        <P fontWeight="400" fontSize="12px" lineHeight="18px" color="black.600" mb={1}>
                          <FormattedMessage id="HostFee" defaultMessage="Host fee" />
                        </P>
                        <P fontSize="16px" fontWeight="500" lineHeight="24px">
                          {host.hostFeePercent}%
                        </P>
                      </Flex>
                    </Flex>
                    <Box my={3}>
                      {useTwoSteps && (
                        // @ts-ignore
                        <StepsProgress
                          steps={Object.values(STEPS)}
                          focus={currentStep}
                          onStepSelect={step => setStepKey(step.key)}
                        >
                          {({ step }) => (
                            <P fontWeight="500" fontSize="14px" textTransform="uppercase">
                              {step.label}
                            </P>
                          )}
                        </StepsProgress>
                      )}
                    </Box>
                  </Flex>
                ) : null}
              </ModalHeader>

              <ModalBody>
                {loading ? (
                  <LoadingPlaceholder width="100%" height={250} />
                ) : !host ? (
                  <MessageBox type="warning" withIcon>
                    <FormattedMessage id="notFound" defaultMessage="Not found" />
                  </MessageBox>
                ) : !canApply ? (
                  <MessageBox type="warning" withIcon>
                    <FormattedMessage
                      id="collectives.create.error.HostNotOpenToApplications"
                      defaultMessage="This Fiscal Host is not open to applications"
                    />
                  </MessageBox>
                ) : (
                  <Form ref={contentRef}>
                    {stepKey === 'INFORMATION' && host.longDescription && (
                      <HTMLContent content={host.longDescription} />
                    )}
                    {stepKey === 'APPLY' && (
                      <React.Fragment>
                        <Box>
                          <StyledInputFormikField name="collective">
                            {({ field }) => (
                              <div>
                                <CollectivePicker
                                  inputId="host-apply-collective-picker"
                                  data-cy="host-apply-collective-picker"
                                  collective={field.value}
                                  disabled
                                />
                              </div>
                            )}
                          </StyledInputFormikField>
                        </Box>
                        <React.Fragment>
                          <StyledHr my="18px" width="100%" borderColor="black.300" />
                          {host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins > 1 &&
                            values.collective?.admins?.nodes?.length <
                              host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins && (
                              <React.Fragment>
                                <Box>
                                  <P fontSize="13px" lineHeight="16px" fontWeight="600" color="black.700">
                                    <FormattedMessage defaultMessage="Minimum Administrators Required" />
                                  </P>
                                  <Flex mt={1} width="100%">
                                    <P
                                      my={2}
                                      fontSize="9px"
                                      textTransform="uppercase"
                                      color="black.700"
                                      letterSpacing="0.06em"
                                    >
                                      <FormattedMessage id="administrators" defaultMessage="Administrators" />
                                      {values.collective &&
                                        ` (${
                                          values.collective?.admins?.nodes.length +
                                          values.collective?.memberInvitations?.length +
                                          values.inviteMembers.length
                                        }/${host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins})`}
                                    </P>
                                    <Flex flexGrow={1} alignItems="center">
                                      <StyledHr width="100%" ml={2} borderColor="black.300" />
                                    </Flex>
                                  </Flex>
                                  <Flex width="100%" flexWrap="wrap" data-cy="profile-card">
                                    {values.collective?.admins?.nodes.map(admin => (
                                      <OnboardingProfileCard key={admin.account.id} collective={admin.account} />
                                    ))}
                                    {values.collective?.memberInvitations?.map(invitations => (
                                      <OnboardingProfileCard
                                        key={invitations.memberAccount.id}
                                        collective={invitations.memberAccount}
                                        isPending
                                      />
                                    ))}
                                    {values.inviteMembers?.map(invite => (
                                      <OnboardingProfileCard
                                        key={invite.memberAccount.id}
                                        collective={invite.memberAccount}
                                        removeAdmin={() =>
                                          setFieldValue(
                                            'inviteMembers',
                                            values.inviteMembers.filter(
                                              i => i.memberAccount.id !== invite.memberAccount.id,
                                            ),
                                          )
                                        }
                                      />
                                    ))}
                                  </Flex>
                                  <Flex mt={1} width="100%">
                                    <P
                                      my={2}
                                      fontSize="9px"
                                      textTransform="uppercase"
                                      color="black.700"
                                      letterSpacing="0.06em"
                                    >
                                      <FormattedMessage
                                        id="InviteAdministrators"
                                        defaultMessage="Invite Administrators"
                                      />
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
                                            !values.inviteMembers.some(
                                              invite => invite.memberAccount.id === collective.id,
                                            ),
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
                                <StyledHr my="18px" width="100%" borderColor="black.300" />
                              </React.Fragment>
                            )}

                          <StyledInputFormikField
                            name="message"
                            htmlFor="apply-host-modal-message"
                            required={false}
                            label={
                              <Span fontSize="13px" lineHeight="16px" fontWeight="600" color="black.700">
                                {get(host, 'settings.applyMessage') || `Message to ${host.name}, the new Fiscal Host`}
                              </Span>
                            }
                          >
                            {({ field }) => (
                              <StyledTextarea
                                {...field}
                                width="100%"
                                minHeight={76}
                                maxLength={3000}
                                fontSize="14px"
                                showCount
                              />
                            )}
                          </StyledInputFormikField>
                          {host.termsUrl && (
                            <StyledInputFormikField name="areTosChecked">
                              {({ form, field }) => (
                                <Flex flexDirection="column" mx={1} mt={18}>
                                  <StyledCheckbox
                                    name="tos"
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
                                    required
                                    checked={field.value}
                                    onChange={({ checked }) => form.setFieldValue('areTosChecked', checked)}
                                    error={field.error}
                                  />
                                </Flex>
                              )}
                            </StyledInputFormikField>
                          )}
                          <MessageBox type="info" withIcon mt={3} fontSize="13px">
                            When you submit your application, we will:
                            <ol className="list-inside list-decimal">
                              <li>Duplicate your collective and its active projects/events.</li>
                              <li>Apply to {host.name} from the new collective.</li>
                              <li>
                                Once your balance has been zeroed, we will merge both profiles and transaction history.
                              </li>
                            </ol>
                          </MessageBox>
                        </React.Fragment>

                        {error && <MessageBoxGraphqlError type="error" withIcon my={[1, 3]} error={error} />}
                      </React.Fragment>
                    )}
                  </Form>
                )}
              </ModalBody>
              <ModalFooter isFullWidth>
                {stepKey === 'INFORMATION' && (
                  <Flex justifyContent="flex-end">
                    <Button data-cy="host-apply-modal-next" onClick={() => setStepKey('APPLY')}>
                      <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
                    </Button>
                  </Flex>
                )}
                {stepKey === 'APPLY' && (
                  <ConfirmButtons
                    onBack={() => setStepKey('INFORMATION')}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    canSubmit={canApply}
                  />
                )}
              </ModalFooter>
            </React.Fragment>
          )}
        </Formik>
      )}
    </StyledModal>
  );
};

OCFDuplicateAndApplyToHostModal.propTypes = {
  hostSlug: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  /** If not provided, the default is to ad a success toast and to call onClose */
  onSuccess: PropTypes.func,
  /** Use this to force the value for `collective`. If not specified, user's administrated collectives will be displayed instead */
  collective: PropTypes.object,
  router: PropTypes.object,
};

export default OCFDuplicateAndApplyToHostModal;
