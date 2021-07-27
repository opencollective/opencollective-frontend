/* eslint-disable camelcase */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Copy } from '@styled-icons/feather/Copy';
import { FormattedMessage } from 'react-intl';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';
import { margin } from 'styled-system';

import { formatCurrency } from '../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';

import Avatar from '../Avatar';
import ConfirmationModal from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import DismissIcon from '../icons/DismissIcon';
import StyledCard from '../StyledCard';
import StyledSpinner from '../StyledSpinner';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

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

const pauseCardMutation = gqlV2/* GraphQL */ `
  mutation PauseVirtualCard($virtualCard: VirtualCardReferenceInput!) {
    pauseVirtualCard(virtualCard: $virtualCard) {
      id
      data
    }
  }
`;

const resumeCardMutation = gqlV2/* GraphQL */ `
  mutation ResumeVirtualCard($virtualCard: VirtualCardReferenceInput!) {
    resumeVirtualCard(virtualCard: $virtualCard) {
      id
      data
    }
  }
`;

const deleteCardMutation = gqlV2/* GraphQL */ `
  mutation DeleteVirtualCard($virtualCard: VirtualCardReferenceInput!) {
    deleteVirtualCard(virtualCard: $virtualCard)
  }
`;

const ActionsButton = props => {
  const wrapperRef = React.useRef();
  const arrowRef = React.useRef();
  const [displayActions, setDisplayActions] = React.useState(false);
  const [displayDeleteModal, setDeleteModal] = React.useState(false);

  const [pauseCard, { loading: pauseLoading }] = useMutation(pauseCardMutation, {
    context: API_V2_CONTEXT,
  });
  const [resumeCard, { loading: resumeLoading }] = useMutation(resumeCardMutation, {
    context: API_V2_CONTEXT,
  });

  const [deleteCard] = useMutation(deleteCardMutation, {
    context: API_V2_CONTEXT,
  });

  useGlobalBlur(wrapperRef, outside => {
    if (outside) {
      setDisplayActions(false);
    }
  });

  const isPaused = props.state !== 'OPEN';
  const isLoading = pauseLoading || resumeLoading;

  const handlePauseUnpause = async () => {
    if (isPaused) {
      await resumeCard({ variables: { virtualCard: { id: props.id } } });
    } else {
      await pauseCard({ variables: { virtualCard: { id: props.id } } });
    }
    if (props.onSuccess) {
      await props.onSuccess();
    }
  };
  const handleDelete = () => setDeleteModal(true);

  return (
    <div ref={wrapperRef}>
      <Manager>
        <Reference>
          {({ ref }) => (
            <Action ref={ref} onClick={() => setDisplayActions(true)}>
              <FormattedMessage id="VirtualCards.Actions" defaultMessage="Actions" />
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
                    <Action onClick={props.editHandler}>
                      <FormattedMessage id="VirtualCards.EditCardDetails" defaultMessage="Edit Card Details" />
                    </Action>
                    <Action mt="20px" onClick={handlePauseUnpause} disabled={isLoading}>
                      {isPaused ? (
                        <FormattedMessage id="VirtualCards.ResumeCard" defaultMessage="Resume Card" />
                      ) : (
                        <FormattedMessage id="VirtualCards.PauseCard" defaultMessage="Pause Card" />
                      )}{' '}
                      {isLoading && <StyledSpinner size="0.9em" mb="2px" />}
                    </Action>
                    <Action color="red" mt="20px" onClick={handleDelete}>
                      <FormattedMessage id="VirtualCards.DeleteCard" defaultMessage="Delete Card" />
                    </Action>
                  </Flex>
                  <Arrow ref={arrowRef} {...arrowProps} />
                </StyledCard>
              </div>
            )}
          </Popper>
        )}
      </Manager>
      <ConfirmationModal
        show={displayDeleteModal}
        width="100%"
        maxWidth="570px"
        onClose={() => {
          setDeleteModal(false);
        }}
        header={<FormattedMessage id="VirtualCards.DeleteCard" defaultMessage="Delete Card" />}
        continueHandler={async () => {
          await deleteCard({ variables: { virtualCard: { id: props.id } } });
          if (props.onSuccess) {
            await props.onSuccess();
          }
        }}
        continueLabel="Delete"
        isDanger
      >
        <P fontSize="14px" lineHeight="18px" mt={2}>
          <FormattedMessage
            id="VirtualCards.DeleteCard.Description"
            defaultMessage="Deleting a card is permanent both in the platform and in your provider, you won't be able to restore it later."
          />
        </P>
      </ConfirmationModal>
    </div>
  );
};

