import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Container from '../Container';
import { Box } from '../Grid';
import HTMLContent from '../HTMLContent';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';
import { P, Span } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const initialValues = {
  agreement: false,
  notes: undefined,
  budget: undefined,
  purpose: undefined,
};

const requestVirtualCardMutation = gql`
  mutation requestVirtualCard($notes: String, $purpose: String, $budget: Int, $account: AccountReferenceInput!) {
    requestVirtualCard(notes: $notes, purpose: $purpose, budget: $budget, account: $account)
  }
`;

const RequestVirtualCardModal = props => {
  const hasPolicy = Boolean(props.host?.settings?.virtualcards?.policy);

  const { addToast } = useToasts();
  const [requestNewVirtualCard, { loading: isCreating, error: createError }] = useMutation(requestVirtualCardMutation, {
    context: API_V2_CONTEXT,
  });
  const formik = useFormik({
    initialValues: { ...initialValues, collective: props.collective },
    async onSubmit(values) {
      const { collective, notes, purpose, budget } = values;
      await requestNewVirtualCard({
        variables: {
          notes,
          purpose,
          budget,
          account: typeof collective.id === 'string' ? { id: collective.id } : { legacyId: collective.id },
        },
      });
      props.onSuccess?.();
      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage id="Collective.VirtualCards.RequestCard.Success" defaultMessage="Card requested!" />,
      });
      props.onClose?.();
    },
    validate(values) {
      const errors = {};
      if (!values.agreement) {
        errors.agreement = 'Required';
      }
      if (!values.purpose) {
        errors.purpose = 'Required';
      }
      if (!values.notes && values.notes?.lenght > 10) {
        errors.notes = 'Required';
      }
      return errors;
    },
  });

  const handleClose = () => {
    formik.setErrors({});
    props.onClose?.();
  };

  return (
    <StyledModal width="382px" onClose={handleClose} trapFocus {...props}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={props.onClose}>
          <FormattedMessage id="Collective.VirtualCards.RequestCard" defaultMessage="Request a Card" />
        </ModalHeader>
        <ModalBody pt={2}>
          <P>
            <FormattedMessage
              id="Collective.VirtualCards.RequestCard.Description"
              defaultMessage="You can request your fiscal host to assign you a credit card for your expenses."
            />
          </P>
          {hasPolicy && (
            <Fragment>
              <StyledHr borderColor="black.300" my={3} />
              <P fontSize="13px" fontWeight="600" lineHeight="16px">
                <FormattedMessage id="Collective.VirtualCards.RequestCard.Policy" defaultMessage="Card use policy" />
              </P>
              <Box mt={2}>
                <HTMLContent content={props.host.settings?.virtualcards?.policy} />
              </Box>
            </Fragment>
          )}
          <StyledHr borderColor="black.300" my={3} />
          <StyledInputField
            labelFontSize="13px"
            label={
              <FormattedMessage
                id="Collective.VirtualCards.RequestCard.MonthlyBudget"
                defaultMessage="Monthly Budget"
              />
            }
            htmlFor="budget"
            error={formik.touched.budget && formik.errors.budget}
            labelFontWeight="500"
          >
            {inputProps => (
              <StyledInputAmount
                {...inputProps}
                currency="USD"
                name="budget"
                id="budget"
                onChange={value => formik.setFieldValue('budget', value)}
                value={formik.values.budget}
                disabled={isCreating}
              />
            )}
          </StyledInputField>
          <StyledInputField
            mt={3}
            labelFontSize="13px"
            label={<FormattedMessage id="Collective.VirtualCards.RequestCard.Purpose" defaultMessage="Purpose" />}
            htmlFor="purpose"
            error={formik.touched.purpose && formik.errors.purpose}
            labelFontWeight="500"
            useRequiredLabel
            required
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                name="purpose"
                id="purpose"
                onChange={formik.handleChange}
                value={formik.values.purpose}
                type="text"
                disabled={isCreating}
              />
            )}
          </StyledInputField>
          <StyledInputField
            mt={3}
            labelFontSize="13px"
            label={
              <FormattedMessage
                id="PrivateNotesToAdministrators"
                defaultMessage="Private notes to the administrators"
              />
            }
            htmlFor="notes"
            error={formik.touched.notes && formik.errors.notes}
            labelFontWeight="500"
            useRequiredLabel
            required
          >
            {inputProps => (
              <StyledTextarea
                {...inputProps}
                name="notes"
                id="notes"
                onChange={formik.handleChange}
                value={formik.values.notes}
                disabled={isCreating}
              />
            )}
          </StyledInputField>
          <Box mt={3}>
            <StyledCheckbox
              name="tos"
              label={
                <Span fontSize="12px" fontWeight="400" lineHeight="16px">
                  <FormattedMessage
                    id="Collective.VirtualCards.RequestCard.Agreement"
                    defaultMessage="I agree to all the terms and conditions set by the host and Open Collective"
                  />
                  <Span color="black.500"> *</Span>
                </Span>
              }
              required
              checked={formik.values.agreement}
              onChange={({ checked }) => formik.setFieldValue('agreement', checked)}
              error={formik.touched.agreement && formik.errors.agreement}
            />
          </Box>
          {createError && (
            <Box mt={3}>
              <MessageBox type="error" fontSize="13px">
                {createError.message}
              </MessageBox>
            </Box>
          )}
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
              disabled={!formik.isValid}
            >
              <FormattedMessage id="RequestCard" defaultMessage="Request Card" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </form>
    </StyledModal>
  );
};

RequestVirtualCardModal.propTypes = {
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  host: PropTypes.shape({
    legacyId: PropTypes.number,
    slug: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    name: PropTypes.string,
    imageUrl: PropTypes.string,
    settings: PropTypes.shape({
      virtualcards: PropTypes.shape({
        autopause: PropTypes.bool,
        requestcard: PropTypes.bool,
        policy: PropTypes.string,
      }),
    }),
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
export default RequestVirtualCardModal;
