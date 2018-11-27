import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import { graphql } from 'react-apollo';
import { Button, Col, Row } from 'react-bootstrap';

import { Router } from '../server/pages';

import Header from '../components/Header';
import Footer from '../components/Footer';
import Body from '../components/Body';
import InputField from '../components/InputField';
import ErrorPage from '../components/ErrorPage';

import { getCollectiveApplicationsQuery } from '../graphql/queries';
import { createApplicationMutation } from '../graphql/mutations';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

const applicationTypes = { apiKey: 'API_KEY', oAuth: 'OAUTH' };

class Apps extends React.Component {
  static getInitialProps({ query: { collectiveSlug, type } }) {
    return { collectiveSlug, type };
  }

  static propTypes = {
    getLoggedInUser: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    createApplication: PropTypes.func.isRequired,
    data: PropTypes.object,
    collectiveSlug: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['apiKey', 'oAuth']),
  };

  constructor(props) {
    super(props);
    this.state = { form: {}, loading: true };
    this.state.form.type = applicationTypes[props.type];
    this.createForm = React.createRef();

    this.messages = defineMessages({
      'app.name': { id: 'app.name', defaultMessage: 'name' },
      'app.description': {
        id: 'app.description',
        defaultMessage: 'description',
      },
      'app.callbackUrl': {
        id: 'app.callbackUrl',
        defaultMessage: 'callbackUrl',
      },
    });
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser, loading: false });
  }

  handleChange(attr, value) {
    const { form } = this.state;
    form[attr] = value;
    this.setState({ form });
  }

  handleSubmit = async e => {
    e.preventDefault();

    const { collectiveSlug } = this.props;

    const application = this.state.form;
    const result = await this.props.createApplication(application);

    if (result) {
      Router.pushRoute('applications', { collectiveSlug });
    }
  };

  render() {
    const { data, intl, type } = this.props;
    const { LoggedInUser, loading } = this.state;

    if (loading) {
      return <ErrorPage loading={loading} data={data} />;
    }

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
            .separator {
              border-top: 1px solid #ccc;
              margin-top: 20px;
              padding-top: 20px;
            }
          `}
        </style>
        <Header LoggedInUser={LoggedInUser} />
        <Body>
          {!LoggedInUser && <p>Authenticate to manage your apps.</p>}

          {LoggedInUser && (
            <div className="apps">
              <form method="post" onSubmit={this.handleSubmit} ref={this.createForm}>
                {type === 'apiKey' && (
                  <Fragment>
                    <h3>Create an API Key</h3>
                    <div className="separator actions">
                      <Button bsStyle="primary" type="submit" onClick={this.handleSubmit}>
                        Create API Key
                      </Button>
                    </div>
                  </Fragment>
                )}

                {type !== 'apiKey' && (
                  <Fragment>
                    <h3>Create an application</h3>

                    <Row key="app.name.input">
                      <Col sm={12}>
                        <InputField
                          className="horizontal"
                          type="text"
                          name="name"
                          label={intl.formatMessage(this.messages['app.name'])}
                          onChange={value => this.handleChange('name', value)}
                        />
                      </Col>
                    </Row>

                    <Row key="app.description.input">
                      <Col sm={12}>
                        <InputField
                          className="horizontal"
                          type="text"
                          name="description"
                          label={intl.formatMessage(this.messages['app.description'])}
                          onChange={value => this.handleChange('description', value)}
                        />
                      </Col>
                    </Row>

                    <Row key="app.callbackUrl.input">
                      <Col sm={12}>
                        <InputField
                          className="horizontal"
                          type="text"
                          name="callbackUrl"
                          label={intl.formatMessage(this.messages['app.callbackUrl'])}
                          onChange={value => this.handleChange('callbackUrl', value)}
                        />
                      </Col>
                    </Row>

                    <div className="actions">
                      <Button bsStyle="primary" type="submit" onClick={this.handleSubmit}>
                        Create Application
                      </Button>
                    </div>
                  </Fragment>
                )}
              </form>
            </div>
          )}
        </Body>
        <Footer />
      </div>
    );
  }
}

export const addCreateApplicationMutation = graphql(createApplicationMutation, {
  props: ({ mutate, ownProps }) => ({
    createApplication: application => {
      return mutate({
        variables: { application },
        awaitRefetchQueries: true,
        refetchQueries: [
          {
            query: getCollectiveApplicationsQuery,
            variables: {
              slug: ownProps.collectiveSlug,
            },
          },
        ],
      });
    },
  }),
});

export default withData(withIntl(withLoggedInUser(addCreateApplicationMutation(Apps))));
