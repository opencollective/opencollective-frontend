import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { useFormik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { VirtualCardLimitInterval } from '../../lib/graphql/types/v2/graphql';
import {
  VirtualCardLimitIntervalDescriptionsI18n,
  VirtualCardLimitIntervalI18n,
} from '../../lib/virtual-cards/constants';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import StyledTextarea from '../StyledTextarea';
import { P, Span } from '../Text';
import { useToast } from '../ui/useToast';
import { StripeVirtualCardComplianceStatement } from '../virtual-cards/StripeVirtualCardComplianceStatement';

const initialValues = {
  agreement: false,
  notes: undefined,
  purpose: undefined,
  spendingLimitAmount: undefined,
  spendingLimitInterval: VirtualCardLimitInterval.MONTHLY,
};

const requestVirtualCardMutation = gql`
  mutation RequestVirtualCard(
    $notes: String
    $purpose: String
    $spendingLimitAmount: AmountInput!
    $spendingLimitInterval: VirtualCardLimitInterval!
    $account: AccountReferenceInput!
  ) {
    requestVirtualCard(
      notes: $notes
      purpose: $purpose
      spendingLimitAmount: $spendingLimitAmount
      spendingLimitInterval: $spendingLimitInterval
      account: $account
    )
  }
`;

const RequestVirtualCardModal = props => {
  const hasPolicy = Boolean(props.host?.settings?.virtualcards?.policy);
  const intl = useIntl();

  const virtualCardLimitOptions = Object.keys(VirtualCardLimitInterval).map(interval => ({
    value: interval,
    label: intl.formatMessage(VirtualCardLimitIntervalI18n[interval]),
  }));

  const { toast } = useToast();
  const [requestNewVirtualCard, { loading: isCreating, error: createError }] = useMutation(requestVirtualCardMutation, {
    context: API_V2_CONTEXT,
  });
  const formik = useFormik({
    initialValues: { ...initialValues, collective: props.collective },
    async onSubmit(values) {
      const { collective, notes, purpose, spendingLimitAmount, spendingLimitInterval } = values;
      await requestNewVirtualCard({
        variables: {
          notes,
          purpose,
          account: typeof collective.id === 'string' ? { id: collective.id } : { legacyId: collective.id },
          spendingLimitAmount: {
            valueInCents: spendingLimitAmount,
          },
          spendingLimitInterval,
        },
      });
      props.onSuccess?.();
      toast({
        variant: 'success',
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

  const currency = props.host?.currency || props.collective?.currency;

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
            mt={3}
            labelFontSize="13px"
            label={<FormattedMessage id="Fields.purpose" defaultMessage="Purpose" />}
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
          <Flex mt={3} width="100%" alignItems="flex-start" justifyContent="space-between">
            <StyledInputField
              flexGrow={1}
              labelFontSize="13px"
              labelFontWeight="bold"
              label={
                <FormattedMessage
                  defaultMessage="Limit Interval <link>(Read More)</link>"
                  values={{
                    link: getI18nLink({
                      as: Link,
                      openInNewTab: true,
                      href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/virtual-cards',
                    }),
                  }}
                />
              }
              htmlFor="spendingLimitInterval"
            >
              {inputProps => (
                <StyledSelect
                  {...inputProps}
                  inputId="spendingLimitInterval"
                  data-cy="spendingLimitInterval"
                  error={formik.touched.limitAmount && Boolean(formik.errors.limitAmount)}
                  onBlur={() => formik.setFieldTouched('spendingLimitInterval', true)}
                  onChange={({ value }) => formik.setFieldValue('spendingLimitInterval', value)}
                  disabled={isCreating}
                  options={virtualCardLimitOptions}
                  value={virtualCardLimitOptions.find(option => option.value === formik.values.spendingLimitInterval)}
                />
              )}
            </StyledInputField>
            <StyledInputField
              ml={3}
              labelFontSize="13px"
              labelFontWeight="bold"
              label={<FormattedMessage defaultMessage="Card Limit" />}
              htmlFor="spendingLimitAmount"
            >
              {inputProps => (
                <StyledInputAmount
                  {...inputProps}
                  id="spendingLimitAmount"
                  placeholder="0.00"
                  error={formik.touched.spendingLimitAmount && Boolean(formik.errors.spendingLimitAmount)}
                  currency={currency}
                  prepend={currency}
                  onChange={value => formik.setFieldValue('spendingLimitAmount', value)}
                  value={formik.values.spendingLimitAmount}
                  disabled={isCreating}
                />
              )}
            </StyledInputField>
          </Flex>
          <Box pt={2}>
            <Span ml={1}>
              {intl.formatMessage(VirtualCardLimitIntervalDescriptionsI18n[formik.values.spendingLimitInterval])}
            </Span>
          </Box>
          {formik.touched.spendingLimitAmount && formik.errors.spendingLimitAmount && (
            <Box pt={2}>
              <ExclamationCircle color="#E03F6A" size={16} />
              <Span ml={1} color="black.700" fontSize="14px">
                {formik.errors.spendingLimitAmount}
              </Span>
            </Box>
          )}
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
          <Box mt={3}>
            <StripeVirtualCardComplianceStatement />
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
    currency: PropTypes.string,
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
    currency: PropTypes.string,
    imageUrl: PropTypes.string,
  }),
};

/** @component */
export default RequestVirtualCardModal;
