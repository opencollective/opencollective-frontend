import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery, useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { debounce } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import CollectivePicker, { FLAG_COLLECTIVE_PICKER_COLLECTIVE } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import { Grid } from '../Grid';
import CreditCard from '../icons/CreditCard';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import StyledInputMask from '../StyledInputMask';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const initialValues = {
  cardNumber: undefined,
  collective: undefined,
  expireDate: undefined,
  cvv: undefined,
  assignee: undefined,
  provider: undefined,
};

const assignNewVirtualCardMutation = gqlV2/* GraphQL */ `
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

const editVirtualCardMutation = gqlV2/* GraphQL */ `
  mutation editVirtualCard($virtualCard: VirtualCardUpdateInput!, $assignee: AccountReferenceInput) {
    editVirtualCard(virtualCard: $virtualCard, assignee: $assignee) {
      id
      name
      last4
      data
    }
  }
`;

const collectiveMembersQuery = gqlV2/* GraphQL */ `
  query CollectiveMembers($slug: String!) {
    account(slug: $slug) {
      id
      members(role: ADMIN) {
        nodes {
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

const AssignVirtualCardModal = ({ collective, host, virtualCard, onSuccess, onClose, ...modalProps }) => {
  const isEditing = !!virtualCard;
  const { addToast } = useToasts();
  const [assignNewVirtualCard, { loading: isCallingAssignMutation }] = useMutation(assignNewVirtualCardMutation, {
    context: API_V2_CONTEXT,
  });
  const [editVirtualCard, { loading: isCallingEditMutation }] = useMutation(editVirtualCardMutation, {
    context: API_V2_CONTEXT,
  });
  const [getCollectiveUsers, { loading: isLoadingUsers, data: users }] = useLazyQuery(collectiveMembersQuery, {
    context: API_V2_CONTEXT,
  });
  const isBusy = isCallingAssignMutation || isCallingEditMutation;

  const formik = useFormik({
    initialValues: {
      ...(virtualCard
        ? {
            ...virtualCard.privateData,
            assignee: virtualCard.assignee,
            provider: virtualCard.provider,
          }
        : initialValues),
      collective: collective || virtualCard?.account,
    },
    async onSubmit(values) {
      const { collective, assignee, provider, ...privateData } = values;
      if (isEditing) {
        try {
          await editVirtualCard({
            variables: {
              virtualCard: {
                privateData,
                id: virtualCard.id,
              },
              assignee: { id: assignee.id },
            },
          });
        } catch (e) {
          addToast({
            type: TOAST_TYPE.ERROR,
            message: (
              <FormattedMessage
                id="Host.VirtualCards.EditCard.Error"
                defaultMessage="Error editing card: {error}"
                values={{
                  error: e.message,
                }}
              />
            ),
          });
          return;
        }
        onSuccess?.(<FormattedMessage id="Host.VirtualCards.UpdateCard.Success" defaultMessage="Card updated" />);
      } else {
        try {
          await assignNewVirtualCard({
            variables: {
              virtualCard: {
                privateData,
                provider,
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
      }
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
      if (!values.assignee) {
        errors.assignee = 'Required';
      }
      if (!values.expireDate) {
        errors.expireDate = 'Required';
      }
      if (!values.cvv) {
        errors.cvv = 'Required';
      }
      return errors;
    },
  });

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
    <Modal width="382px" onClose={handleClose} trapFocus {...modalProps}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={handleClose}>
          {isEditing ? (
            <FormattedMessage id="Host.VirtualCards.CardDetails" defaultMessage="Card Details" />
          ) : (
            <FormattedMessage id="Host.VirtualCards.AssignCard" defaultMessage="Assign Card" />
          )}
        </ModalHeader>
        <ModalBody pt={2}>
          <P>
            {isEditing ? (
              <FormattedMessage
                id="Host.VirtualCards.CardDetails.Description"
                defaultMessage="You can view and edit the credit card details."
              />
            ) : (
              <FormattedMessage
                id="Host.VirtualCards.AssignCard.Description"
                defaultMessage="Assign existing card to a collective sharing the private information below."
              />
            )}
          </P>
          <StyledHr borderColor="black.300" mt={3} />
          <Grid mt={3} gridTemplateColumns="repeat(2, 1fr)" gridGap="26px 8px">
            <StyledInputField
              gridColumn="1/3"
              labelFontSize="13px"
              label="Which collective will be assigned to this card?"
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
                  isDisabled={!!collective || isEditing || isBusy}
                  customOptions={[
                    {
                      value: host,
                      label: host.name,
                      [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true,
                    },
                  ]}
                  onChange={handleCollectivePick}
                />
              )}
            </StyledInputField>
            <StyledInputField
              gridColumn="1/3"
              labelFontSize="13px"
              label="Which user will be responsible for this card?"
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
              label="What provider do you use for this card?"
              htmlFor="provider"
              error={formik.touched.provider && formik.errors.provider}
            >
              {inputProps => (
                <StyledSelect
                  {...inputProps}
                  id="provider"
                  inputId="provider"
                  placeholder="Select"
                  options={[
                    { key: 'privacy', value: 'privacy', label: 'Privacy' },
                    { key: 'stripe', value: 'stripe', label: 'Stripe' },
                  ]}
                  isSearchable={false}
                  disabled={isBusy || isEditing}
                  onChange={option => formik.setFieldValue('provider', option.value)}
                />
              )}
            </StyledInputField>

            <StyledInputField
              gridColumn="1/3"
              labelFontSize="13px"
              label="Card number"
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
                  disabled={isBusy || isEditing}
                  guide={false}
                />
              )}
            </StyledInputField>
            <StyledInputField
              labelFontSize="13px"
              label="Expire date"
              htmlFor="expireDate"
              error={formik.touched.expireDate && formik.errors.expireDate}
            >
              {inputProps => (
                <StyledInputMask
                  {...inputProps}
                  name="expireDate"
                  id="expireDate"
                  onChange={formik.handleChange}
                  value={formik.values.expireDate}
                  mask={[/[01]/, /\d/, '/', '2', '0', /\d/, /\d/]}
                  placeholder="MM/YYYY"
                  guide={false}
                  disabled={isBusy}
                />
              )}
            </StyledInputField>
            <StyledInputField
              labelFontSize="13px"
              label="CVV/CVC"
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
        </ModalBody>
        <ModalFooter isFullWidth>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isBusy}
              type="submit"
              textTransform="capitalize"
            >
              {isEditing ? (
                <FormattedMessage id="SaveChanges" defaultMessage="Save changes" />
              ) : (
                <FormattedMessage id="SaveCard" defaultMessage="Save Card" />
              )}
            </StyledButton>
          </Container>
        </ModalFooter>
      </form>
    </Modal>
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
  virtualCard: PropTypes.shape({
    id: PropTypes.string,
    account: {
      id: PropTypes.string,
      imageUrl: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
    },
    createdAt: PropTypes.string,
    name: PropTypes.string,
    privateData: {
      cardNumber: PropTypes.string,
      cvv: PropTypes.string,
      expireDate: PropTypes.string,
    },
    assignee: {
      id: PropTypes.string,
      imageUrl: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
    },
    provider: PropTypes.string,
  }),
};

/** @component */
export default AssignVirtualCardModal;
