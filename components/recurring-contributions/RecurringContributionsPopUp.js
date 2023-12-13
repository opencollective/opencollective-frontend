import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { CreditCard } from '@styled-icons/boxicons-regular/CreditCard';
import { Dollar } from '@styled-icons/boxicons-regular/Dollar';
import { XCircle } from '@styled-icons/boxicons-regular/XCircle';
import { themeGet } from '@styled-system/theme-get';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import Container from '../Container';
import { Flex } from '../Grid';
import I18nFormatters from '../I18nFormatters';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { slideInUp } from '../StyledKeyframes';
import StyledRadioList from '../StyledRadioList';
import StyledTextarea from '../StyledTextarea';
import { P, Span } from '../Text';
import { useToast } from '../ui/useToast';
import { withUser } from '../UserProvider';

import UpdateOrderPopUp from './UpdateOrderPopUp';
import UpdatePaymentMethodPopUp from './UpdatePaymentMethodPopUp';

//  Styled components
const RedXCircle = styled(XCircle)`
  color: ${themeGet('colors.red.500')};
`;

const GrayXCircle = styled(XCircle)`
  color: ${themeGet('colors.black.500')};
  cursor: pointer;
`;

const MenuItem = styled(Flex).attrs({
  px: 3,
})`
  cursor: pointer;
`;

const PopUpMenu = styled(Flex)`
  position: absolute;
  bottom: 0;
  z-index: 998;
  background: white;
  border-radius: 8px;
  box-shadow: 0px 2px 7px rgba(0, 0, 0, 0.5);
  min-height: 180px;
  max-height: 360px;
  width: 100%;
  overflow-y: auto;
  padding: 4px 0;
  animation: ${slideInUp} 0.2s;
`;

const MenuSection = styled(Flex).attrs({
  flexDirection: 'column',
  width: 1,
})``;

const i18nReasons = defineMessages({
  NO_LONGER_WANT_TO_SUPPORT: {
    id: 'subscription.cancel.reason1',
    defaultMessage: 'No longer want to back the collective',
  },
  UPDATING_ORDER: { id: 'subscription.cancel.reason2', defaultMessage: 'Changing payment method or amount' },
  OTHER: { id: 'subscription.cancel.other', defaultMessage: 'Other' },
});

// GraphQL
const cancelRecurringContributionMutation = gql`
  mutation RecurringContributionsPopUpCancel($order: OrderReferenceInput!, $reason: String!, $reasonCode: String!) {
    cancelOrder(order: $order, reason: $reason, reasonCode: $reasonCode) {
      id
      status
    }
  }
`;

