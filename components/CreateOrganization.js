import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import { getErrorFromGraphqlException } from '../lib/utils';
import { addCreateCollectiveMutation } from '../lib/graphql/mutations';
import CreateCollectiveForm from './CreateCollectiveForm';
import CollectiveCover from './CollectiveCover';
import SignInOrJoinFree from './SignInOrJoinFree';
import { FormattedMessage } from 'react-intl';
import { Router } from '../server/pages';
import { get } from 'lodash';

class CreateOrganization extends React.Component {
  static propTypes = {
    host: PropTypes.object,
    createCollective: PropTypes.func,
    LoggedInUser: PropTypes.object,
    refetchLoggedInUser: PropTypes.func.isRequired, // props coming from withUser
  };

  constructor(props) {
    super(props);
    this.state = { collective: { type: 'ORGANIZATION' }, result: {} };
    this.createCollective = this.createCollective.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
  }

  error(msg) {
    this.setState({ result: { error: msg } });
  }

  resetError() {
    this.error();
  }

  async createCollective(CollectiveInputType) {
    if (!CollectiveInputType.tos) {
      this.setState({
        result: { error: 'Please accept the terms of service' },
      });
      return;
    }
    if (get(this.host, 'settings.tos') && !CollectiveInputType.hostTos) {
      this.setState({
        result: { error: 'Please accept the terms of fiscal sponsorship' },
      });
      return;
    }

    this.setState({ status: 'loading' });
    CollectiveInputType.type = 'ORGANIZATION';

    try {
      const res = await this.props.createCollective(CollectiveInputType);
      const collective = res.data.createCollective;
      const collectiveUrl = `${window.location.protocol}//${window.location.host}/${collective.slug}?status=collectiveCreated&CollectiveId=${collective.id}`;
      this.setState({
        status: 'idle',
        result: {
          success: `Organization created successfully: ${collectiveUrl}`,
        },
      });
      await this.props.refetchLoggedInUser();
      Router.pushRoute('collective', {
        CollectiveId: collective.id,
        slug: collective.slug,
        status: 'collectiveCreated',
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ result: { error: errorMsg } });
      throw new Error(errorMsg);
    }
  }

  render() {
    const { LoggedInUser } = this.props;

    const title = 'Create a new organization';

    return (
      <div className="CreateOrganization">
        <style jsx>
          {`
            .result {
              text-align: center;
              margin-bottom: 5rem;
            }
            .success {
              color: green;
            }
            .error {
              color: red;
            }
            .CollectiveTemplatePicker {
              max-width: 700px;
              margin: 0 auto;
            }
            .CollectiveTemplatePicker .field {
              margin: 0;
            }
            .login {
              margin: 0 auto;
              text-align: center;
            }
            .signin {
              text-align: center;
            }
          `}
        </style>

        <Header
          title={title}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
          menuItems={{ pricing: true, howItWorks: true }}
        />

        <Body>
          <CollectiveCover
            title={title}
            description={
              <FormattedMessage
                id="collectives.create.description"
                defaultMessage="An Organization allows you to make financial contributions as a company or team. You can also add a credit card with a monthly limit that team members can use to make contributions."
              />
            }
            collective={this.state.collective}
          />

          <div className="content">
            {!LoggedInUser && (
              <div className="signin">
                <SignInOrJoinFree />
              </div>
            )}
            {LoggedInUser && (
              <div>
                <CreateCollectiveForm
                  collective={this.state.collective}
                  onSubmit={this.createCollective}
                  onChange={this.resetError}
                />

                <div className="result">
                  <div className="success">{this.state.result.success}</div>
                  <div className="error">{this.state.result.error}</div>
                </div>
              </div>
            )}
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default addCreateCollectiveMutation(CreateOrganization);
