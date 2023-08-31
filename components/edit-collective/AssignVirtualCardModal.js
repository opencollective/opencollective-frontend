import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useFormik } from 'formik';
import { debounce } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import CollectivePicker, { FLAG_COLLECTIVE_PICKER_COLLECTIVE } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import { Box, Grid } from '../Grid';
import CreditCard from '../icons/CreditCard';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import StyledInputMask from '../StyledInputMask';
import StyledLink from '../StyledLink';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';
import { StripeVirtualCardComplianceStatement } from '../virtual-cards/StripeVirtualCardComplianceStatement';

import { virtualCardsAssignedToCollectiveQuery } from './EditVirtualCardModal';

const initialValues = {
  cardNumber: undefined,
  collective: undefined,
  expiryDate: undefined,
  cvv: undefined,
  assignee: undefined,
  provider: 'STRIPE',
  cardName: undefined,
};

const assignNewVirtualCardMutation = gql`
  mutation assignNewVirtualCard(
    $virtualCard: VirtualCardInput!
    $account: AccountReferenceInput!
    $assignee: AccountReferenceInput!
  ) {
    assignNewVirtualCard(virtualCard: $virtualCard, account: $account, assignee: $assignee) {
      id
      name
      last4
      data
    }
  }
`;

const collectiveMembersQuery = gql`
  query CollectiveMembers($slug: String!) {
    account(slug: $slug) {
      id
      members(role: ADMIN) {
        nodes {
          id
          account {
            id
            name
            imageUrl
            slug
          }
        }
      }
    }
  }
`;

const throttledCall = debounce((searchFunc, variables) => {
  return searchFunc({ variables });
}, 750);

