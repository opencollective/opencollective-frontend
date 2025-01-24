import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import { fadeIn } from '../StyledKeyframes';

/** A single item */
const DebitCreditItem = styled.div`
  position: relative;
  animation: ${fadeIn} 0.15s;
`;

/** A colored gradient to show the type of the transaction */
const DebitCreditGradient = styled.div`
  position: absolute;
  right: -1px;
  height: 70%;
  width: 2px;
  margin: 14px 0;

  ${props =>
    props.isCredit
      ? css`
          background: linear-gradient(
            180deg,
            #00af2f 0%,
            rgba(106, 255, 146, 0.354167) 53.65%,
            rgba(255, 255, 255, 0) 100%
          );
        `
      : css`
          background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #ffd4df 55.73%, #ff0044 100%);
        `}
`;

/** Displays a debit entry in the list */
export const DebitItem = ({ children, ...props }) => {
  return (
    <DebitCreditItem {...props}>
      <DebitCreditGradient isCredit={false} />
      {children}
    </DebitCreditItem>
  );
};

DebitItem.propTypes = { children: PropTypes.node };

/** Displays a credit entry in the list */
export const CreditItem = ({ children, ...props }) => {
  return (
    <DebitCreditItem {...props}>
      <DebitCreditGradient isCredit />
      {children}
    </DebitCreditItem>
  );
};

CreditItem.propTypes = { children: PropTypes.node };