const RecurringContributionsPopUp = ({ contribution, status, onCloseEdit, account, LoggedInUser }) => {
  const { toast } = useToast();
  const [menuState, setMenuState] = useState('mainMenu');
  const intl = useIntl();
  const [cancelReason, setCancelReason] = useState('NO_LONGER_WANT_TO_SUPPORT');
  const [cancelReasonMessage, setCancelReasonMessage] = useState('');
  const [submitCancellation, { loading: loadingCancellation }] = useMutation(cancelRecurringContributionMutation, {
    context: API_V2_CONTEXT,
  });

  const mainMenu =
    menuState === 'mainMenu' &&
    (status === ORDER_STATUS.ACTIVE ||
      status === ORDER_STATUS.ERROR ||
      status === ORDER_STATUS.PROCESSING ||
      status === ORDER_STATUS.NEW);
  const cancelMenu = menuState === 'cancelMenu';
  const updateOrderMenu = menuState === 'updateOrderMenu';
  const paymentMethodMenu = menuState === 'paymentMethodMenu';

  return (
    <PopUpMenu data-cy="recurring-contribution-menu">
      {mainMenu && (
        <MenuSection>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center" px={3}>
            <P my={2} fontSize="12px" textTransform="uppercase" color="black.700">
              <FormattedMessage id="header.options" defaultMessage="Options" />
            </P>
            <Flex flexGrow={1} alignItems="center">
              <StyledHr width="100%" mx={2} />
            </Flex>
            <GrayXCircle size={26} onClick={onCloseEdit} />
          </Flex>
          {/** This popup is also used by root users, and we don't want them to touch the payment methods */}
          {account.type !== 'COLLECTIVE' && Boolean(LoggedInUser?.isAdminOfCollective(account)) && (
            <MenuItem
              flexGrow={1 / 4}
              width={1}
              alignItems="center"
              justifyContent="space-around"
              onClick={() => {
                setMenuState('paymentMethodMenu');
              }}
              data-cy="recurring-contribution-menu-payment-option"
            >
              <Flex width={1 / 6}>
                <CreditCard size={20} />
              </Flex>
              <Flex flexGrow={1}>
                <P fontSize="14px" fontWeight="400">
                  <FormattedMessage id="subscription.menu.editPaymentMethod" defaultMessage="Update payment method" />
                </P>
              </Flex>
            </MenuItem>
          )}
          <MenuItem
            flexGrow={1 / 4}
            width={1}
            alignItems="center"
            justifyContent="space-between"
            onClick={() => {
              setMenuState('updateOrderMenu');
            }}
            data-cy="recurring-contribution-menu-tier-option"
          >
            <Flex width={1 / 6}>
              <Dollar size={20} />
            </Flex>
            <Flex flexGrow={1}>
              <P fontSize="14px" fontWeight="400">
                <FormattedMessage id="subscription.menu.updateAmount" defaultMessage="Update amount" />
              </P>
            </Flex>
          </MenuItem>
          <MenuItem
            flexGrow={1 / 4}
            width={1}
            alignItems="center"
            justifyContent="center"
            onClick={() => {
              setMenuState('cancelMenu');
            }}
            data-cy="recurring-contribution-menu-cancel-option"
          >
            <Flex width={1 / 6}>
              <RedXCircle size={20} />
            </Flex>
            <Flex flexGrow={1}>
              <P fontSize="14px" fontWeight="400" color="red.500">
                <FormattedMessage id="subscription.menu.cancelContribution" defaultMessage="Cancel contribution" />
              </P>
            </Flex>
          </MenuItem>
        </MenuSection>
      )}

      {cancelMenu && (
        <MenuSection data-cy="recurring-contribution-cancel-menu">
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center" px={3}>
            <P my={2} fontSize="12px" textTransform="uppercase" color="black.700">
              <FormattedMessage id="subscription.menu.cancelContribution" defaultMessage="Cancel contribution" />
            </P>
            <Flex flexGrow={1} alignItems="center">
              <StyledHr width="100%" mx={2} />
            </Flex>
            <GrayXCircle size={26} onClick={onCloseEdit} />
          </Flex>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <Container p={3}>
              <P fontSize="15px" fontWeight="bold" mb="10" lineHeight="20px">
                <FormattedMessage
                  id="subscription.cancel.question"
                  defaultMessage="Why are you cancelling your subscription today? 🥺"
                />
              </P>
              <StyledHr my={2} borderColor="black.200" />
              <StyledRadioList
                id="cancel-reason-radio-list"
                defaultValue="NO_LONGER_WANT_TO_SUPPORT"
                onChange={e => setCancelReason(e.key)}
                name="cancellation-reason"
                options={['NO_LONGER_WANT_TO_SUPPORT', 'UPDATING_ORDER', 'OTHER']}
              >
                {({ value, radio }) => (
                  <Container
                    display="flex"
                    alignItems="center"
                    my={2}
                    data-cy={value}
                    fontWeight="normal"
                    fontSize="12px"
                  >
                    <Span mx={2}>{radio}</Span>
                    <span>{intl.formatMessage(i18nReasons[value])}</span>
                  </Container>
                )}
              </StyledRadioList>
              {cancelReason === 'OTHER' && (
                <StyledTextarea
                  data-cy="cancellation-text-area"
                  onChange={e => setCancelReasonMessage(e.target.value)}
                  value={cancelReasonMessage}
                  fontSize="12px"
                  placeholder={intl.formatMessage({ defaultMessage: 'Provide more details (optional)' })}
                  height={70}
                  width="100%"
                  resize="none"
                />
              )}
            </Container>
          </Flex>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center" my={1}>
            <Flex flexGrow={1} alignItems="center">
              <StyledHr width="100%" />
            </Flex>
          </Flex>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <StyledButton
              buttonSize="tiny"
              buttonStyle="secondary"
              minWidth={75}
              loading={loadingCancellation}
              data-cy="recurring-contribution-cancel-yes"
              onClick={async () => {
                try {
                  await submitCancellation({
                    variables: {
                      order: { id: contribution.id },
                      reason: cancelReason === 'OTHER' ? cancelReasonMessage : '',
                      reasonCode: cancelReason,
                    },
                  });
                  onCloseEdit();
                  toast({
                    message: (
                      <FormattedMessage
                        id="subscription.createSuccessCancel"
                        defaultMessage="Your recurring contribution has been <strong>cancelled</strong>."
                        values={I18nFormatters}
                      />
                    ),
                  });
                } catch (error) {
                  const errorMsg = getErrorFromGraphqlException(error).message;
                  toast({ variant: 'error', message: errorMsg });
                }
              }}
            >
              <FormattedMessage id="submit" defaultMessage="Submit" />
            </StyledButton>
          </Flex>
        </MenuSection>
      )}

      {paymentMethodMenu && (
        <MenuSection data-cy="recurring-contribution-payment-menu">
          <UpdatePaymentMethodPopUp
            setMenuState={setMenuState}
            contribution={contribution}
            onCloseEdit={onCloseEdit}
            account={contribution.fromAccount || account}
          />
        </MenuSection>
      )}

      {updateOrderMenu && (
        <MenuSection data-cy="recurring-contribution-order-menu">
          <UpdateOrderPopUp setMenuState={setMenuState} contribution={contribution} onCloseEdit={onCloseEdit} />
        </MenuSection>
      )}
    </PopUpMenu>
  );
};

RecurringContributionsPopUp.propTypes = {
  contribution: PropTypes.object.isRequired,
  LoggedInUser: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
  onCloseEdit: PropTypes.func,
  account: PropTypes.object.isRequired,
};

export default withUser(RecurringContributionsPopUp);
