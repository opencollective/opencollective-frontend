import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useApolloClient, useLazyQuery } from '@apollo/client';
import MUIDrawer from '@mui/material/Drawer';
import { XMark } from '@styled-icons/heroicons-outline/XMark';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { useTwoFactorAuthenticationPrompt } from '../../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import { getVariableFromProps } from '../../pages/expense';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledRoundButton from '../StyledRoundButton';

import { expensePageQuery } from './graphql/queries';
import Expense from './Expense';

const DrawerContainer = styled.div`
  display: flex;
  height: 100%;
  max-width: 768px;
  width: 100vw;
  flex-direction: column;
`;

const DrawerActionsContainer = styled(Flex)`
  border-top: 1px solid ${themeGet('colors.black.200')};
`;

export const SummaryHeader = styled.span`
  > a {
    color: inherit;
    text-decoration: underline;
    outline: none;
    :hover {
      color: ${themeGet('colors.black.600')};
    }
  }
`;

const CloseDrawerButton = styled(StyledRoundButton)`
  position: absolute;
  top: 16px;
  right: 16px;
`;

export default function ExpenseDrawer({ open, handleClose, expense }) {
  const drawerActionsRef = React.useRef(null);
  const [drawerActionsContainer, setDrawerActionsContainer] = useState(null);
  const client = useApolloClient();
  const [getExpense, { data, loading, error, startPolling, stopPolling, refetch, fetchMore }] = useLazyQuery(
    expensePageQuery,
    {
      variables: getVariableFromProps({ legacyExpenseId: expense?.legacyId }),
      context: API_V2_CONTEXT,
    },
  );

  const twoFactorPrompt = useTwoFactorAuthenticationPrompt();
  const disableEnforceFocus = Boolean(twoFactorPrompt?.isOpen);

  useEffect(() => {
    if (open) {
      getExpense();

      // Use timeout to set the ref just after the drawer is open to prevent setting it to undefined
      setTimeout(() => {
        setDrawerActionsContainer(drawerActionsRef?.current);
      }, 0);
    }
  }, [open]);

  return (
    <MUIDrawer anchor="right" open={open} onClose={handleClose} disableEnforceFocus={disableEnforceFocus}>
      <DrawerContainer>
        <Flex flex={1} flexDirection="column" overflowY="scroll">
          <Container position="relative" py={'24px'}>
            <CloseDrawerButton type="button" isBorderless onClick={handleClose}>
              <XMark size="24" aria-hidden="true" />
            </CloseDrawerButton>

            <Box px={[3, '24px']}>
              <Expense
                data={{ ...data, expense: { ...expense, ...data?.expense } }}
                // Making sure to initially set loading to true before the query is called
                loading={loading || (!data && !error)}
                error={error}
                refetch={refetch}
                client={client}
                fetchMore={fetchMore}
                legacyExpenseId={expense?.legacyId}
                startPolling={startPolling}
                stopPolling={stopPolling}
                drawerActionsContainer={drawerActionsContainer}
              />
            </Box>
          </Container>
        </Flex>
        <DrawerActionsContainer
          flexWrap="wrap"
          gridGap={2}
          flexShrink="0"
          justifyContent="space-between"
          p={3}
          ref={drawerActionsRef}
        />
      </DrawerContainer>
    </MUIDrawer>
  );
}

ExpenseDrawer.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  expense: PropTypes.shape({
    legacyId: PropTypes.number,
  }),
};
