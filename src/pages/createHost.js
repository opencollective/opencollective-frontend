import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import React from 'react';
import CreateHostForm from '../components/CreateHostForm';
import { addGetLoggedInUserFunction } from '../graphql/queries';
import Loading from '../components/Loading';
import SignInForm from '../components/SignInForm';

class CreateHostPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug || "none" }
  }

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser, loading: false });
  }

  render() {
    const { loading, LoggedInUser } = this.state;
    if (loading) {
      return <Loading />;
    }

    return (
      <div>
        { LoggedInUser &&
          <CreateHostForm
            LoggedInUser={LoggedInUser}
            />
        }
        { !LoggedInUser &&
          <div className="login">
            <p>You need to be logged in to conitnue.</p>
            <SignInForm next={`/${this.props.slug}/edit`} />
          </div>        
        }
      </div>
    );
  }
}

export default withData(withIntl(addGetLoggedInUserFunction(CreateHostPage)));
