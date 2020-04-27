import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { getNextChargeDate } from '../../lib/date-utils';
import { formatCurrency } from '../../lib/utils';

import Container from '../Container';
import { P, Span } from '../Text';

/**
 * When using an order with fixed amount, this function returns the details to
 * show the user order amount as step details is skipped.
 */
const ContributionDetails = ({ totalAmount, interval, currency, tax }) => {
  return (
    <Container mt={4} mx={2} width={1 / 5} minWidth="300px" maxWidth="370px" data-cy="contribution-details">
      <Container fontSize="Paragraph" mb={3}>
        <P fontSize="LeadParagraph" fontWeight="bold" mb={2}>
          <FormattedMessage id="contribute.ContributionDetailsTitle" defaultMessage="Contribution details:" />
        </P>
        <FormattedMessage
          id="contribute.tierDetails"
          defaultMessage="You’ll contribute with the amount of {amount}{interval, select, month { monthly} year { yearly} other {}}."
          values={{
            amount: (
              <strong>
                {formatCurrency(totalAmount, currency)}
                {tax && tax.amount > 0 && (
                  /** Use non-breaking spaces to ensure amount and tax stay on the same line */
                  <span>&nbsp;+&nbsp;VAT&nbsp;({tax.percentage}%)</span>
                )}
                {interval ? ' ' : ''}
              </strong>
            ),
            interval: interval,
          }}
        />
        {interval && (
          <React.Fragment>
            <br />
            <br />
            <strong>
              <FormattedMessage id="contribution.subscription.first.label" defaultMessage="First charge:" />
            </strong>{' '}
            <Span color="primary.500">
              <FormattedMessage id="contribution.subscription.today" defaultMessage="Today" />
            </Span>
            <br />
            <strong>
              <FormattedMessage id="contribution.subscription.next.label" defaultMessage="Next charge:" />
            </strong>{' '}
            <Span color="primary.500">
              <FormattedDate
                value={getNextChargeDate(new Date(), interval)}
                day="numeric"
                month="short"
                year="numeric"
              />
            </Span>
          </React.Fragment>
        )}
      </Container>
    </Container>
  );
};

ContributionDetails.propTypes = {
  totalAmount: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  interval: PropTypes.string,
  tax: PropTypes.shape({
    amount: PropTypes.number,
    percentage: PropTypes.number,
  }),
};

export default ContributionDetails;
