import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
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

class ExpenseNeedsTaxForm extends React.Component {
  static propTypes = {
    id: PropTypes.number,
    data: PropTypes.object,
    message: PropTypes.string,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data } = this.props;

    if (data.error) {
      return <Error message="GraphQL error" />;
    }

    if (data.loading) {
      return (
        <div>
          <FormattedMessage id="loading" defaultMessage="checking if tax form required..." />
        </div>
      );
    }

    const {
      data: {
        Expense: { userTaxFormRequiredBeforePayment },
      },
      message,
    } = this.props;

    return (
      userTaxFormRequiredBeforePayment && (
        <span>
          <style jsx>
            {`
              .taxFormRequired {
                background: #e21a60;
                color: white;
                text-transform: uppercase;
              }
            `}
          </style>
          <span className="taxFormRequired">{message}</span>
          {' | '}
        </span>
      )
    );
  }
}

const addExpenseData = graphql(getIsTaxFormRequiredQuery);
export default addExpenseData(withIntl(ExpenseNeedsTaxForm));
