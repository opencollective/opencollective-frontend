import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { capitalize } from '../lib/utils';

import Body from '../components/Body';
import Container from '../components/Container';
import Footer from '../components/Footer';
import { Flex } from '../components/Grid';
import Header from '../components/Header';
import { getI18nLink } from '../components/I18nFormatters';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';

/**
 * This page is used to approve/reject in one click an expense or a collective
 */
class ActionPage extends React.Component {
  static getInitialProps({ query: { action, table, hostCollectiveSlug, collectiveSlug } }) {
    return { action, table, hostCollectiveSlug, collectiveSlug };
  }

  static propTypes = {
    action: PropTypes.string,
    table: PropTypes.string,
    hostCollectiveSlug: PropTypes.string,
    collectiveSlug: PropTypes.string,
  };

  renderContent(mutationName) {
    const { collectiveSlug, hostCollectiveSlug } = this.props;
    const deprecateMsg = (
      <FormattedMessage id="DeprecatedConfirmationLink" defaultMessage="The link you clicked on has been deprecated." />
    );

    switch (mutationName) {
      case 'approveExpense':
      case 'rejectExpense':
        return (
          <MessageBox type="warning" withIcon>
            {deprecateMsg}
            <br />
            <br />
            <FormattedMessage
              id="Expense.GoToExpenses"
              defaultMessage="Please go to the <Link>expenses page</Link> to approve or reject expenses."
              values={{ Link: getI18nLink({ as: Link, route: 'expenses', params: { collectiveSlug } }) }}
            />
          </MessageBox>
        );
      case 'approveCollective':
        return (
          <MessageBox type="warning" withIcon>
            {deprecateMsg}
            <br />
            <br />
            <FormattedMessage
              id="Application.GoToDahboard"
              defaultMessage="Please go to your <Link>host dashboard</Link> to approve or reject collectives."
              values={{
                Link: getI18nLink({
                  as: Link,
                  route: 'host.dashboard',
                  params: { hostCollectiveSlug, view: 'pending-applications' },
                }),
              }}
            />
          </MessageBox>
        );
      default:
        return (
          <MessageBox type="warning" withIcon>
            {deprecateMsg}
          </MessageBox>
        );
    }
  }

  getMutationName() {
    return `${this.props.action}${capitalize(this.props.table).replace(/s$/, '')}`;
  }

  render() {
    const mutationName = this.getMutationName();

    return (
      <div className="ActionPage">
        <Header title="Deprecated link" />
        <Body>
          <Container
            display="flex"
            justifyContent="center"
            alignItems="center"
            px={2}
            py={[5, 6]}
            background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
          >
            <Flex flexDirection="column" alignItems="center" css={{ maxWidth: 450 }}>
              {this.renderContent(mutationName)}
            </Flex>
          </Container>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default ActionPage;