ActionsButton.propTypes = {
  id: PropTypes.string,
  state: PropTypes.string,
  onSuccess: PropTypes.func,
  editHandler: PropTypes.func,
};

const getLimitString = ({ spend_limit, spend_limit_duration }) => {
  const value = formatCurrency(spend_limit, 'USD');
  if (spend_limit === 0) {
    return <FormattedMessage id="VirtualCards.NoLimit" defaultMessage="No Limit" />;
  }
  switch (spend_limit_duration) {
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

  const { addToast } = useToasts();

  const name = props.name || '';
  const cardNumber = `****  ****  ****  ${props.last4}`;
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
          <StateLabel isActive={props.data.state === 'OPEN'}>{props.data.state}</StateLabel>
        </Flex>
        {displayDetails ? (
          <React.Fragment>
            <P mt="27px" fontSize="18px" fontWeight="700" lineHeight="26px">
              {props.privateData.cardNumber}{' '}
              <Action color="black" ml={2} onClick={handleCopy(props.privateData.cardNumber.replace(/\s/g, ''))}>
                <Copy size="18px" />
              </Action>
            </P>
            <P fontSize="12px" fontWeight="500" lineHeight="16px" textTransform="uppercase">
              <FormattedMessage id="VirtualCards.CardNumber" defaultMessage="Card Number" />{' '}
            </P>
            <Flex>
              <Box mt="19px" mr={4}>
                <P fontSize="18px" fontWeight="700" lineHeight="26px">
                  {props.privateData.expireDate}

                  <Action color="black" ml={2} onClick={handleCopy(props.privateData.expireDate)}>
                    <Copy size="18px" />
                  </Action>
                </P>
                <P fontSize="12px" fontWeight="500" lineHeight="16px">
                  <FormattedMessage id="VirtualCards.ExpireDate" defaultMessage="MM/YYYY" />{' '}
                </P>
              </Box>
              <Box mt="19px">
                <P fontSize="18px" fontWeight="700" lineHeight="26px">
                  {props.privateData.cvv}

                  <Action color="black" ml={2} onClick={handleCopy(props.privateData.cvv)}>
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
              <Avatar collective={props.account} radius="20px" display="inline-block" mr={2} verticalAlign="middle" />{' '}
              {props.account.name}
            </Box>
            <P mt="27px" fontSize="13px" fontWeight="400" lineHeight="20px">
              <FormattedMessage
                id="VirtualCards.AssignedOn"
                defaultMessage="Assigned on {createdAt, date, short}"
                values={{
                  createdAt: new Date(props.createdAt),
                }}
              />
              &nbsp;&middot;&nbsp;
              {getLimitString(props.data)}
            </P>
          </React.Fragment>
        )}
      </Box>
      <Flex
        backgroundColor="#fff"
        color="black.900"
        minHeight="48px"
        px="24px"
        justifyContent={props.hasActions ? 'space-between' : 'flex-end'}
        alignItems="center"
        shrink={0}
      >
        {props.hasActions && (
          <ActionsButton
            id={props.id}
            state={props.data.state}
            onSuccess={props.onSuccess}
            editHandler={props.editHandler}
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
  hasActions: PropTypes.bool,
  onSuccess: PropTypes.func,
  editHandler: PropTypes.func,

  account: PropTypes.shape({
    id: PropTypes.string,
    imageUrl: PropTypes.string,
    name: PropTypes.string,
  }),
  id: PropTypes.string,
  last4: PropTypes.string,
  name: PropTypes.string,
  data: PropTypes.object,
  privateData: PropTypes.object,
  createdAt: PropTypes.string,
};

export default VirtualCard;
