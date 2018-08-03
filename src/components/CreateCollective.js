import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import { addCreateCollectiveMutation } from '../graphql/mutations';
import CreateCollectiveForm from './CreateCollectiveForm';
import CreateCollectiveCover from './CreateCollectiveCover';
import ErrorPage from './ErrorPage';
import SignInForm from './SignInForm';
import { get } from 'lodash';
import { FormattedMessage, defineMessages } from 'react-intl';

class CreateCollective extends React.Component {

  static propTypes = {
    host: PropTypes.object,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { collective: { type: 'COLLECTIVE' }, result: {} };
    this.createCollective = this.createCollective.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
    this.messages = defineMessages({
      'host.apply.title': { id: 'host.apply.title', defaultMessage: 'Apply to create a new {hostname} collective' },
      'collective.create.title': { id: 'collective.create.title', defaultMessage: 'Create an Open Collective' },
      'collective.create.description': { id: 'collective.create.description', defaultMessage: 'The place for your community to collect money and share your finance in full transparency.' },
    });

    this.host = props.host || {
      type: 'COLLECTIVE',
      settings: {
        apply: {
          title: this.props.intl.formatMessage(this.messages['collective.create.title']),
          description: this.props.intl.formatMessage(this.messages['collective.create.description'])
        }
      }
    };

  }

  error(msg) {
    this.setState({ result: { error: msg }})
  }

  resetError() {
    this.error();
  }

  async createCollective(CollectiveInputType) {
    if (!CollectiveInputType.tos || (get(this.host, 'settings.tos') && !CollectiveInputType.hostTos)) {
      this.setState( { result: { error: "Please accept the terms of service" }})
      return;
    }
    this.setState( { status: 'loading' });
    CollectiveInputType.type = 'COLLECTIVE';
    CollectiveInputType.HostCollectiveId = this.host.id;
    if (CollectiveInputType.tags) {
      CollectiveInputType.tags = CollectiveInputType.tags.split(',').map(t => t.trim());
    }
    CollectiveInputType.tags = [...CollectiveInputType.tags || [], ...this.host.tags || []] || [];
    if (CollectiveInputType.category) {
      CollectiveInputType.tags.push(CollectiveInputType.category);
    }
    CollectiveInputType.data = CollectiveInputType.data || {};
    CollectiveInputType.data.members = CollectiveInputType.members;
    CollectiveInputType.data.meetupSlug = CollectiveInputType.meetup;
    delete CollectiveInputType.category;
    delete CollectiveInputType.tos;
    delete CollectiveInputType.hostTos;
    console.log(">>> creating collective ", CollectiveInputType);
    try {
      const res = await this.props.createCollective(CollectiveInputType);
      const collective = res.data.createCollective;
      let successUrl;
      if (CollectiveInputType.HostCollectiveId) {
        successUrl = `${window.location.protocol}//${window.location.host}/${collective.slug}?status=collectiveCreated&CollectiveId=${collective.id}&collectiveSlug=${collective.slug}`;
      } else {
        successUrl = `${window.location.protocol}//${window.location.host}/${collective.slug}/edit#host`;
      }
      this.setState({ status: 'idle', result: { success: `Collective created successfully` }});
      window.location.replace(successUrl);
    } catch (err) {
      console.error(">>> createCollective error: ", JSON.stringify(err));
      const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
      this.setState( { status: 'idle', result: { error: errorMsg }})
      throw new Error(errorMsg);
    }
  }

  render() {
    const { LoggedInUser, intl } = this.props;

    const canApply = get(this.host, 'settings.apply');
    const title = get(this.host, 'settings.apply.title') || intl.formatMessage(this.messages['host.apply.title'], { hostname: this.host.name });
    const description = get(this.host, 'settings.apply.description') || intl.formatMessage(this.messages['collective.create.description'], { hostname: this.host.name });

    if (!host) {
      return (<ErrorPage loading />);
    }

    return (
      <div className="CreateCollective">
        <style jsx>{`
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
          .signin {
            text-align: center;
          }
          .login {
            margin: 0 auto;
            text-align: center;
          }
        `}</style>

        <Header
          title={title}
          description={description}
          twitterHandle={this.host.twitterHandle}
          image={this.host.image || this.host.backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
          />

        <Body>

          <CreateCollectiveCover host={this.host} />

          <div className="content" >

            { !canApply &&
              <div className="error">
                <p><FormattedMessage id="collectives.create.error.HostNotOpenToApplications" defaultMessage="This host is not open to applications" /></p>
              </div>
            }

            { canApply && !LoggedInUser &&
              <div className="signin">
                <h2><FormattedMessage id="collectives.create.signin" defaultMessage="Sign in or create an Open Collective account" /></h2>
                <SignInForm next={`/${this.host.slug}/apply`} />
              </div>
            }

            { canApply && LoggedInUser &&
              <div>

                <CreateCollectiveForm
                  host={this.host}
                  collective={this.state.collective}
                  onSubmit={this.createCollective}
                  onChange={this.resetError}
                  />

                <div className="result">
                  <div className="success">{this.state.result.success}</div>
                  <div className="error">{this.state.result.error}</div>
                </div>
              </div>
            }
          </div>
        </Body>

        <Footer />
      </div>
    );
  }

}

export default withIntl(addCreateCollectiveMutation(CreateCollective));
