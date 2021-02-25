import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { PlusCircle } from '@styled-icons/feather/PlusCircle';
import { Form, Formik } from 'formik';
import { get, map } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { OPENCOLLECTIVE_FOUNDATION_ID } from '../lib/constants/collectives';
import { i18nGraphqlException } from '../lib/errors';
import { requireFields } from '../lib/form-utils';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import ApplicationDescription from './ocf-host-application/ApplicationDescription';
import OCFPrimaryButton from './ocf-host-application/OCFPrimaryButton';
import Avatar from './Avatar';
import CollectivePicker from './CollectivePicker';
import { Box, Flex } from './Grid';
import HTMLContent from './HTMLContent';
import { getI18nLink } from './I18nFormatters';
import Link from './Link';
import LoadingPlaceholder from './LoadingPlaceholder';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import StyledHr from './StyledHr';
import StyledInputFormikField from './StyledInputFormikField';
import Modal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import StyledTextarea from './StyledTextarea';
import { H1, P } from './Text';
import { TOAST_TYPE, useToasts } from './ToastProvider';

const messages = defineMessages({
  SUCCESS: {
    id: 'SubmitApplication.SUCCESS',
    defaultMessage:
      "{collectiveName}'s application to {hostName} has been {type, select, APPROVED {approved} other {submitted}}",
  },
});

const hostFields = gqlV2/* GraphQL */ `
  fragment ApplyToHostFields on Host {
    id
    legacyId
    type
    slug
    name
    currency
    isOpenToApplications
    termsUrl
    longDescription
    hostFeePercent
    settings
  }
`;

const applyToHostQuery = gqlV2/* GraphQL */ `
  query ApplyToHost($hostSlug: String!) {
    host(slug: $hostSlug) {
      ...ApplyToHostFields
    }
  }
  ${hostFields}
`;

/**
 * A query similar to `applyToHostQuery`, except we also fetch user's administrated collectives for the picker
 */
const applyToHostWithAccountsQuery = gqlV2/* GraphQL */ `
  query ApplyToHostWithAccounts($hostSlug: String!) {
    host(slug: $hostSlug) {
      ...ApplyToHostFields
    }
    loggedInAccount {
      id
      memberOf(role: ADMIN, accountType: [COLLECTIVE, FUND], isApproved: false, isArchived: false) {
        nodes {
          id
          account {
            id
            slug
            name
            type
            imageUrl
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
`;

const applyToHostMutation = gqlV2/* GraphQL */ `
  mutation ApplyToHost($collective: AccountReferenceInput!, $host: AccountReferenceInput!, $message: String) {
    applyToHost(collective: $collective, host: $host, message: $message) {
      id
      slug
      ... on AccountWithHost {
        isActive
        isApproved
        host {
          ...ApplyToHostFields
        }
      }
    }
  }
  ${hostFields}
`;

const GQL_CONTEXT = { context: API_V2_CONTEXT };
const INITIAL_FORM_VALUES = { message: '', areTosChecked: false, collective: null };

const getAccountInput = collective => {
  return typeof collective.id === 'number' ? { legacyId: collective.id } : { id: collective.id };
};

const ConfirmButtons = ({ onClose, onSubmit, isSubmitting, canSubmit, isOCFHost }) => {
  return (
    <Flex justifyContent="flex-end" width="100%">
      <StyledButton
        buttonType="button"
        onClick={onClose}
        disabled={isSubmitting}
        buttonStyle="standard"
        mt={[2, 3]}
        mb={2}
        px={3}
      >
        <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
      </StyledButton>
      {isOCFHost ? (
        <OCFPrimaryButton
          type="submit"
          disabled={!canSubmit}
          loading={isSubmitting}
          onClick={onSubmit}
          mt={[2, 3]}
          mb={2}
          ml={3}
          px={3}
          minWidth={153}
        >
          <FormattedMessage id="actions.continue" defaultMessage="Continue" />
        </OCFPrimaryButton>
      ) : (
        <StyledButton
          type="submit"
          disabled={!canSubmit}
          loading={isSubmitting}
          buttonStyle="primary"
          onClick={onSubmit}
          mt={[2, 3]}
          mb={2}
          ml={3}
          px={3}
          minWidth={153}
          data-cy="afc-host-submit-button"
        >
          <FormattedMessage id="actions.submitApplication" defaultMessage="Submit application" />
        </StyledButton>
      )}
    </Flex>
  );
};

