import PropTypes from 'prop-types';
import React from 'react';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Span } from '../Text';

/**
 * Displays the total amount for all the attachments.
 */
const AttachmentsTotalAmount = ({ attachments, currency }) => {
  const totalAmount = attachments.reduce((amount, attachment) => amount + (attachment.amount || 0), 0);
  return (
    <Span color="black.500" fontSize="LeadParagraph" letterSpacing={0} data-cy="attachments-total-amount">
      <FormattedMoneyAmount amount={totalAmount} precision={2} currency={currency} />
    </Span>
  );
};

AttachmentsTotalAmount.propTypes = {
  /** The currency of the collective */
  currency: PropTypes.string.isRequired,
  /** Attachments */
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.string,
    }),
  ).isRequired,
};

export default AttachmentsTotalAmount;
