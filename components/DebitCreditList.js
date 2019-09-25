import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { fadeIn } from './StyledKeyframes';

/** A single item */
const DebitCreditItem = styled.div`
  position: relative;
  animation: ${fadeIn} 0.15s;
`;

/**
 * A list to display CREDIT/DEBIT items, like transactions or expenses. This is
 * built in a generic way so we can use it for either displaying only orders,
 * or only expenses, or both.
 *
 * Please make your children big enough, otherwise the gradient won't show.
 */
const DebitCreditList = styled.div`
  border: 1px solid #e6e8eb;
  border-radius: 8px 8px 0 0;

  & > ${DebitCreditItem}:not(:last-child) {
    border-bottom: 1px solid #e6e8eb;
  }
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
export const DebitItem = ({ children }) => {
  return (
    <DebitCreditItem>
      <DebitCreditGradient isCredit={false} />
      {children}
    </DebitCreditItem>
  );
};

DebitItem.propTypes = { children: PropTypes.node };

/** Displays a credit entry in the list */
export const CreditItem = ({ children }) => {
  return (
    <DebitCreditItem>
      <DebitCreditGradient isCredit />
      {children}
    </DebitCreditItem>
  );
};

CreditItem.propTypes = { children: PropTypes.node };

/** @component */
export default DebitCreditList;
