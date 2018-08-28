import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import { Button, Col, Row } from 'react-bootstrap';
import { pick } from 'lodash';

import { Router } from '../server/pages';

import Header from '../components/Header';
import Footer from '../components/Footer';
import Body from '../components/Body';
import InputField from '../components/InputField';
import ErrorPage from '../components/ErrorPage';

import { getCollectiveApplicationsQuery } from '../graphql/queries';
import {
  updateApplicationMutation,
  deleteApplicationMutation,
} from '../graphql/mutations';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

class EditApplication extends React.Component {
  static getInitialProps({ query: { collectiveSlug, applicationId } }) {
    return { collectiveSlug, applicationId, slug: collectiveSlug };
  }

  static propTypes = {
    getLoggedInUser: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    updateApplication: PropTypes.func.isRequired,
    deleteApplication: PropTypes.func.isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    applicationId: PropTypes.string.isRequired,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { form: {}, loading: true };
    this.createForm = React.createRef();

    const { data, applicationId } = this.props;
    const {
      Collective: { applications },
    } = data;

    const application = applications.find(a => a.id == applicationId);

    this.state.form = pick(application, [
      'type',
      'name',
      'description',
      'callbackUrl',
    ]);

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

    const { collectiveSlug, applicationId } = this.props;

    const application = this.state.form;
    const result = await this.props.updateApplication(
      applicationId,
      application,
    );
    if (result) {
      Router.pushRoute('applications', { collectiveSlug });
    }
  };

  handleDelete = async e => {
    e.preventDefault();

    const { collectiveSlug, applicationId } = this.props;

    const result = await this.props.deleteApplication(applicationId);
    if (result) {
      Router.pushRoute('applications', { collectiveSlug });
    }
  };

  render() {
    const { data, intl } = this.props;
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
              <form
                method="post"
                onSubmit={this.handleSubmit}
                ref={this.createForm}
              >
                {this.state.form.type === 'apiKey' && (
                  <Fragment>
                    <h3>Edit an API Key</h3>
                    <div className="separator">
                      <Button
                        bsStyle="danger"
                        type="submit"
                        onClick={this.handleDelete}
                      >
                        Delete API Key
                      </Button>
                    </div>
                  </Fragment>
                )}
                {this.state.form.type !== 'apiKey' && (
                  <Fragment>
                    <h3>Edit an application</h3>
                    <Row key="app.name.input">
                      <Col sm={12}>
                        <InputField
                          className="horizontal"
                          type="text"
                          name="name"
                          label={intl.formatMessage(this.messages['app.name'])}
                          defaultValue={this.state.form.name}
                          value={this.state.form.name}
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
                          label={intl.formatMessage(
                            this.messages['app.description'],
                          )}
                          defaultValue={this.state.form.description}
                          value={this.state.form.description}
                          onChange={value =>
                            this.handleChange('description', value)
                          }
                        />
                      </Col>
                    </Row>
                    <Row key="app.callbackUrl.input">
                      <Col sm={12}>
                        <InputField
                          className="horizontal"
                          type="text"
                          name="callbackUrl"
                          label={intl.formatMessage(
                            this.messages['app.callbackUrl'],
                          )}
                          defaultValue={this.state.form.callbackUrl}
                          value={this.state.form.callbackUrl}
                          onChange={value =>
                            this.handleChange('callbackUrl', value)
                          }
                        />
                      </Col>
                    </Row>
                    <div className="actions">
                      <Button
                        bsStyle="primary"
                        type="submit"
                        onClick={this.handleSubmit}
                      >
                        Update Application
                      </Button>

                      <div className="separator">
                        <Button
                          bsStyle="danger"
                          type="submit"
                          onClick={this.handleDelete}
                        >
                          Delete Application
                        </Button>
                      </div>
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

const addDeleteApplicationMutation = graphql(deleteApplicationMutation, {
  props: ({ mutate, ownProps }) => ({
    deleteApplication: applicationId => {
      return mutate({
        variables: { id: applicationId },
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

const addUpdateApplicationMutation = graphql(updateApplicationMutation, {
  props: ({ mutate }) => ({
    updateApplication: (id, application) => {
      return mutate({
        variables: { id, application },
      });
    },
  }),
});

const addCollectiveApplicationsData = graphql(getCollectiveApplicationsQuery);

const addData = compose(
  addDeleteApplicationMutation,
  addUpdateApplicationMutation,
  addCollectiveApplicationsData,
);

export default withData(withIntl(withLoggedInUser(addData(EditApplication))));
