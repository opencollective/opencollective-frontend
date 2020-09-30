import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { generateNotFoundError } from '../lib/errors';
import { addCollectiveCoverData } from '../lib/graphql/queries';

import Body from '../components/Body';
import CollectiveNavbar from '../components/CollectiveNavbar';
import ErrorPage from '../components/ErrorPage';
import ExpenseNeedsTaxFormMessage from '../components/expenses/ExpenseNeedsTaxFormMessage';
import ExpenseWithData from '../components/expenses/ExpenseWithData';
import Footer from '../components/Footer';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import StyledButton from '../components/StyledButton';
import { withUser } from '../components/UserProvider';

class ExpensePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, ExpenseId, createSuccess } }) {
    return { slug: collectiveSlug, ExpenseId: parseInt(ExpenseId), expenseCreated: createSuccess };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    ExpenseId: PropTypes.number,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    expenseCreated: PropTypes.string, // actually a stringed boolean 'true'
  };

  constructor(props) {
    super(props);
    this.state = {
      isPayActionLocked: false,
    };
  }

  getSuccessMessage() {
    const { data, expenseCreated } = this.props;
    if (!expenseCreated) {
      return null;
    }

    return (
      <MessageBox type="success" withIcon data-cy="expenseCreated">
        {data.Collective.host ? (
          <FormattedMessage
            id="expense.created"
            defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the admins of the Collective. You will be notified by email once it has been approved. Then, the host ({host}) will proceed to reimburse your expense."
            values={{ host: data.Collective.host.name }}
          />
        ) : (
          <FormattedMessage
            id="expense.created.noHost"
            defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the admins of the Collective. You will be notified by email once it has been approved."
          />
        )}
      </MessageBox>
    );
  }

  render() {
    const { slug, data, ExpenseId, LoggedInUser, loadingLoggedInUser } = this.props;

    if (!data || data.error || data.loading) {
      return <ErrorPage data={data} />;
    } else if (!data.Collective) {
      return <ErrorPage error={generateNotFoundError(slug)} log={false} />;
    }

    const collective = data.Collective;
    const successMessage = this.getSuccessMessage();
    const canEdit = LoggedInUser && LoggedInUser.canEditCollective(collective);
    return (
      <div className="ExpensePage">
        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveNavbar
            collective={collective}
            isAdmin={canEdit}
            showEdit
            callsToAction={{ hasSubmitExpense: !collective.isArchived }}
          />

          <Box maxWidth={1200} m="0 auto" px={[1, 3, 4]} py={[2, 3]}>
            <Flex flexWrap="wrap" mb={4} justifyContent={['center', 'left']}>
              <Link route="expenses" params={{ collectiveSlug: collective.slug }}>
                <StyledButton my={1} data-cy="viewAllExpenses">
                  ← <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />
                </StyledButton>
              </Link>
              {!collective.isArchived && (
                <Link route="create-expense" params={{ collectiveSlug: collective.slug }}>
                  <StyledButton my={1} mx={3} data-cy="submit-expense-btn">
                    <FormattedMessage id="expenses.sendAnotherExpense" defaultMessage="Submit Another Expense" />
                  </StyledButton>
                </Link>
              )}
            </Flex>

            <hr />
            <Box mt={4}>
              <ExpenseNeedsTaxFormMessage
                id={ExpenseId}
                fallback={successMessage}
                loadingPlaceholder={successMessage}
              />
            </Box>

            <Box my={4} py={1} px={[1, 3]} maxWidth={800}>
              <ExpenseWithData
                id={ExpenseId}
                collective={collective}
                host={collective.host}
                view="details"
                LoggedInUser={LoggedInUser}
                loadingLoggedInUser={loadingLoggedInUser}
                allowPayAction={!this.state.isPayActionLocked}
                lockPayAction={() => this.setState({ isPayActionLocked: true })}
                unlockPayAction={() => this.setState({ isPayActionLocked: false })}
              />
            </Box>
          </Box>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withUser(
  addCollectiveCoverData(ExpensePage, {
    options: props => ({
      variables: {
        slug: props.slug,
        throwIfMissing: false,
      },
    }),
  }),
);
