import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { debounce } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import CollectivePicker from '../CollectivePicker';
import Container from '../Container';
import { Grid } from '../Grid';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const MAXIMUM_MONTHLY_LIMIT = 2000;

const editVirtualCardMutation = gql`
  mutation editVirtualCard(
    $virtualCard: VirtualCardReferenceInput!
    $name: String!
    $monthlyLimit: AmountInput
    $assignee: AccountReferenceInput!
  ) {
    editVirtualCard(virtualCard: $virtualCard, name: $name, monthlyLimit: $monthlyLimit, assignee: $assignee) {
      id
      name
      spendingLimitAmount
      assignee {
        id
        name
        slug
        imageUrl
      }
    }
  }
`;

// TODO : refactor this mutation
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

const EditVirtualCardModal = ({ virtualCard, onSuccess, onClose, ...modalProps }) => {
  const { addToast } = useToasts();

  const [editVirtualCard, { loading: isBusy }] = useMutation(editVirtualCardMutation, {
    context: API_V2_CONTEXT,
  });
  const [getCollectiveUsers, { loading: isLoadingUsers, data: users }] = useLazyQuery(collectiveMembersQuery, {
    context: API_V2_CONTEXT,
  });

  const canEditMonthlyLimit = virtualCard.spendingLimitInterval === 'MONTHLY' && virtualCard.provider === 'STRIPE';

  const formik = useFormik({
    initialValues: {
      cardName: virtualCard.name,
      assignee: virtualCard.assignee,
      monthlyLimit: canEditMonthlyLimit ? virtualCard.spendingLimitAmount : undefined,
    },
    async onSubmit(values) {
      const { assignee, cardName, monthlyLimit } = values;

      try {
        const variables = {
          virtualCard: { id: virtualCard.id },
          name: cardName,
          assignee: { id: assignee.id },
        };

        if (canEditMonthlyLimit) {
          variables.monthlyLimit = {
            currency: virtualCard.currency,
            valueInCents: monthlyLimit,
            value: monthlyLimit / 100,
          };
        }

        await editVirtualCard({ variables });
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

      onSuccess?.(<FormattedMessage defaultMessage="Card successfully updated" />);
      handleClose();
    },
    validate(values) {
      const errors = {};
      if (!values.assignee) {
        errors.assignee = 'Required';
      }
      if (!values.cardName) {
        errors.cardName = 'Required';
      }
      if (canEditMonthlyLimit && !values.monthlyLimit) {
        errors.monthlyLimit = 'Required';
      }
      if (canEditMonthlyLimit && values.monthlyLimit > MAXIMUM_MONTHLY_LIMIT * 100) {
        errors.monthlyLimit = `Monthly limit should not exceed ${MAXIMUM_MONTHLY_LIMIT}`;
      }
      return errors;
    },
  });

  useEffect(() => {
    throttledCall(getCollectiveUsers, { slug: virtualCard.account.slug });
  });

  const handleClose = () => {
    onClose?.();
  };

  const collectiveUsers = users?.account?.members.nodes.map(node => node.account);

  return (
    <StyledModal width="382px" onClose={handleClose} trapFocus {...modalProps}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={handleClose}>
          <FormattedMessage defaultMessage="Edit virtual card" />
        </ModalHeader>
        <ModalBody pt={2}>
          <P>
            <FormattedMessage defaultMessage="Edit virtual card for a collective with the information below." />
          </P>
          <StyledHr borderColor="black.300" mt={3} />
          <Grid mt={3} gridTemplateColumns="repeat(2, 1fr)" gridGap="26px 8px">
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

            {canEditMonthlyLimit && (
              <StyledInputField
                gridColumn="1/3"
                labelFontSize="13px"
                label={<FormattedMessage defaultMessage="Monthly limit" />}
                htmlFor="monthlyLimit"
                error={formik.touched.monthlyLimit && formik.errors.monthlyLimit}
              >
                {inputProps => (
                  <StyledInputAmount
                    {...inputProps}
                    id="monthlyLimit"
                    currency={virtualCard.currency}
                    prepend={virtualCard.currency}
                    onChange={value => formik.setFieldValue('monthlyLimit', value)}
                    value={formik.values.monthlyLimit}
                    disabled={isBusy}
                  />
                )}
              </StyledInputField>
            )}
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
              <FormattedMessage defaultMessage="Update" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </form>
    </StyledModal>
  );
};

EditVirtualCardModal.propTypes = {
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  virtualCard: PropTypes.shape({
    id: PropTypes.string,
    account: {
      slug: PropTypes.string,
    },
    name: PropTypes.string,
    assignee: {
      id: PropTypes.string,
      imageUrl: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
    },
    currency: PropTypes.string,
    spendingLimitAmount: PropTypes.number,
    spendingLimitInterval: PropTypes.string,
    provider: PropTypes.string,
  }),
};

/** @component */
export default EditVirtualCardModal;
