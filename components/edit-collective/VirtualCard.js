/* eslint-disable camelcase */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { Copy } from '@styled-icons/feather/Copy';
import { FormattedMessage, useIntl } from 'react-intl';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';
import { margin } from 'styled-system';

import { formatCurrency } from '../../lib/currency-utils';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';

import Avatar from '../Avatar';
import ConfirmationModal from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import DismissIcon from '../icons/DismissIcon';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledSpinner from '../StyledSpinner';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

import DeleteVirtualCardModal from './DeleteVirtualCardModal';
import EditVirtualCardModal from './EditVirtualCardModal';

const CardContainer = styled(Flex)`
  border: 1px solid #dcdee0;
  border-radius: 12px;
  background: #050505;
  position: relative;

  color: #fff;
  overflow: hidden;

  transition: box-shadow 400ms ease-in-out, transform 500ms ease;
  box-shadow: 0px 0px 4px rgba(20, 20, 20, 0);

  :hover {
    box-shadow: 0px 8px 12px rgba(20, 20, 20, 0.16);
    transform: translate(0, -4px);
  }

  > div {
    z-index: 1;
  }
  > div:first-child {
    position: absolute;
    top: 0px;
    left: 0px;
    height: 100%;
    width: 100%;
    background: linear-gradient(to right, #f7f8fa23, #f7f8fa16);
    clip-path: ellipse(102% 102% at 0px 100%);
  }
`;

const Action = styled.button`
  ${margin}
  cursor: pointer;
  line-height: 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  background: transparent;
  outline: none;
  text-align: inherit;

  color: ${props => props.theme.colors[props.color]?.[500] || props.color || props.theme.colors.black[900]};

  :hover {
    color: ${props => props.theme.colors[props.color]?.[300] || props.color || props.theme.colors.black[700]};
  }

  &[disabled] {
    color: ${props => props.theme.colors[props.color]?.[200] || props.color || props.theme.colors.black[600]};
  }
`;

const Arrow = styled.div`
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
  visibility: hidden;
  bottom: 4px;

  ::before {
    position: absolute;
    width: 8px;
    height: 8px;
    background: inherit;
  }

  ::before {
    visibility: visible;
    content: '';
    transform: rotate(45deg);
  }
`;

const StateLabel = styled(Box)`
  align-self: center;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${props => (props.isActive ? props.theme.colors.green[500] : props.theme.colors.black[500])};
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 12px;
`;

const pauseCardMutation = gql`
  mutation PauseVirtualCard($virtualCard: VirtualCardReferenceInput!) {
    pauseVirtualCard(virtualCard: $virtualCard) {
      id
      data
    }
  }
`;

const resumeCardMutation = gql`
  mutation ResumeVirtualCard($virtualCard: VirtualCardReferenceInput!) {
    resumeVirtualCard(virtualCard: $virtualCard) {
      id
      data
    }
  }
`;

