import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { debounce } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import roles from '../../lib/constants/roles';
import { VirtualCardMaximumLimitForInterval } from '../../lib/constants/virtual-cards';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { VirtualCardLimitInterval } from '../../lib/graphql/types/v2/graphql';

import CollectivePicker from '../CollectivePicker';
import Container from '../Container';
import { Grid } from '../Grid';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';
import { useLoggedInUser } from '../UserProvider';

const editVirtualCardMutation = gql`
  mutation editVirtualCard(
    $virtualCard: VirtualCardReferenceInput!
    $name: String!
    $limitAmount: AmountInput
    $limitInterval: VirtualCardLimitInterval
    $assignee: AccountReferenceInput!
  ) {
    editVirtualCard(
      virtualCard: $virtualCard
      name: $name
      limitAmount: $limitAmount
      limitInterval: $limitInterval
      assignee: $assignee
    ) {
      id
      name
      spendingLimitAmount
      spendingLimitInterval
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

const EditVirtualCardModal = ({ virtualCard, onSuccess, onClose, host, ...modalProps }) => {
  const { addToast } = useToasts();

  const [editVirtualCard, { loading: isBusy }] = useMutation(editVirtualCardMutation, {
    context: API_V2_CONTEXT,
  });
  const [getCollectiveUsers, { loading: isLoadingUsers, data: users }] = useLazyQuery(collectiveMembersQuery, {
    context: API_V2_CONTEXT,
  });

  const { LoggedInUser } = useLoggedInUser();
  const isHostAdmin = LoggedInUser?.hasRole(roles.ADMIN, host);

  const canEditLimit = isHostAdmin && virtualCard.provider === 'STRIPE';

  const formik = useFormik({
    initialValues: {
      cardName: virtualCard.name,
      assignee: virtualCard.assignee,
      limitAmount: canEditLimit ? virtualCard.spendingLimitAmount : undefined,
      limitInterval: canEditLimit ? virtualCard.spendingLimitInterval : undefined,
    },
    async onSubmit(values) {
      const { assignee, cardName, limitAmount, limitInterval } = values;

      try {
        const variables = {
          virtualCard: { id: virtualCard.id },
          name: cardName,
          assignee: { id: assignee.id },
        };

        if (canEditLimit) {
          variables.limitAmount = {
            currency: virtualCard.currency,
            valueInCents: limitAmount,
            value: limitAmount / 100,
          };

          variables.limitInterval = limitInterval;
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
      if (canEditLimit && !values.limitAmount) {
        errors.limitAmount = 'Required';
      }
      if (values.limitInterval) {
        const maximumLimitForInterval = VirtualCardMaximumLimitForInterval[values.limitInterval];
        if (values.limitAmount > maximumLimitForInterval * 100) {
          errors.limitAmount = `Limit for this interval should not exceed ${maximumLimitForInterval} ${
            values.collective?.currency || 'USD'
          }`;
        }
      }
      if (canEditLimit && !values.limitInterval) {
        errors.limitInterval = 'Required';
      }
      return errors;
    },
  });

  useEffect(() => {
    throttledCall(getCollectiveUsers, { slug: virtualCard.account.slug });
  });

  const intl = useIntl();

  const handleClose = () => {
    onClose?.();
  };

  const virtualCardLimitOptions = [
    {
      value: VirtualCardLimitInterval.ALL_TIME,
      label: intl.formatMessage({ id: 'virtualCard.intervalLimit.all_time', defaultMessage: 'all time' }),
    },
    {
      value: VirtualCardLimitInterval.DAILY,
      label: intl.formatMessage({ id: 'virtualCard.intervalLimit.daily', defaultMessage: 'daily' }),
    },
    {
      value: VirtualCardLimitInterval.MONTHLY,
      label: intl.formatMessage({ id: 'virtualCard.intervalLimit.monthly', defaultMessage: 'monthly' }),
    },
    {
      value: VirtualCardLimitInterval.PER_AUTHORIZATION,
      label: intl.formatMessage({
        id: 'virtualCard.intervalLimit.per_authorization',
        defaultMessage: 'per authorization',
      }),
    },
    {
      value: VirtualCardLimitInterval.WEEKLY,
      label: intl.formatMessage({ id: 'virtualCard.intervalLimit.weekly', defaultMessage: 'weekly' }),
    },
    {
      value: VirtualCardLimitInterval.YEARLY,
      label: intl.formatMessage({ id: 'virtualCard.intervalLimit.yearly', defaultMessage: 'yearly' }),
    },
  ];

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

            {canEditLimit && (
              <StyledInputField
                gridColumn="1/3"
                labelFontSize="13px"
                label={<FormattedMessage defaultMessage="Limit" />}
                htmlFor="limitAmount"
                error={formik.touched.limitAmount && formik.errors.limitAmount}
              >
                {inputProps => (
                  <StyledInputAmount
                    {...inputProps}
                    id="limitAmount"
                    currency={virtualCard.currency}
                    prepend={virtualCard.currency}
                    onChange={value => formik.setFieldValue('limitAmount', value)}
                    value={formik.values.limitAmount}
                    disabled={isBusy}
                  />
                )}
              </StyledInputField>
            )}
            {canEditLimit && (
              <StyledInputField
                gridColumn="1/3"
                labelFontSize="13px"
                label={<FormattedMessage defaultMessage="Limit interval" />}
                htmlFor="limitInterval"
                error={formik.touched.limitInterval && formik.errors.limitInterval}
              >
                {inputProps => (
                  <StyledSelect
                    {...inputProps}
                    inputId="limitInterval"
                    data-cy="limitInterval"
                    error={formik.errors.limitInterval}
                    onBlur={() => formik.setFieldTouched('limitInterval', true)}
                    onChange={({ value }) => formik.setFieldValue('limitInterval', value)}
                    isLoading={isBusy}
                    options={virtualCardLimitOptions}
                    value={virtualCardLimitOptions.find(option => option.value === formik.values.limitInterval)}
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
  host: PropTypes.object,
};

/** @component */
export default EditVirtualCardModal;
