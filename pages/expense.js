import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ExpenseWithData from '../components/expenses/ExpenseWithData';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import Button from '../components/Button';
import CollectiveCover from '../components/CollectiveCover';
import { Box, Flex } from '@rebass/grid';
import ExpenseNeedsTaxFormMessage from '../components/expenses/ExpenseNeedsTaxFormMessage';
import ErrorPage from '../components/ErrorPage';
import Link from '../components/Link';

import { addCollectiveCoverData } from '../lib/graphql/queries';

import { withUser } from '../components/UserProvider';

class ExpensePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, ExpenseId, createSuccess } }) {
    return { slug: collectiveSlug, ExpenseId: parseInt(ExpenseId), createSuccess: createSuccess };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    ExpenseId: PropTypes.number,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
    createSuccess: PropTypes.string, // actually a stringed boolean 'true'
  };

  constructor(props) {
    super(props);
    this.state = {
      isPayActionLocked: false,
    };
  }

  render() {
    const { data, ExpenseId, LoggedInUser, createSuccess } = this.props;
    const expenseCreated = {
      id: ExpenseId,
    };

    if (!data.Collective || data.Collective.host) return <ErrorPage data={data} />;

    const collective = data.Collective;

    return (
      <div className="ExpensePage">
        <style jsx>
          {`
            .columns {
              display: flex;
            }

            .col.large {
              width: 100%;
              min-width: 30rem;
              max-width: 800px;
            }

            @media (max-width: 600px) {
              .columns {
                flex-direction: column-reverse;
              }
              .columns .col {
                max-width: 100%;
              }
            }

            .viewAllExpenses {
              font-size: 1.2rem;
            }
          `}
        </style>

        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveCover
            key={collective.slug}
            collective={collective}
            LoggedInUser={LoggedInUser}
            displayContributeLink={collective.isActive && collective.host ? true : false}
          />

          <div className="content">
            <div className=" columns">
              <div className="col large">
                <div className="viewAllExpenses">
                  <Link route={`/${collective.slug}/expenses`}>
                    <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />
                  </Link>
                </div>

                <Box width={[1, null, 3 / 4]}>
                  {createSuccess && (
                    <Box m={3}>
                      <p className="createSuccess">
                        {collective.host && (
                          <FormattedMessage
                            id="expense.created"
                            defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the core contributors of the collective. You will be notified by email once it has been approved. Then, the host ({host}) will proceed to reimburse your expense."
                            values={{ host: collective.host.name }}
                          />
                        )}
                        {!collective.host && (
                          <FormattedMessage
                            id="expense.created.noHost"
                            defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the core contributors of the collective. You will be notified by email once it has been approved."
                          />
                        )}
                      </p>
                      <ExpenseNeedsTaxFormMessage id={expenseCreated.id} />
                      <Flex justifyContent="center" mt={4} flexWrap="wrap">
                        <Button className="blue" href={`/${collective.slug}/expenses/new`}>
                          <FormattedMessage id="expenses.sendAnotherExpense" defaultMessage="Submit Another Expense" />
                        </Button>
                        <Box ml={[0, null, 3]}>
                          <Button className="whiteblue viewAllExpenses" href={`/${collective.slug}/expenses`}>
                            <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />
                          </Button>
                        </Box>
                      </Flex>
                    </Box>
                  )}
                </Box>

                <ExpenseWithData
                  id={ExpenseId}
                  collective={collective}
                  view="details"
                  LoggedInUser={LoggedInUser}
                  allowPayAction={!this.state.isPayActionLocked}
                  lockPayAction={() => this.setState({ isPayActionLocked: true })}
                  unlockPayAction={() => this.setState({ isPayActionLocked: false })}
                />
              </div>
            </div>
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withUser(addCollectiveCoverData(ExpensePage));