const ActionsButton = props => {
  const wrapperRef = React.useRef();
  const arrowRef = React.useRef();
  const [displayActions, setDisplayActions] = React.useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = React.useState(false);
  const [isEditingVirtualCard, setIsEditingVirtualCard] = React.useState(false);
  const [isDeletingVirtualCard, setIsDeletingVirtualCard] = React.useState(false);
  const { addToast } = useToasts();
  const { virtualCard, host, canEditVirtualCard, canDeleteVirtualCard, confirmOnPauseCard } = props;

  const handleActionSuccess = React.useCallback(
    message => {
      setIsEditingVirtualCard(false);
      setIsDeletingVirtualCard(false);
      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: message,
      });
    },
    [addToast],
  );

  useGlobalBlur(wrapperRef, outside => {
    if (outside) {
      setDisplayActions(false);
    }
  });

  const [pauseCard, { loading: pauseLoading }] = useMutation(pauseCardMutation, {
    context: API_V2_CONTEXT,
  });
  const [resumeCard, { loading: resumeLoading }] = useMutation(resumeCardMutation, {
    context: API_V2_CONTEXT,
  });

  const isActive = virtualCard.data.status === 'active' || virtualCard.data.state === 'OPEN';

  const handlePauseUnpause = async () => {
    try {
      if (isActive) {
        await pauseCard({ variables: { virtualCard: { id: virtualCard.id } } });
      } else {
        await resumeCard({ variables: { virtualCard: { id: virtualCard.id } } });
      }
      handleActionSuccess();
    } catch (e) {
      props.onError(e);
    }
  };

  const isLoading = pauseLoading || resumeLoading;

  return (
    <div ref={wrapperRef}>
      <Manager>
        <Reference>
          {({ ref }) => (
            <Action ref={ref} onClick={() => setDisplayActions(true)}>
              <FormattedMessage id="CollectivePage.NavBar.ActionMenu.Actions" defaultMessage="Actions" />
            </Action>
          )}
        </Reference>
        {displayActions && (
          <Popper
            placement="bottom"
            modifiers={[
              {
                name: 'arrow',
                options: {
                  element: arrowRef,
                },
              },
            ]}
          >
            {({ placement, ref, style, arrowProps }) => (
              <div
                data-placement={placement}
                ref={ref}
                style={{
                  ...style,
                }}
              >
                <StyledCard
                  m={1}
                  mb={2}
                  overflow="auto"
                  overflowY="auto"
                  padding="12px 15px"
                  width="180px"
                  borderWidth="0px"
                  boxShadow="0px 8px 12px rgba(20, 20, 20, 0.16)"
                >
                  <Flex flexDirection="column" fontSize="13px" lineHeight="16px" fontWeight="500">
                    {virtualCard.provider === 'STRIPE' && (
                      <Action
                        onClick={() =>
                          confirmOnPauseCard && isActive ? setShowConfirmationModal(true) : handlePauseUnpause()
                        }
                        disabled={isLoading}
                      >
                        {isActive ? (
                          <FormattedMessage id="VirtualCards.PauseCard" defaultMessage="Pause Card" />
                        ) : (
                          <FormattedMessage id="VirtualCards.ResumeCard" defaultMessage="Resume Card" />
                        )}{' '}
                        {isLoading && <StyledSpinner size="0.9em" mb="2px" />}
                      </Action>
                    )}
                    {canDeleteVirtualCard && (
                      <React.Fragment>
                        <StyledHr borderColor="black.300" mt={2} mb={2} />
                        <Action onClick={() => setIsDeletingVirtualCard(true)}>
                          <FormattedMessage defaultMessage="Delete Card" />
                        </Action>
                      </React.Fragment>
                    )}
                    {canEditVirtualCard && (
                      <React.Fragment>
                        <StyledHr borderColor="black.300" mt={2} mb={2} />
                        <Action onClick={() => setIsEditingVirtualCard(true)}>
                          <FormattedMessage defaultMessage="Edit Card Details" />
                        </Action>
                      </React.Fragment>
                    )}
                  </Flex>
                  <Arrow ref={arrowRef} {...arrowProps} />
                </StyledCard>
              </div>
            )}
          </Popper>
        )}
      </Manager>
      {showConfirmationModal && (
        <ConfirmationModal
          isDanger
          type="confirm"
          header={<FormattedMessage defaultMessage="Pause Virtual Card" />}
          continueLabel={<FormattedMessage defaultMessage="Pause Card" />}
          onClose={() => setShowConfirmationModal(false)}
          continueHandler={async () => {
            await handlePauseUnpause();
            setShowConfirmationModal(false);
          }}
        >
          <P>
            <FormattedMessage defaultMessage="This will pause the virtual card. To unpause, you will need to contact the host." />
          </P>
        </ConfirmationModal>
      )}
      {isEditingVirtualCard && (
        <EditVirtualCardModal
          host={host}
          onSuccess={handleActionSuccess}
          onClose={() => setIsEditingVirtualCard(false)}
          virtualCard={virtualCard}
        />
      )}
      {isDeletingVirtualCard && (
        <DeleteVirtualCardModal
          host={host}
          onSuccess={handleActionSuccess}
          onDeleteRefetchQuery={props.onDeleteRefetchQuery}
          onClose={() => setIsDeletingVirtualCard(false)}
          virtualCard={virtualCard}
        />
      )}
    </div>
  );
};