ConfirmButtons.propTypes = {
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  isSubmitting: PropTypes.bool,
  canSubmit: PropTypes.bool,
  canCancel: PropTypes.bool,
  isOCFHost: PropTypes.bool,
};

/**
 * A modal to apply to a given host
 * This modal triggers a query when mounted
 */
const ApplyToHostModal = ({ hostSlug, collective, onClose, onSuccess, router, ...props }) => {
  const query = collective ? applyToHostQuery : applyToHostWithAccountsQuery;
  const { data, loading, error } = useQuery(query, {
    ...GQL_CONTEXT,
    variables: { hostSlug },
    fetchPolicy: 'network-only',
  });
  const [applyToHost, { loading: submitting }] = useMutation(applyToHostMutation, GQL_CONTEXT);
  const intl = useIntl();
  const { addToast } = useToasts();
  const contentRef = React.useRef();
  const canApply = Boolean(data?.host?.isOpenToApplications);
  const collectives = map(get(data, 'loggedInAccount.memberOf.nodes'), 'account');
  const selectedCollective = collective || (collectives.length === 1 ? collectives[0] : undefined);
  const host = data?.host;
  const isOCFHost = host?.legacyId === OPENCOLLECTIVE_FOUNDATION_ID;

  return (
    <Modal onClose={onClose} width="570px" {...props}>
      {loading ? (
        <React.Fragment>
          <ModalHeader hideCloseIcon>
            <LoadingPlaceholder width="100%" height={163} />
          </ModalHeader>
          <ModalBody>
            <StyledHr my={32} borderColor="black.300" />
            <LoadingPlaceholder width="100%" height={225} />
          </ModalBody>
          <ModalFooter>
            <ConfirmButtons onClose={onClose} canSubmit={false} />
          </ModalFooter>
        </React.Fragment>
      ) : (
        <Formik
          validateOnBlur={false}
          initialValues={{ ...INITIAL_FORM_VALUES, collective: selectedCollective }}
          validate={values => {
            if (!values.collective && contentRef.current) {
              contentRef.current.scrollIntoView({ behavior: 'smooth' });
            }
            return requireFields(values, host.termsUrl ? ['areTosChecked', 'collective'] : ['collective']);
          }}
          onSubmit={async values => {
            if (isOCFHost) {
              await router.push(`/foundation/apply/form?collectiveSlug=${values.collective.slug}`);
              window.scrollTo(0, 0);
              return;
            }

            try {
              const result = await applyToHost({
                variables: {
                  host: getAccountInput(host),
                  collective: getAccountInput(values.collective),
                  message: values.message,
                },
              });

              if (onSuccess) {
                await onSuccess(result);
              } else {
                addToast({
                  type: TOAST_TYPE.SUCCESS,
                  message: intl.formatMessage(messages.SUCCESS, {
                    hostName: host.name,
                    collectiveName: values.collective.name,
                    type: result.data.applyToHost.isApproved ? 'APPROVED' : 'SENT',
                  }),
                });
                onClose();
              }
            } catch (e) {
              addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
            }
          }}
        >
          {({ handleSubmit }) => (
            <React.Fragment>
              <ModalHeader hideCloseIcon>
                {loading ? (
                  <LoadingPlaceholder width="100%" height={163} />
                ) : host ? (
                  <Flex flexDirection="column" alignItems="flex-start" width="100%">
                    <Avatar collective={host} radius={64} />
                    <H1 fontSize="20px" lineHeight="28px" color="black.900" mb={32}>
                      {host.name}
                    </H1>
                    <Flex justifyContent="space-between" width="100%" flexWrap="wrap">
                      <Flex flexDirection="column" mr={3}>
                        <P fontSize="12px" lineHeight="18px" color="black.600" mb={1}>
                          <FormattedMessage id="HostSince" defaultMessage="Host since" />
                        </P>
                        <P fontSize="16px" fontWeight="500">
                          <FormattedDate value={host.createdAt} month="long" year="numeric" />
                        </P>
                      </Flex>
                      <Flex flexDirection="column" mr={3}>
                        <P fontSize="12px" lineHeight="18px" color="black.600" mb={1}>
                          <FormattedMessage id="Currency" defaultMessage="Currency" />
                        </P>
                        <P fontSize="16px" fontWeight="500">
                          {host.currency}
                        </P>
                      </Flex>
                      <Flex flexDirection="column">
                        <P fontSize="12px" lineHeight="18px" color="black.600" mb={1}>
                          <FormattedMessage id="HostFee" defaultMessage="Host fee" />
                        </P>
                        <P fontSize="16px" fontWeight="500">
                          {host.hostFeePercent}%
                        </P>
                      </Flex>
                    </Flex>
                  </Flex>
                ) : null}
              </ModalHeader>
              <ModalBody>
                <StyledHr my={32} borderColor="black.300" />
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
                    <Box mb={32}>
                      <StyledInputFormikField name="collective">
                        {({ form, field }) => (
                          <div>
                            <P fontSize="13px" lineHeight="16px" fontWeight="600" color="black.700" mb={2}>
                              <FormattedMessage
                                id="ApplyToHost.PickCollective"
                                defaultMessage="Which account is applying to {hostName}?"
                                values={{ hostName: host.name }}
                              />
                            </P>
                            <CollectivePicker
                              data-cy="host-apply-collective-picker"
                              collective={field.value}
                              collectives={collectives}
                              isDisabled={Boolean(collective)}
                              error={field.error}
                              onBlur={() => form.setFieldTouched(field.name, true)}
                              onChange={({ value }) => form.setFieldValue(field.name, value)}
                              isSearchable={collectives.length > 8}
                              types={['COLLECTIVE']}
                              creatable
                              renderNewCollectiveOption={() => (
                                <Link
                                  href={isOCFHost ? `/foundation/apply/intro` : `/${host.slug}/apply`}
                                  data-cy="host-apply-new-collective-link"
                                >
                                  <StyledButton borderRadius="14px" width="100%">
                                    <Flex alignItems="center">
                                      <PlusCircle size={24} />
                                      <Box ml="16px" fontSize="11px">
                                        <FormattedMessage
                                          id="Collective.CreateNew"
                                          defaultMessage="Create new Collective"
                                        />
                                      </Box>
                                    </Flex>
                                  </StyledButton>
                                </Link>
                              )}
                            />
                          </div>
                        )}
                      </StyledInputFormikField>
                    </Box>
                    {isOCFHost ? (
                      <ApplicationDescription />
                    ) : (
                      <React.Fragment>
                        {host.longDescription && <HTMLContent content={host.longDescription} />}
                        <StyledInputFormikField
                          name="message"
                          htmlFor="apply-host-modal-message"
                          mt={32}
                          labelProps={{ fontSize: '13px', lineHeight: '16px', fontWeight: '600', color: 'black.700' }}
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
                      </React.Fragment>
                    )}
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
                                      ...(isOCFHost && { color: '#396C6F' }),
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
                    {error && (
                      <MessageBox type="error" withIcon my={[1, 3]}>
                        {error}
                      </MessageBox>
                    )}
                  </Form>
                )}
              </ModalBody>
              <ModalFooter>
                <ConfirmButtons
                  onClose={onClose}
                  onSubmit={handleSubmit}
                  isSubmitting={submitting}
                  canSubmit={canApply}
                  isOCFHost={isOCFHost}
                />
              </ModalFooter>
            </React.Fragment>
          )}
        </Formik>
      )}
    </Modal>
  );
};

ApplyToHostModal.propTypes = {
  hostSlug: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  /** If not provided, the default is to ad a success toast and to call onClose */
  onSuccess: PropTypes.func,
  /** Use this to force the value for `collective`. If not specified, user's administrated collectives will be displayed instead */
  collective: PropTypes.object,
  router: PropTypes.object,
};

ApplyToHostModal.defaultProps = {
  show: true,
};

export default withRouter(ApplyToHostModal);
