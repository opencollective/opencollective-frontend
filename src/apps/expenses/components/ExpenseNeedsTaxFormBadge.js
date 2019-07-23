import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import withIntl from '../../../lib/withIntl';
import Error from '../../../components/Error';

const getIsTaxFormRequiredQuery = gql`
  query Expense($id: Int!) {
    Expense(id: $id) {
      id
      userTaxFormRequiredBeforePayment
    }
  }
`;

class ExpenseNeedsTaxFormBadge extends React.Component {
  static propTypes = {
    id: PropTypes.number,
    data: PropTypes.object,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      hover: {
        id: 'expenseNeedsTaxForm.hover',
        defaultMessage:
          "We can't pay until we receive your tax info. Check your inbox for an email from HelloWorks with a link to the form you need to submit. Need help? Contact support@opencollective.com",
      },
      taxFormRequired: { id: 'expenseNeedsTaxForm.taxFormRequired', defaultMessage: 'tax form required' },
    });
  }

  render() {
    const { data } = this.props;

    if (data.error) {
      return <Error message="GraphQL error" />;
    }

    if (data.loading) {
      return (
        <div>
          <FormattedMessage id="taxformbadge.loading" defaultMessage="checking if tax form required..." />
        </div>
      );
    }

    const {
      intl,
      data: {
        Expense: { userTaxFormRequiredBeforePayment },
      },
    } = this.props;

    const message = intl.formatMessage(this.messages.taxFormRequired);
    const hoverMessage = intl.formatMessage(this.messages.hover);

    return (
      userTaxFormRequiredBeforePayment && (
        <span>
          <style jsx>{`
            a {
              text-transform: uppercase;
            }
          `}</style>
          <span className="taxFormRequired " data-toggle="tooltip" data-placement="bottom" title={hoverMessage}>
            <a className="btn btn-warning btn-xs" href="https://docs.opencollective.com/help/expenses/tax-information">
              {message}
            </a>
          </span>
          {' | '}
        </span>
      )
    );
  }
}

const addExpenseData = graphql(getIsTaxFormRequiredQuery);
export default addExpenseData(withIntl(ExpenseNeedsTaxFormBadge));
