import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Flex } from '@rebass/grid';

import { capitalize, compose, getErrorFromGraphqlException } from '../lib/utils';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { withUser } from '../components/UserProvider';
import Container from '../components/Container';
import Expense from '../components/expenses/Expense';
import StyledCard from '../components/StyledCard';
import LinkCollective from '../components/LinkCollective';
import Link from '../components/Link';

/** GraphQL */

const ExpenseFieldsFragment = gql`
  fragment ExpenseFields on ExpenseType {
    id
    status
    updatedAt
    amount
    currency
    incurredAt
    category
    payoutMethod
    description
    fromCollective {
      id
      slug
      name
    }
    collective {
      id
      slug
      name
      currency
      stats {
        balance
      }
    }
  }
`;

// Please use the same name for key + mutation name in this map
const Mutations = {
  approveCollective: gql`
    mutation approveCollective($id: Int!) {
      approveCollective(id: $id) {
        id
        slug
        name
        type
        host {
          id
          slug
          name
          type
        }
      }
    }
  `,
  approveExpense: gql`
    mutation approveExpense($id: Int!) {
      approveExpense(id: $id) {
        ...ExpenseFields
      }
    }
    ${ExpenseFieldsFragment}
  `,
  rejectExpense: gql`
    mutation rejectExpense($id: Int!) {
      rejectExpense(id: $id) {
        ...ExpenseFields
      }
    }
    ${ExpenseFieldsFragment}
  `,
};

const MessagesProcessing = defineMessages({
  approveCollective: {
    id: 'actions.approveCollective.processing',
    defaultMessage: 'Approving collective',
  },
  approveExpense: {
    id: 'actions.approveExpense.processing',
    defaultMessage: 'Approving expense',
  },
  rejectExpense: {
    id: 'actions.rejectExpense.processing',
    defaultMessage: 'Rejecting expense',
  },
  default: {
    id: 'actions.processing',
    defaultMessage: 'Processing',
  },
});

/**
 * This page is used to approve/reject in one click an expense or a collective
 */
class ActionPage extends React.Component {
  static getInitialProps({ query: { action, table, id, hostCollectiveSlug } }) {
    return { action, table, id: Number(id), ssr: false, hostCollectiveSlug };
  }

  static propTypes = {
    action: PropTypes.string,
    table: PropTypes.string,
    hostCollectiveSlug: PropTypes.string,
    id: PropTypes.number,
    ssr: PropTypes.bool,
    intl: PropTypes.object, // from injectIntl,
    LoggedInUser: PropTypes.object, // from withUser,
    loadingLoggedInUser: PropTypes.bool.isRequired, // from withUser
  };

  constructor(props) {
    super(props);
    this.state = { loading: true, actionTriggered: false, result: null };
    this.mutation = `${props.action}${capitalize(props.table).replace(/s$/, '')}`;
  }

  async componentDidMount() {
    this.triggerActionOnceLoggedInUser();
  }

  async componentDidUpdate() {
    this.triggerActionOnceLoggedInUser();
  }

  getMutationName() {
    const name = `${this.props.action}${capitalize(this.props.table).replace(/s$/, '')}`;
    // Ensure that the provided name is a known mutation, otherwise malicious users
    // could create corrupted links to create unintended behavious by accessing props
    // they're not supposed to.
    return Mutations[name] ? name : null;
  }

  async triggerActionOnceLoggedInUser() {
    const mutationName = this.getMutationName();
    if (mutationName && this.props.LoggedInUser && !this.state.actionTriggered) {
      this.setState({ actionTriggered: true });
      try {
        const res = await this.props[mutationName](this.props.id);
        this.setState({ loading: false, result: res.data[mutationName] });
      } catch (error) {
        this.setState({ loading: false, error: getErrorFromGraphqlException(error) });
      }
    }
  }

  renderContent(mutationName) {
    const { LoggedInUser, intl } = this.props;
    const { loading, result, error } = this.state;

    if (!LoggedInUser) {
      return <SignInOrJoinFree />;
    } else if (!mutationName) {
      return (
        <MessageBox type="error" withIcon>
          <FormattedMessage id="action.Invalid" defaultMessage="Invalid confirmation link" />
        </MessageBox>
      );
    } else if (loading) {
      return (
        <MessageBox type="info" withIcon isLoading>
          {intl.formatMessage(MessagesProcessing[mutationName] || MessagesProcessing.default)}
        </MessageBox>
      );
    } else if (error) {
      if (mutationName === 'approveCollective') {
        const { hostCollectiveSlug } = this.props;
        return (
          <MessageBox type="error" withIcon data-cy="error-message">
            <FormattedMessage
              id="action.approveCollective.Error"
              defaultMessage="Failed to approve collective for {host}"
              values={{ host: <Link route={`/${hostCollectiveSlug}`}>{hostCollectiveSlug}</Link> }}
            />
            <br />
            <br />
            <p>{error.message && `> ${error.message}`}</p>
          </MessageBox>
        );
      } else {
        return (
          <MessageBox type="error" withIcon data-cy="error-message">
            {error.message}
          </MessageBox>
        );
      }
    } else if (result) {
      switch (mutationName) {
        case 'approveExpense':
        case 'rejectExpense':
          return (
            <Flex flexDirection="column" alignItems="center" css={{ maxWidth: 450 }}>
              <MessageBox type="success" withIcon>
                {mutationName === 'approveExpense' ? (
                  <FormattedMessage id="action.expense.approved" defaultMessage="Expense approved" />
                ) : (
                  <FormattedMessage id="action.expense.rejected" defaultMessage="Expense rejected" />
                )}
              </MessageBox>
              <StyledCard mt={3} bg="#fafafa">
                <Expense expense={result} collective={result.collective} />
              </StyledCard>
            </Flex>
          );
        case 'approveCollective':
          return (
            <Flex flexDirection="column" alignItems="center" css={{ maxWidth: 450 }}>
              <MessageBox type="success" withIcon>
                <FormattedMessage
                  id="action.collective.Approved"
                  defaultMessage="Collective {collective} has been approved to be hosted by {host}"
                  values={{
                    collective: <LinkCollective collective={result} />,
                    host: <LinkCollective collective={result.host} />,
                  }}
                />
              </MessageBox>
            </Flex>
          );
        default:
          return (
            <MessageBox type="success" withIcon>
              <FormattedMessage id="actions.done" defaultMessage="Done" />
            </MessageBox>
          );
      }
    } else {
      return (
        <MessageBox type="success" withIcon>
          <FormattedMessage id="actions.done" defaultMessage="Done" />
        </MessageBox>
      );
    }
  }

  render() {
    const { LoggedInUser, loadingLoggedInUser, intl } = this.props;
    const { loading } = this.state;
    const mutationName = this.getMutationName();

    return (
      <div className="ActionPage">
        <Header
          title={intl.formatMessage(MessagesProcessing[mutationName] || MessagesProcessing.default)}
          className={loading || loadingLoggedInUser ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
        />
        <Body>
          <Container
            display="flex"
            justifyContent="center"
            alignItems="center"
            px={2}
            py={[5, 6]}
            background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
          >
            {loadingLoggedInUser ? <Loading /> : this.renderContent(mutationName)}
          </Container>
        </Body>
        <Footer />
      </div>
    );
  }
}

const addMutations = compose.apply(
  this,
  Object.keys(Mutations).map(action =>
    graphql(Mutations[action], {
      props: ({ mutate }) => ({
        [action]: async id => {
          return await mutate({ variables: { id } });
        },
      }),
    }),
  ),
);

export default withUser(addMutations(injectIntl(ActionPage)));
