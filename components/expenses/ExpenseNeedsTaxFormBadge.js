import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import MessageBox from '../MessageBox';
import StyledLink from '../StyledLink';
import Error from '../Error';

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
          "We can't pay until we receive your tax info. Check your inbox for an email from HelloWorks. Need help? Contact support@opencollective.com",
      },
      taxFormRequired: { id: 'expenseNeedsTaxForm.taxFormRequired', defaultMessage: 'tax form required' },
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
        Expense: { userTaxFormRequiredBeforePayment },
      },
    } = this.props;

    const message = intl.formatMessage(this.messages.taxFormRequired);
    const hoverMessage = intl.formatMessage(this.messages.hover);

    return (
      userTaxFormRequiredBeforePayment && (
        <span>
          <span className="taxFormRequired " data-toggle="tooltip" data-placement="bottom" title={hoverMessage}>
            <MessageBox type="warning" display="inline" css={{ padding: '4px', borderRadius: '5px' }} withIcon={true}>
              <StyledLink
                css={{ textTransform: 'uppercase' }}
                href="https://docs.opencollective.com/help/expenses/tax-information"
              >
                {message}
              </StyledLink>
            </MessageBox>
          </span>
          {' | '}
        </span>
      )
    );
  }
}

const addExpenseData = graphql(getIsTaxFormRequiredQuery);
export default addExpenseData(injectIntl(ExpenseNeedsTaxFormBadge));
