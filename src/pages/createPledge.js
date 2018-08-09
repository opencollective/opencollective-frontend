import React, { Fragment } from 'react';

import withData from '../lib/withData';
import { addGetLoggedInUserFunction } from '../graphql/queries';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import OrderForm from '../components/OrderForm';
import { H1 } from '../components/Text';

class CreatePledgePage extends React.Component {
  static getInitialProps({ query = {} }) {
    return {
      name: query.name || '',
    };
  }

  state = {
    loadingUserLogin: true,
    LoggedInUser: {
      collective: {
        host: {
          id: '',
        },
      },
      memberOf: [],
    },
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    try {
      const LoggedInUser = getLoggedInUser && await getLoggedInUser();
      this.setState({
        loadingUserLogin: false,
        LoggedInUser,
      });
    } catch (error) {
      this.setState({ loadingUserLogin: false });
    }
  }

  render() {
    const { loadingUserLogin, LoggedInUser } = this.state;
    const collective = {
      host: {
        id: '',
      },
    };
    const order = {
      tier: {
        type: 'DONATION',
      },
    };

    return (
      <Fragment>
        <Header
          title="Create Pledge"
          className={loadingUserLogin ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
        />
        <Body>
          <H1>Make a Pledge</H1>
          <OrderForm
            collective={collective}
            order={order}
            LoggedInUser={LoggedInUser}
            onSubmit={() => {}}
            redeemFlow={() => {}}
            matchingFund={() => {}}
          />
        </Body>
        <Footer />
      </Fragment>
    );
  }
}

export { CreatePledgePage as MockCreatePledgePage };
export default withData(addGetLoggedInUserFunction(CreatePledgePage));
