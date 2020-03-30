import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import MessageBox from '../MessageBox';
import StyledLink from '../StyledLink';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import Error from '../Error';

const getIsTaxFormRequiredQuery = gql`
  query Expense($id: Int!) {
    Expense(id: $id) {
      id
      userTaxFormRequiredBeforePayment
    }
  }
`;

class ExpenseNeedsTaxFormMessage extends React.Component {
  static propTypes = {
    id: PropTypes.number,
    data: PropTypes.object,
    /** Will be displayed if user doesn't need to submit tax form */
    fallback: PropTypes.node,
    /** Will be displayed while loading */
    loadingPlaceholder: PropTypes.node,
  };

  render() {
    const { data } = this.props;

    if (!data || data.error) {
      return <Error message="GraphQL error" />;
    } else if (data.loading) {
      return this.props.loadingPlaceholder || null;
    } else if (!data.Expense) {
      // Don't show if expense doesn't exist
      return null;
    }

    return data.Expense.userTaxFormRequiredBeforePayment ? (
      <MessageBox type="warning" withIcon={true}>
        <FormattedMessage
          id="expenseNeedsTaxFormMessage.message"
          defaultMessage="We need your tax information before we can pay you. You will receive an email from HelloWorks saying Open Collective is requesting you fill out a form. This is required by the IRS (US tax agency) for everyone who invoices $600 or more per year. If you have not received the email within 24 hours, or you have any questions, please contact support@opencollective.com. For more info, see our"
        />{' '}
        <StyledLink href="https://docs.opencollective.com/help/expenses/tax-information">
          <FormattedMessage
            id="expenseNeedsTaxFormMessage.helpDocsAboutTaxes"
            defaultMessage="help docs about taxes."
          />
        </StyledLink>
      </MessageBox>
    ) : (
      this.props.fallback || null
    );
  }
}

const addExpenseData = graphql(getIsTaxFormRequiredQuery);
export default addExpenseData(ExpenseNeedsTaxFormMessage);
