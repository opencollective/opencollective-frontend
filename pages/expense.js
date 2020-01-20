import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ExpenseWithData from '../components/expenses/ExpenseWithData';

import { ssrNotFoundError } from '../lib/nextjs_utils';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { Box, Flex } from '@rebass/grid';
import ExpenseNeedsTaxFormMessage from '../components/expenses/ExpenseNeedsTaxFormMessage';
import ErrorPage, { generateError } from '../components/ErrorPage';
import Link from '../components/Link';

import { addCollectiveCoverData } from '../lib/graphql/queries';

import { withUser } from '../components/UserProvider';
import MessageBox from '../components/MessageBox';
import StyledButton from '../components/StyledButton';

class ExpensePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, ExpenseId, createSuccess } }) {
    return { slug: collectiveSlug, ExpenseId: parseInt(ExpenseId), expenseCreated: createSuccess };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    ExpenseId: PropTypes.number,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
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
            defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the core contributors of the collective. You will be notified by email once it has been approved. Then, the host ({host}) will proceed to reimburse your expense."
            values={{ host: data.Collective.host.name }}
          />
        ) : (
          <FormattedMessage
            id="expense.created.noHost"
            defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the core contributors of the collective. You will be notified by email once it has been approved."
          />
        )}
      </MessageBox>
    );
  }

  render() {
    const { slug, data, ExpenseId, LoggedInUser } = this.props;

    if (!data || data.error || data.loading) {
      return <ErrorPage data={data} />;
    } else if (!data.Collective) {
      ssrNotFoundError(); // Force 404 when rendered server side
      return <ErrorPage error={generateError.notFound(slug)} log={false} />;
    }

    const collective = data.Collective;
    const successMessage = this.getSuccessMessage();
    return (
      <div className="ExpensePage">
        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveCover
            key={collective.slug}
            collective={collective}
            LoggedInUser={LoggedInUser}
            displayContributeLink={collective.isActive && collective.host ? true : false}
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
                <Link route="createExpense" params={{ collectiveSlug: collective.slug }}>
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
                view="details"
                LoggedInUser={LoggedInUser}
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
