import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import { Button } from 'react-bootstrap';

import { Link } from '../server/pages';

import Header from '../components/Header';
import Footer from '../components/Footer';
import Body from '../components/Body';
import ErrorPage from '../components/ErrorPage';

import { getCollectiveApplicationsQuery } from '../graphql/queries';

import withData from '../lib/withData';
import withLoggedInUser from '../lib/withLoggedInUser';

class Apps extends React.Component {
  static async getInitialProps({ query: { collectiveSlug } }) {
    return { collectiveSlug, slug: collectiveSlug };
  }

  static propTypes = {
    getLoggedInUser: PropTypes.func.isRequired,
    data: PropTypes.object,
    collectiveSlug: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;

    const bustCache = new Date().getTime();

    const [LoggedInUser] = await Promise.all([
      getLoggedInUser(),
      this.props.data.refetch({ bustCache }), // Force Client side refetch
    ]);

    this.setState({ LoggedInUser });
  }

  render() {
    const { data, collectiveSlug } = this.props;
    const { LoggedInUser, loading } = this.state;
    const { Collective } = data;

    if (loading) {
      return <ErrorPage loading={loading} data={data} />;
    }

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const apiKeys = Collective.applications.filter(
      app => app.type === 'API_KEY',
    );

    return (
      <div>
        <style jsx>
          {`
            .apps {
              width: 80%;
              margin: 40px auto;
            }
            .actions {
              padding: 20px 0;
            }
            .app {
              border: 1px solid #ccc;
              margin: 20px 0;
              padding: 10px;
            }
            .separator {
              border-top: 1px solid #ccc;
              margin-top: 20px;
              padding-top: 20px;
            }
          `}
        </style>
        <Header LoggedInUser={LoggedInUser} />
        <Body>
          {Collective && (
            <div className="apps">
              <h3>API Keys</h3>

              <p>
                Use API Keys to interact with the Open Collective GraphQL API
                with your own account.
              </p>

              {(!apiKeys || apiKeys.length === 0) && (
                <p style={{ padding: '10px 0' }}>
                  <i>No API Key registered.</i>
                </p>
              )}

              {apiKeys &&
                apiKeys.length > 0 && (
                  <Fragment>
                    {apiKeys.map(application => (
                      <div className="app" key={application.id}>
                        <div className="keys">
                          API Key: <code>{application.apiKey}</code>
                          &nbsp; - &nbsp;
                          <Link
                            route="editApplication"
                            params={{
                              collectiveSlug,
                              applicationId: application.id,
                            }}
                          >
                            <a>Delete</a>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </Fragment>
                )}

              <div className="actions separator">
                <Link
                  route="createApplication"
                  params={{ collectiveSlug, type: 'apiKey' }}
                  passHref
                >
                  <Button bsStyle="primary">New API Key</Button>
                </Link>
              </div>

              {/*

              <h3>oAuth Applications</h3>

              <p>
                Use oAuth Applications to create applications that let other
                users authenticate and interact on our API with their Open
                Collective account.
              </p>

              <p>
                <i>Coming next year.</i>
              </p>

              */}
            </div>
          )}
        </Body>
        <Footer />
      </div>
    );
  }
}

export const addCollectiveApplicationsData = graphql(
  getCollectiveApplicationsQuery,
);

export default withData(withLoggedInUser(addCollectiveApplicationsData(Apps)));