const AssignVirtualCardModal = ({ collective, host, onSuccess, onClose, ...modalProps }) => {
  const { addToast } = useToasts();
  const [assignNewVirtualCard, { loading: isBusy }] = useMutation(assignNewVirtualCardMutation, {
    context: API_V2_CONTEXT,
  });
  const [getCollectiveUsers, { loading: isLoadingUsers, data: users }] = useLazyQuery(collectiveMembersQuery, {
    context: API_V2_CONTEXT,
  });

  const formik = useFormik({
    initialValues: {
      ...initialValues,
      collective,
    },
    async onSubmit(values) {
      const { collective, assignee, provider, cardName } = values;
      const privateData = {
        cardNumber: values.cardNumber.replace(/\s+/g, ''),
        cvv: values.cvv,
        expiryDate: values.expiryDate,
        // Should be removed once https://github.com/opencollective/opencollective-api/pull/7307 is deployed to production
        expireDate: values.expiryDate,
      };

      try {
        await assignNewVirtualCard({
          variables: {
            virtualCard: {
              privateData,
              provider,
              name: cardName,
            },
            assignee: { id: assignee.id },
            account: typeof collective.id === 'string' ? { id: collective.id } : { legacyId: collective.id },
          },
        });
      } catch (e) {
        addToast({
          type: TOAST_TYPE.ERROR,
          message: (
            <FormattedMessage
              id="Host.VirtualCards.AssignCard.Error"
              defaultMessage="Error assigning card: {error}"
              values={{
                error: e.message,
              }}
            />
          ),
        });
        return;
      }
      onSuccess?.();
      handleClose();
    },
    validate(values) {
      const errors = {};
      if (!values.cardNumber) {
        errors.cardNumber = 'Required';
      } else if (values.cardNumber.length < 16 + 6) {
        errors.cardNumber = 'Card Number must have 16 digits';
      }
      if (!values.collective) {
        errors.collective = 'Required';
      }
      if (!values.provider) {
        errors.provider = 'Required';
      }
      if (!values.cardName) {
        errors.cardName = 'Required';
      }
      if (!values.assignee) {
        errors.assignee = 'Required';
      }
      if (!values.expiryDate) {
        errors.expiryDate = 'Required';
      }
      if (!values.cvv) {
        errors.cvv = 'Required';
      }
      return errors;
    },
  });

  const { data: virtualCardsAssignedToCollectiveData, loading: isLoadingVirtualCardsAssignedToCollective } = useQuery(
    virtualCardsAssignedToCollectiveQuery,
    {
      context: API_V2_CONTEXT,
      variables: {
        collectiveSlug: formik.values?.collective?.slug,
        hostSlug: host.slug,
      },
      skip: !formik.values?.collective?.slug,
    },
  );

  useEffect(() => {
    if (formik.values.collective?.slug) {
      throttledCall(getCollectiveUsers, { slug: formik.values.collective.slug });
    }
  }, [formik.values.collective]);

  const handleClose = () => {
    formik.resetForm(initialValues);
    formik.setErrors({});
    onClose?.();
  };
  const handleCollectivePick = async option => {
    formik.setFieldValue('collective', option.value);
    formik.setFieldValue('assignee', null);
  };

  const collectiveUsers = users?.account?.members.nodes.map(node => node.account);

  return (
    <StyledModal width="382px" onClose={handleClose} trapFocus {...modalProps}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={handleClose}>
          <FormattedMessage id="Host.VirtualCards.AssignCard" defaultMessage="Assign Card" />
        </ModalHeader>
        <ModalBody pt={2}>
          <P>
            <FormattedMessage
              id="Host.VirtualCards.AssignCard.Description"
              defaultMessage="Assign existing card to a collective sharing the private information below."
            />
          </P>
          <StyledHr borderColor="black.300" mt={3} />
          <Grid mt={3} gridTemplateColumns="repeat(2, 1fr)" gridGap="26px 8px">
            <StyledInputField
              gridColumn="1/3"
              labelFontSize="13px"
              label={<FormattedMessage defaultMessage="Which collective will be assigned to this card?" />}
              htmlFor="collective"
              error={formik.touched.collective && formik.errors.collective}
            >
              {inputProps => (
                <CollectivePickerAsync
                  {...inputProps}
                  hostCollectiveIds={[host.legacyId]}
                  name="collective"
                  id="collective"
                  collective={formik.values.collective}
                  isDisabled={!!collective || isBusy}
                  customOptions={[
                    {
                      value: host,
                      label: host.name,
                      [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true,
                    },
                  ]}
                  onChange={handleCollectivePick}
                  filterResults={collectives => collectives.filter(c => c.isActive)}
                />
              )}
            </StyledInputField>
            {virtualCardsAssignedToCollectiveData &&
              virtualCardsAssignedToCollectiveData.host.allCards.totalCount > 0 && (
                <Box gridColumn="1/3">
                  <MessageBox
                    type={
                      virtualCardsAssignedToCollectiveData.host.cardsMissingReceipts.totalCount > 0
                        ? 'error'
                        : 'warning'
                    }
                  >
                    <FormattedMessage
                      defaultMessage="This collective already has {allCardsCount} other cards assigned to it. {missingReceiptsCardsCount, plural, =0 {} other {# of the {allCardsCount} cards have missing receipts.}}"
                      values={{
                        allCardsCount: virtualCardsAssignedToCollectiveData.host.allCards.totalCount,
                        missingReceiptsCardsCount:
                          virtualCardsAssignedToCollectiveData.host.cardsMissingReceipts.totalCount,
                      }}
                    />
                    <Box mt={3}>
                      <StyledLink
                        href={`/${host.slug}/admin/host-virtual-cards?collective=${formik.values?.collective?.slug}`}
                      >
                        <FormattedMessage defaultMessage="View Assigned Cards" />
                      </StyledLink>
                    </Box>
                  </MessageBox>
                </Box>
              )}
            <StyledInputField
              gridColumn="1/3"
              labelFontSize="13px"
              label={<FormattedMessage defaultMessage="Which user will be responsible for this card?" />}
              htmlFor="assignee"
              error={formik.touched.assignee && formik.errors.assignee}
            >
              {inputProps => (
                <CollectivePicker
                  {...inputProps}
                  name="assignee"
                  id="assignee"
                  groupByType={false}
                  collectives={collectiveUsers}
                  collective={formik.values.assignee}
                  isDisabled={isLoadingUsers || isBusy}
                  onChange={option => formik.setFieldValue('assignee', option.value)}
                />
              )}
            </StyledInputField>

            <StyledInputField
              gridColumn="1/3"
              labelFontSize="13px"
              label="What payment provider do you use for this card?"
              htmlFor="provider"
              error={formik.touched.provider && formik.errors.provider}
            >
              {inputProps => (
                <StyledSelect
                  {...inputProps}
                  id="provider"
                  inputId="provider"
                  placeholder="Select"
                  options={[{ key: 'STRIPE', value: 'STRIPE', label: 'Stripe' }]}
                  isSearchable={false}
                  disabled={true}
                  value={{ key: 'STRIPE', value: 'STRIPE', label: 'Stripe' }}
                  onChange={option => formik.setFieldValue('provider', option.value)}
                />
              )}
            </StyledInputField>

            <StyledInputField
              gridColumn="1/3"
              labelFontSize="13px"
              label={<FormattedMessage defaultMessage="Card name" />}
              htmlFor="cardName"
              error={formik.touched.cardName && formik.errors.cardName}
            >
              {inputProps => (
                <StyledInput
                  {...inputProps}
                  name="cardName"
                  id="cardName"
                  onChange={formik.handleChange}
                  value={formik.values.cardName}
                  disabled={isBusy}
                  guide={false}
                />
              )}
            </StyledInputField>

            <StyledInputField
              gridColumn="1/3"
              labelFontSize="13px"
              label={<FormattedMessage defaultMessage="Card number" />}
              htmlFor="number"
              error={formik.touched.cardNumber && formik.errors.cardNumber}
            >
              {inputProps => (
                <StyledInputMask
                  {...inputProps}
                  name="cardNumber"
                  id="cardNumber"
                  onChange={formik.handleChange}
                  value={formik.values.cardNumber}
                  mask={[
                    /\d/,
                    /\d/,
                    /\d/,
                    /\d/,
                    ' ',
                    ' ',
                    /\d/,
                    /\d/,
                    /\d/,
                    /\d/,
                    ' ',
                    ' ',
                    /\d/,
                    /\d/,
                    /\d/,
                    /\d/,
                    ' ',
                    ' ',
                    /\d/,
                    /\d/,
                    /\d/,
                    /\d/,
                  ]}
                  render={(ref, props) => (
                    <StyledInputGroup
                      prepend={<CreditCard height="18px" style={{ marginTop: '-1px' }} />}
                      prependProps={{ bg: 'transparent', ml: 2 }}
                      innerRef={ref}
                      {...props}
                    />
                  )}
                  disabled={isBusy}
                  guide={false}
                />
              )}
            </StyledInputField>
            <StyledInputField
              labelFontSize="13px"
              label={<FormattedMessage defaultMessage="Expiry date" />}
              htmlFor="expiryDate"
              error={formik.touched.expiryDate && formik.errors.expiryDate}
            >
              {inputProps => (
                <StyledInputMask
                  {...inputProps}
                  name="expiryDate"
                  id="expiryDate"
                  onChange={formik.handleChange}
                  value={formik.values.expiryDate}
                  mask={[/[01]/, /\d/, '/', '2', '0', /\d/, /\d/]}
                  placeholder="MM/YYYY"
                  guide={false}
                  disabled={isBusy}
                />
              )}
            </StyledInputField>
            <StyledInputField
              labelFontSize="13px"
              label={<FormattedMessage defaultMessage="CVV/CVC" />}
              htmlFor="cvv"
              error={formik.touched.cvv && formik.errors.cvv}
            >
              {inputProps => (
                <StyledInputMask
                  {...inputProps}
                  id="cvv"
                  name="cvv"
                  onChange={formik.handleChange}
                  value={formik.values.cvv}
                  mask={[/\d/, /\d/, /\d/]}
                  guide={false}
                  placeholder="123"
                  disabled={isBusy}
                />
              )}
            </StyledInputField>
          </Grid>
          <Box mt={3}>
            <StripeVirtualCardComplianceStatement />
          </Box>
        </ModalBody>
        <ModalFooter isFullWidth>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isBusy}
              disabled={isLoadingVirtualCardsAssignedToCollective}
              type="submit"
              textTransform="capitalize"
            >
              <FormattedMessage id="SaveCard" defaultMessage="Save Card" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </form>
    </StyledModal>
  );
};

AssignVirtualCardModal.propTypes = {
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  host: PropTypes.shape({
    legacyId: PropTypes.number,
    slug: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    name: PropTypes.string,
    imageUrl: PropTypes.string,
  }).isRequired,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    name: PropTypes.string,
    imageUrl: PropTypes.string,
  }),
};

/** @component */
export default AssignVirtualCardModal;
