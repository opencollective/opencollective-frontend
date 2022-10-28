import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { debounce } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import CollectivePicker, { FLAG_COLLECTIVE_PICKER_COLLECTIVE } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
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

const createVirtualCardMutation = gql`
  mutation createVirtualCard(
    $name: String!
    $monthlyLimit: AmountInput!
    $account: AccountReferenceInput!
    $assignee: AccountReferenceInput!
  ) {
    createVirtualCard(name: $name, monthlyLimit: $monthlyLimit, account: $account, assignee: $assignee) {
      id
      name
      last4
      data
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

const initialValues = {
  collective: undefined,
  assignee: undefined,
  cardName: undefined,
  monthlyLimit: undefined,
};

const CreateVirtualCardModal = ({ host, collective, onSuccess, onClose, ...modalProps }) => {
  const { addToast } = useToasts();

  const [createVirtualCard, { loading: isBusy }] = useMutation(createVirtualCardMutation, {
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
      const { collective, assignee, cardName, monthlyLimit } = values;

      try {
        await createVirtualCard({
          variables: {
            assignee: { id: assignee.id },
            account: typeof collective.id === 'string' ? { id: collective.id } : { legacyId: collective.id },
            name: cardName,
            monthlyLimit: { currency: host.currency, valueInCents: monthlyLimit },
          },
        });
      } catch (e) {
        addToast({
          type: TOAST_TYPE.ERROR,
          message: (
            <FormattedMessage
              defaultMessage="Error creating virtual card: {error}"
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
      if (!values.collective) {
        errors.collective = 'Required';
      }
      if (!values.assignee) {
        errors.assignee = 'Required';
      }
      if (!values.cardName) {
        errors.cardName = 'Required';
      }
      if (!values.monthlyLimit) {
        errors.monthlyLimit = 'Required';
      }
      if (values.monthlyLimit > MAXIMUM_MONTHLY_LIMIT * 100) {
        errors.monthlyLimit = `Monthly limit should not exceed ${MAXIMUM_MONTHLY_LIMIT} ${
          values.collective?.currency || 'USD'
        }`;
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
    <StyledModal width="382px" onClose={handleClose} trapFocus {...modalProps}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={handleClose}>
          <FormattedMessage defaultMessage="Create virtual card" />
        </ModalHeader>
        <ModalBody pt={2}>
          <P>
            <FormattedMessage defaultMessage="Create virtual card for a collective with the information below." />
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
                  currency={host.currency || 'USD'}
                  prepend={host.currency || 'USD'}
                  onChange={value => formik.setFieldValue('monthlyLimit', value)}
                  value={formik.values.monthlyLimit}
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
              <FormattedMessage defaultMessage="Create virtual card" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </form>
    </StyledModal>
  );
};

CreateVirtualCardModal.propTypes = {
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  host: PropTypes.shape({
    legacyId: PropTypes.number,
    slug: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    name: PropTypes.string,
    imageUrl: PropTypes.string,
    currency: PropTypes.string,
  }).isRequired,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    name: PropTypes.string,
    imageUrl: PropTypes.string,
    currency: PropTypes.string,
  }),
};

/** @component */
export default CreateVirtualCardModal;
