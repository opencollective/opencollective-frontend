import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import { addCreateCollectiveMutation } from '../graphql/mutations';
import moment from 'moment-timezone';
import CreateCollectiveForm from '../components/CreateCollectiveForm';
import CollectiveCover from '../components/CollectiveCover';
import { Button } from 'react-bootstrap';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

class CreateCollective extends React.Component {

  static propTypes = {
    host: PropTypes.object
  }

  constructor(props) {
    super(props);
    const timezone = moment.tz.guess();
    this.state = { collective: { type: 'COLLECTIVE' }, result: {} };
    this.createCollective = this.createCollective.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
  }

  error(msg) {
    this.setState({ result: { error: msg }})
  }

  resetError() {
    this.error();
  }

  async createCollective(CollectiveInputType) {
    const { host } = this.props;
    this.setState( { status: 'loading' });
    CollectiveInputType.type = 'COLLECTIVE';
    CollectiveInputType.HostCollectiveId = host.id;
    console.log(">>> createCollective", CollectiveInputType);
    try {
      const res = await this.props.createCollective(CollectiveInputType);
      const collective = res.data.createCollective;
      const collectiveUrl = `${window.location.protocol}//${window.location.host}/${LoggedInUser.collective.slug}?status=collectiveCreated&CollectiveId=${collective.id}`;
      this.setState({ status: 'idle', result: { success: `Collective created successfully: ${collectiveUrl}` }});
      window.location.replace(collectiveUrl);
    } catch (err) {
      console.error(">>> createCollective error: ", JSON.stringify(err));
      const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
      this.setState( { result: { error: errorMsg }})
      throw new Error(errorMsg);
    }
  }

  render() {
    const { LoggedInUser, host } = this.props;
    const canApply = get(host, 'settings.apply');

    const title = `Apply to create a new collective on ${host.name}`;

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
        `}</style>

          <Header
            title={title}
            description={host.description}
            twitterHandle={host.twitterHandle}
            image={host.image || host.backgroundImage}
            className={this.state.status}
            LoggedInUser={this.props.LoggedInUser}
            />

          <Body>

          <CollectiveCover
            href={`/${host.slug}`}
            title={title}
            collective={host}
            style={get(host, 'settings.style.hero.cover')}
            />

          <div className="content" >

            { !canApply &&
              <div className="error">
                <p><FormattedMessage id="collectives.create.error.HostNotOpenToApplications" defaultMessage="This host is not open to application" /></p>
              </div>
            }
            { canApply &&
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
            }
          </div>
          </Body>

          <Footer />
      </div>
    );
  }

}

export default addCreateCollectiveMutation(CreateCollective);