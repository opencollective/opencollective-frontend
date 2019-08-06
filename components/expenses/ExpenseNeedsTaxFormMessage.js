import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import MessageBox from '../MessageBox';
import StyledLink from '../StyledLink';
import { graphql } from 'react-apollo';
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
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      message: {
        id: 'expenseNeedsTaxFormMessage.message',
        defaultMessage:
          'We need your tax information before we can pay you. You will receive an email from HelloWorks saying Open Collective is requesting you fill out a form. This is required by the IRS (US tax agency) for everyone who invoices $600 or more per year. If you have not received the email within 24 hours, or you have any questions, please contact support@opencollective.com. For more info, see our',
      },
      helpDocsAboutTaxes: {
        id: 'expenseNeedsTaxFormMessage.helpDocsAboutTaxes',
        defaultMessage: 'help docs about taxes.',
      },
    });
  }

  render() {
    const { data } = this.props;

    if (data.error) {
      return <Error message="GraphQL error" />;
    }

    if (data.loading) return null;

    const {
      intl,
      data: {
        loading,
        Expense: { userTaxFormRequiredBeforePayment },
      },
    } = this.props;

    const message = intl.formatMessage(this.messages.message);
    const helpDocsAboutTaxes = intl.formatMessage(this.messages.helpDocsAboutTaxes);

    return (
      !loading &&
      userTaxFormRequiredBeforePayment && (
        <MessageBox isLoading={loading} type="warning" withIcon={true}>
          {message}{' '}
          <StyledLink href="https://docs.opencollective.com/help/expenses/tax-information">
            {helpDocsAboutTaxes}
          </StyledLink>
        </MessageBox>
      )
    );
  }
}

const addExpenseData = graphql(getIsTaxFormRequiredQuery);
export default addExpenseData(injectIntl(ExpenseNeedsTaxFormMessage));