ActionsButton.propTypes = {
  virtualCard: PropTypes.shape({
    id: PropTypes.string,
    data: PropTypes.object,
    provider: PropTypes.string,
  }),
  host: PropTypes.object,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  confirmOnPauseCard: PropTypes.bool,
  canEditVirtualCard: PropTypes.bool,
  canDeleteVirtualCard: PropTypes.bool,
  onDeleteRefetchQuery: PropTypes.string,
};

const getLimitString = (spendingLimitAmount, spendingLimitInterval, currency, locale) => {
  const value = formatCurrency(spendingLimitAmount, currency, { locale });
  if (!spendingLimitAmount) {
    return <FormattedMessage id="VirtualCards.NoLimit" defaultMessage="No Limit" />;
  }
  switch (spendingLimitInterval) {
    case 'DAILY':
      return (
        <Fragment>
          <FormattedMessage id="VirtualCards.LimitedTo" defaultMessage="Limited to" />
          &nbsp;
          {value}/<FormattedMessage defaultMessage="day" />
        </Fragment>
      );
    case 'MONTHLY':
      return (
        <Fragment>
          <FormattedMessage id="VirtualCards.LimitedTo" defaultMessage="Limited to" />
          &nbsp;
          {value}/<FormattedMessage id="Frequency.Monthly.Short" defaultMessage="mo." />
        </Fragment>
      );
    case 'ANNUALLY':
      return (
        <Fragment>
          <FormattedMessage id="VirtualCards.LimitedTo" defaultMessage="Limited to" />
          &nbsp;
          {value}/<FormattedMessage id="Frequency.Yearly.Short" defaultMessage="yr." />
        </Fragment>
      );
    case 'TRANSACTION':
    case 'FOREVER':
    default:
      return value;
  }
};

