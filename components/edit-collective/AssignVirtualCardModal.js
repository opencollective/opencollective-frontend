import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { FLAG_COLLECTIVE_PICKER_COLLECTIVE } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import { Box, Grid } from '../Grid';
import CreditCard from '../icons/CreditCard';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import StyledInputMask from '../StyledInputMask';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { P } from '../Text';

const initialValues = {
  cardNumber: undefined,
  collective: undefined,
  expireDate: undefined,
  cvv: undefined,
};

const assignNewVirtualCardMutation = gqlV2/* GraphQL */ `
  mutation assignNewVirtualCard($virtualCard: VirtualCardInput!, $account: AccountReferenceInput!) {
    assignNewVirtualCard(virtualCard: $virtualCard, account: $account) {
      id
      name
      last4
      data
    }
  }
`;

const AssignVirtualCardModal = props => {
  const [assignNewVirtualCard, { loading: isCreating, error: createError }] = useMutation(
    assignNewVirtualCardMutation,
    { context: API_V2_CONTEXT },
  );

  const formik = useFormik({
    initialValues: { ...initialValues, collective: props.collective },
    async onSubmit(values) {
      const { collective, ...privateData } = values;
      await assignNewVirtualCard({
        variables: {
          virtualCard: {
            privateData,
          },
          account: { legacyId: collective.id },
        },
      });
      props.onSuccess?.();
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
      if (!values.expireDate) {
        errors.expireDate = 'Required';
      }
      if (!values.cvv) {
        errors.cvv = 'Required';
      }
      return errors;
    },
  });

  const handleClose = () => {
    formik.resetForm(initialValues);
    formik.setErrors({});
    props.onClose?.();
  };

  return (
    <Modal width="382px" onClose={handleClose} trapFocus {...props}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={props.onClose}>
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
              label="Which collective will be assigned to this card?"
              htmlFor="collective"
              error={formik.touched.collective && formik.errors.collective}
            >
              {inputProps => (
                <CollectivePickerAsync
                  {...inputProps}
                  hostCollectiveIds={[props.host.legacyId]}
                  name="collective"
                  id="collective"
                  collective={formik.values.collective}
                  isDisabled={!!props.collective}
                  customOptions={[
                    {
                      value: props.host,
                      label: props.host.name,
                      [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true,
                    },
                  ]}
                  onChange={option => formik.setFieldValue('collective', option.value)}
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
                  disabled={isCreating}
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
                  disabled={isCreating}
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
                  disabled={isCreating}
                />
              )}
            </StyledInputField>
            {createError && (
              <Box gridColumn="1/3">
                <MessageBox type="error" fontSize="13px">
                  {createError.message}
                </MessageBox>
              </Box>
            )}
          </Grid>
        </ModalBody>
        <ModalFooter isFullWidth>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle={'primary'}
              data-cy="confirmation-modal-continue"
              loading={isCreating}
              type="submit"
            >
              <FormattedMessage id="SaveCard" defaultMessage="Save Card" />
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
};

/** @component */
export default AssignVirtualCardModal;
