import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import { CreditCard } from '@styled-icons/boxicons-regular/CreditCard';
import { Dollar } from '@styled-icons/boxicons-regular/Dollar';
import { XCircle } from '@styled-icons/boxicons-regular/XCircle';
import themeGet from '@styled-system/theme-get';
import { withRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { P } from '../Text';
import { withUser } from '../UserProvider';

import UpdateOrderPopUp from './UpdateOrderPopUp';
import UpdatePaymentMethodPopUp from './UpdatePaymentMethodPopUp';

const messages = defineMessages({
  cancel: {
    id: 'actions.cancel',
    defaultMessage: 'Cancel',
  },
  options: {
    id: 'header.options',
    defaultMessage: 'Options',
  },
  update: {
    id: 'subscription.updateAmount.update.btn',
    defaultMessage: 'Update',
  },
  updatePaymentMethod: {
    id: 'subscription.menu.editPaymentMethod',
    defaultMessage: 'Update payment method',
  },
  updateTier: {
    id: 'subscription.menu.updateTier',
    defaultMessage: 'Update tier',
  },
  cancelContribution: {
    id: 'subscription.menu.cancelContribution',
    defaultMessage: 'Cancel contribution',
  },
  areYouSureCancel: {
    id: 'subscription.menu.cancel.yes',
    defaultMessage: 'Are you sure? 🥺',
  },
  noWait: {
    id: 'subscription.menu.cancel.no',
    defaultMessage: 'No, wait',
  },
  yes: {
    id: 'yes',
    defaultMessage: 'Yes',
  },
  activateContribution: {
    id: 'subscription.menu.activateContribution',
    defaultMessage: 'Activate contribution',
  },
  areYouSureActivate: {
    id: 'subscription.menu.activate.yes',
    defaultMessage: 'Are you sure? 🎉',
  },
});

//  Styled components
const RedXCircle = styled(XCircle)`
  color: ${themeGet('colors.red.500')};
`;

const MenuItem = styled(Flex)`
  cursor: pointer;
`;

const PopUpMenu = styled(Flex)`
  position: absolute;
  bottom: 0;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  border: 1px solid ${themeGet('colors.black.300')};
  box-shadow: 0px 2px 7px rgba(0, 0, 0, 0.5);
`;

const MenuSection = styled(Flex).attrs({
  flexDirection: 'column',
  width: 1,
  px: 1,
  py: 1,
})``;

// GraphQL
const cancelRecurringContributionMutation = gqlV2/* GraphQL */ `
  mutation cancelRecurringContribution($order: OrderReferenceInput!) {
    cancelOrder(order: $order) {
      id
      status
    }
  }
`;

const activateRecurringContributionMutation = gqlV2/* GraphQL */ `
  mutation activateRecurringContribution($order: OrderReferenceInput!) {
    activateOrder(order: $order) {
      id
      status
    }
  }
`;

const RecurringContributionsPopUp = ({ contribution, status, createNotification, setShowPopup, account }) => {
  const [menuState, setMenuState] = useState('mainMenu');
  const [submitCancellation, { loadingCancellation }] = useMutation(cancelRecurringContributionMutation, {
    context: API_V2_CONTEXT,
  });
  const [submitActivation, { loadingActivation }] = useMutation(activateRecurringContributionMutation, {
    context: API_V2_CONTEXT,
  });

  // detect click outside menu to close it - https://medium.com/@pitipatdop/little-neat-trick-to-capture-click-outside-with-react-hook-ba77c37c7e82
  const popupNode = useRef(null);
  const handleClick = e => {
    // we include 'react-select' because the dropdown in UpdateOrderPopUp portals to the
    // document.body, so if we don't inlude this it closes the menu
    if (popupNode.current.contains(e.target) || e.target.id.includes('react-select')) {
      // inside click
      return;
    }
    // outside click
    setShowPopup(false);
  };
  useEffect(() => {
    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  const { formatMessage } = useIntl();
  const mainMenu = menuState === 'mainMenu' && status === 'ACTIVE';
  const cancelMenu = menuState === 'cancelMenu';
  const updateTierMenu = menuState === 'updateTierMenu';
  const paymentMethodMenu = menuState === 'paymentMethodMenu';
  const activateMenu = menuState === 'mainMenu' && status === 'CANCELLED';

  return (
    <PopUpMenu
      minHeight={160}
      maxHeight={360}
      width={'100%'}
      overflowY={'auto'}
      ref={popupNode}
      data-cy="recurring-contribution-menu"
    >
      {mainMenu && (
        <MenuSection>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
              {formatMessage(messages.options)}
            </P>
            <Flex flexGrow={1} alignItems="center">
              <StyledHr width="100%" ml={2} />
            </Flex>
          </Flex>
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
              <P fontSize="Paragraph" fontWeight="400">
                {formatMessage(messages.updatePaymentMethod)}
              </P>
            </Flex>
          </MenuItem>
          <MenuItem
            flexGrow={1 / 4}
            width={1}
            alignItems="center"
            justifyContent="space-between"
            onClick={() => {
              setMenuState('updateTierMenu');
            }}
          >
            <Flex width={1 / 6}>
              <Dollar size={20} />
            </Flex>
            <Flex flexGrow={1}>
              <P fontSize="Paragraph" fontWeight="400">
                {formatMessage(messages.updateTier)}
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
              <P fontSize="Paragraph" fontWeight="400" color="red.500">
                {formatMessage(messages.cancelContribution)}
              </P>
            </Flex>
          </MenuItem>
        </MenuSection>
      )}

      {cancelMenu && (
        <MenuSection data-cy="recurring-contribution-cancel-menu">
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
              {formatMessage(messages.cancelContribution)}
            </P>
            <Flex flexGrow={1} alignItems="center">
              <StyledHr width="100%" ml={2} />
            </Flex>
          </Flex>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <P fontSize="Paragraph" fontWeight="400">
              {formatMessage(messages.areYouSureCancel)}
            </P>
          </Flex>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <Flex flexGrow={1} alignItems="center">
              <StyledHr width="100%" />
            </Flex>
          </Flex>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <StyledButton
              buttonSize="tiny"
              loading={loadingCancellation}
              data-cy="recurring-contribution-cancel-yes"
              onClick={async () => {
                try {
                  await submitCancellation({
                    variables: { order: { id: contribution.id } },
                  });
                  createNotification('cancel');
                } catch (error) {
                  const errorMsg = getErrorFromGraphqlException(error).message;
                  createNotification('error', errorMsg);
                }
              }}
            >
              {formatMessage(messages.yes)}
            </StyledButton>
            <StyledButton
              ml={2}
              buttonSize="tiny"
              buttonStyle="secondary"
              onClick={() => {
                setMenuState('mainMenu');
              }}
              data-cy="recurring-contribution-cancel-no"
            >
              {formatMessage(messages.noWait)}
            </StyledButton>
          </Flex>
        </MenuSection>
      )}

      {activateMenu && (
        <MenuSection>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
              {formatMessage(messages.activateContribution)}
            </P>
            <Flex flexGrow={1} alignItems="center">
              <StyledHr width="100%" ml={2} />
            </Flex>
          </Flex>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <P fontSize="Paragraph" fontWeight="400">
              {formatMessage(messages.areYouSureActivate)}
            </P>
          </Flex>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <Flex flexGrow={1} alignItems="center">
              <StyledHr width="100%" />
            </Flex>
          </Flex>
          <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
            <StyledButton
              buttonSize="tiny"
              loading={loadingActivation}
              data-cy="recurring-contribution-activate-yes"
              onClick={async () => {
                try {
                  await submitActivation({
                    variables: { order: { id: contribution.id } },
                  });
                  createNotification('activate');
                } catch (error) {
                  const errorMsg = getErrorFromGraphqlException(error).message;
                  createNotification('error', errorMsg);
                }
              }}
            >
              {formatMessage(messages.yes)}
            </StyledButton>
            <StyledButton
              ml={2}
              buttonSize="tiny"
              buttonStyle="secondary"
              onClick={() => {
                setShowPopup(false);
              }}
            >
              {formatMessage(messages.noWait)}
            </StyledButton>
          </Flex>
        </MenuSection>
      )}

      {paymentMethodMenu && (
        <MenuSection data-cy="recurring-contribution-payment-menu">
          <UpdatePaymentMethodPopUp
            setMenuState={setMenuState}
            contribution={contribution}
            createNotification={createNotification}
            setShowPopup={setShowPopup}
            account={account}
          />
        </MenuSection>
      )}

      {updateTierMenu && (
        <MenuSection>
          <UpdateOrderPopUp
            setMenuState={setMenuState}
            contribution={contribution}
            createNotification={createNotification}
            setShowPopup={setShowPopup}
          />
        </MenuSection>
      )}
    </PopUpMenu>
  );
};

RecurringContributionsPopUp.propTypes = {
  contribution: PropTypes.object.isRequired,
  LoggedInUser: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
  createNotification: PropTypes.func,
  setShowPopup: PropTypes.func,
  account: PropTypes.object.isRequired,
};

export default withUser(withRouter(RecurringContributionsPopUp));