const VirtualCard = props => {
  const [displayDetails, setDisplayDetails] = React.useState(false);
  const intl = useIntl();
  const { addToast } = useToasts();
  const { virtualCard } = props;

  const isActive = virtualCard.data.state === 'OPEN' || virtualCard.data.status === 'active';

  const name = virtualCard.name || '';
  const cardNumber = `****  ****  ****  ${virtualCard.last4}`;
  const handleCopy = value => () => {
    navigator.clipboard.writeText(value);
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />,
    });
  };

  return (
    <CardContainer width="366px" height="248px" flexDirection="column">
      <div />
      <Box flexGrow={1} m="24px 24px 0 24px">
        <Flex fontSize="16px" lineHeight="24px" fontWeight="500" justifyContent="space-between">
          <Box>{name}</Box>
          <StateLabel isActive={isActive}>
            {(virtualCard.data.state || virtualCard.data.status).toUpperCase()}
          </StateLabel>
        </Flex>
        {displayDetails ? (
          <React.Fragment>
            <P mt="27px" fontSize="18px" fontWeight="700" lineHeight="26px">
              {virtualCard.privateData.cardNumber.replace(/\d{4}(?=.)/g, '$& ')}{' '}
              <Action color="black" ml={2} onClick={handleCopy(virtualCard.privateData.cardNumber)}>
                <Copy size="18px" />
              </Action>
            </P>
            <P fontSize="12px" fontWeight="500" lineHeight="16px" textTransform="uppercase">
              <FormattedMessage id="VirtualCards.CardNumber" defaultMessage="Card Number" />{' '}
            </P>
            <Flex>
              <Box mt="19px" mr={4}>
                <P fontSize="18px" fontWeight="700" lineHeight="26px">
                  {
                    // expireDate should be removed once https://github.com/opencollective/opencollective-api/pull/7307 is deployed to production
                    virtualCard.privateData.expireDate || virtualCard.privateData.expiryDate
                  }

                  <Action
                    color="black"
                    ml={2}
                    onClick={
                      // expireDate should be removed once https://github.com/opencollective/opencollective-api/pull/7307 is deployed to production
                      handleCopy(virtualCard.privateData.expireDate || virtualCard.privateData.expiryDate)
                    }
                  >
                    <Copy size="18px" />
                  </Action>
                </P>
                <P fontSize="12px" fontWeight="500" lineHeight="16px">
                  <FormattedMessage id="VirtualCards.ExpireDate" defaultMessage="MM/YYYY" />{' '}
                </P>
              </Box>
              <Box mt="19px">
                <P fontSize="18px" fontWeight="700" lineHeight="26px">
                  {virtualCard.privateData.cvv}

                  <Action color="black" ml={2} onClick={handleCopy(virtualCard.privateData.cvv)}>
                    <Box position="relative" display="inline-block">
                      <Copy size="18px" />
                    </Box>
                  </Action>
                </P>
                <P fontSize="12px" fontWeight="500" lineHeight="16px">
                  <FormattedMessage id="VirtualCards.CVV" defaultMessage="CVV" />{' '}
                </P>
              </Box>
            </Flex>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <P mt="27px" fontSize="18px" fontWeight="700" lineHeight="26px">
              {cardNumber}
            </P>
            <Box mt="8px" fontSize="13px" fontWeight="500" lineHeight="20px">
              <Avatar
                collective={virtualCard.account}
                radius="20px"
                display="inline-block"
                mr={2}
                verticalAlign="middle"
              />{' '}
              {virtualCard.account.name}
            </Box>
            <P mt="15px" fontSize="12px" fontWeight="400" lineHeight="20px">
              <FormattedMessage
                id="VirtualCards.AssignedOn"
                defaultMessage="Assigned on {createdAt, date, short}"
                values={{
                  createdAt: new Date(virtualCard.createdAt),
                }}
              />
            </P>
            <P fontSize="12px" fontWeight="400" lineHeight="20px">
              {getLimitString(
                virtualCard.spendingLimitAmount,
                virtualCard.spendingLimitInterval,
                virtualCard.currency,
                intl.locale,
              )}{' '}
              (
              <FormattedMessage
                id="VirtualCards.Remaining"
                defaultMessage="{formattedAmount} remaining"
                values={{
                  formattedAmount: formatCurrency(virtualCard.remainingLimit, virtualCard.currency, {
                    locale: intl.locale,
                  }),
                }}
              />
              )
            </P>
          </React.Fragment>
        )}
      </Box>
      <Flex
        backgroundColor="#fff"
        color="black.900"
        minHeight="48px"
        px="24px"
        justifyContent={'space-between'}
        alignItems="center"
        shrink={0}
      >
        {(props.canEditVirtualCard || props.canPauseOrResumeVirtualCard || props.canDeleteVirtualCard) && (
          <ActionsButton
            virtualCard={virtualCard}
            host={props.host}
            onError={error => addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, error) })}
            onDeleteRefetchQuery={props.onDeleteRefetchQuery}
            confirmOnPauseCard={props.confirmOnPauseCard}
            canEditVirtualCard={props.canEditVirtualCard}
            canDeleteVirtualCard={props.canDeleteVirtualCard}
          />
        )}
        <Action onClick={() => setDisplayDetails(!displayDetails)}>
          {displayDetails ? (
            <React.Fragment>
              <FormattedMessage id="closeDetails" defaultMessage="Close Details" />
              <DismissIcon height="12px" width="12px" ml={2} mb="2px" />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <FormattedMessage id="VirtualCards.DisplayDetails" defaultMessage="View Card Details" />
              &nbsp;&rarr;
            </React.Fragment>
          )}
        </Action>
      </Flex>
    </CardContainer>
  );
};

VirtualCard.propTypes = {
  canEditVirtualCard: PropTypes.bool,
  canPauseOrResumeVirtualCard: PropTypes.bool,
  canDeleteVirtualCard: PropTypes.bool,
  host: PropTypes.object,
  virtualCard: PropTypes.shape({
    id: PropTypes.string,
    last4: PropTypes.string,
    name: PropTypes.string,
    data: PropTypes.object,
    privateData: PropTypes.object,
    provider: PropTypes.string,
    spendingLimitAmount: PropTypes.number,
    spendingLimitInterval: PropTypes.string,
    remainingLimit: PropTypes.number,
    currency: PropTypes.string,
    createdAt: PropTypes.string,
    account: PropTypes.shape({
      id: PropTypes.string,
      imageUrl: PropTypes.string,
      name: PropTypes.string,
    }),
  }),
  confirmOnPauseCard: PropTypes.bool,
  onDeleteRefetchQuery: PropTypes.string,
};

export default VirtualCard;
