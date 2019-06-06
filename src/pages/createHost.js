import React from 'react';
import PropTypes from 'prop-types';

import CreateHostForm from '../components/CreateHostForm';
import Loading from '../components/Loading';
import SignInForm from '../components/SignInForm';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import { FormattedMessage } from 'react-intl';

class CreateHostPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug || 'none' };
  }

  static propTypes = {
    slug: PropTypes.string,
    getLoggedInUser: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && (await getLoggedInUser());
    this.setState({ LoggedInUser, loading: false });
  }

  render() {
    const { loading, LoggedInUser } = this.state;
    if (loading) {
      return <Loading />;
    }

    return (
      <div>
        {LoggedInUser && <CreateHostForm LoggedInUser={LoggedInUser} />}
        {!LoggedInUser && (
          <div className="login">
            <p>
              <FormattedMessage
                id="authorization.loginRequired"
                defaultMessage="You need to be logged in to continue."
              />
            </p>
            <SignInForm next={`/${this.props.slug}/edit`} />
          </div>
        )}
      </div>
    );
  }
}

export default withData(withIntl(withLoggedInUser(CreateHostPage)));
