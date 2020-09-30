import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage } from 'react-intl';

import Error from '../Error';
import { getI18nLink, I18nSupportLink } from '../I18nFormatters';
import MessageBox from '../MessageBox';

const expenseNeedsTaxFormQuery = gql`
  query ExpenseNeedsTaxForm($id: Int!) {
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
          id="expenseNeedsTaxFormMessage.msg"
          defaultMessage="We need your tax information before we can pay you. You will receive an email from HelloWorks saying Open Collective is requesting you fill out a form. This is required by the IRS (US tax agency) for everyone who invoices $600 or more per year. We also require one for grant recipients for our records. If you have not received the email within 24 hours, or you have any questions, please contact <I18nSupportLink></I18nSupportLink>. For more info, see our <Link>help docs about taxes</Link>."
          values={{
            I18nSupportLink,
            Link: getI18nLink({
              href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/tax-information',
              openInNewTab: true,
            }),
          }}
        />
      </MessageBox>
    ) : (
      this.props.fallback || null
    );
  }
}

const addExpenseNeedsTaxFormData = graphql(expenseNeedsTaxFormQuery);

export default addExpenseNeedsTaxFormData(ExpenseNeedsTaxFormMessage);
