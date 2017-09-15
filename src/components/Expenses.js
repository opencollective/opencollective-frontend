import React from 'react';
import PropTypes from 'prop-types';
import Expense from './Expense';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

class Expenses extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    expenses: PropTypes.array,
    refetch: PropTypes.func,
    fetchMore: PropTypes.func,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.refetch = this.refetch.bind(this);
    this.fetchMore = this.fetchMore.bind(this);
    this.state = { loading: false };
  }

  fetchMore(e) {
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
    });
  }

  refetch(status) {
    this.setState({status});
    this.props.refetch({status});
  }

  render() {
    const { collective, expenses, LoggedInUser } = this.props;

    return (
      <div className="Expenses">
        <style jsx>{`
          :global(.loadMoreBtn) {
            margin: 1rem;
            text-align: center;
          }
          .filter {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }
          :global(.filterBtnGroup) {
            width: 100%;
          }
          :global(.filterBtn) {
            width: 33%;
          }
        `}</style>

        <div className="filter">
          <ButtonGroup className="filterBtnGroup">
            <Button className="filterBtn" bsStyle={!this.state.status ? 'primary' : 'default'} onClick={() => this.refetch()}>
              <FormattedMessage id='expenses.all' defaultMessage='all' />
            </Button>
            <Button className="filterBtn" bsStyle={this.state.status === 'PENDING' ? 'primary' : 'default'} onClick={() => this.refetch('PENDING')}>
              <FormattedMessage id='expenses.pending' defaultMessage='pending' />
            </Button>
            <Button className="filterBtn" bsStyle={this.state.status === 'PAID' ? 'primary' : 'default'} onClick={() => this.refetch('PAID')}>
              <FormattedMessage id='expenses.paid' defaultMessage='paid' />
            </Button>
          </ButtonGroup>
        </div>

        {expenses.map((expense) =>
          <Expense
            key={expense.id}
            collective={collective}
            expense={expense}
            LoggedInUser={LoggedInUser}
            />
        )}
        { expenses.length % 10 === 0 &&
          <div className="loadMoreBtn">
            <Button bsStyle='default' onClick={this.fetchMore}>
              {this.state.loading && <FormattedMessage id='loading' defaultMessage='loading' />}
              {!this.state.loading && <FormattedMessage id='loadMore' defaultMessage='load more' />}
            </Button>
          </div>
        }
      </div>
    );
  }
}

export default Expenses;