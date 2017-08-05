import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import EditCollectiveForm from '../components/EditCollectiveForm';
import CollectiveCover from '../components/CollectiveCover';
import { Button } from 'react-bootstrap';
import { get } from 'lodash';
import { addEditCollectiveMutation, addDeleteCollectiveMutation } from '../graphql/mutations';
import { defaultBackgroundImage } from '../constants/collective';

class EditCollective extends React.Component {

  static propTypes = {
    collective: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.editCollective = this.editCollective.bind(this);
    this.deleteCollective = this.deleteCollective.bind(this);
    this.state = { status: 'idle', result: {} };
  }

  async editCollective(CollectiveInputType) {
    this.setState( { status: 'loading' });
    try {
      if (CollectiveInputType.backgroundImage === defaultBackgroundImage[CollectiveInputType.type]) {
        delete CollectiveInputType.backgroundImage;
      }
      console.log(">>> CollectiveInputType", CollectiveInputType);
      const res = await this.props.editCollective(CollectiveInputType);
      const collective = res.data.editCollective;
      const collectiveUrl = `${window.location.protocol}//${window.location.host}/${collective.slug}`;
      window.location.replace(collectiveUrl);
      this.setState({ result: { success: `Collective edited with success: ${collectiveUrl} (redirecting...)` }});
    } catch (err) {
      console.error(">>> editCollective error: ", JSON.stringify(err));
      const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
      this.setState( { status: 'idle', result: { error: errorMsg }})
      throw new Error(errorMsg);
    }
  }

  async deleteCollective() {
    if (confirm("😱 Are you really sure you want to delete this collective?")) {
      this.setState( { status: 'loading' });
      try {
        await this.props.deleteCollective(this.props.collective.id);
        this.setState({ status: 'idle', result: { success: `Collective deleted with success` }});
        const collectiveUrl = `${window.location.protocol}//${window.location.host}/${this.props.collective.parentCollective.slug}`;
        window.location.replace(collectiveUrl);
      } catch (err) {
        console.error(">>> deleteCollective error: ", JSON.stringify(err));
        const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
        this.setState( { result: { error: errorMsg }})
        throw new Error(errorMsg);
      }
    }
  }

  render() {

    const collective = this.props.collective || {};

    if (!collective.name) return (<div />);

    const { LoggedInUser } = this.props;

    const title = `Edit ${collective.name}`;
    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective;

    return (
      <div className="EditCollective">
        <style jsx>{`
          .success {
            color: green;
          }
          .error {
            color: red;
          }
          .login {
            text-align: center;
          }
          .actions {
            text-align: center;
            margin-bottom: 5rem;
          }
        `}</style>
        
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={this.props.LoggedInUser}
          />

        <Body>

          <CollectiveCover
            href={`/${collective.slug}`}
            collective={collective}
            title={title}
            className="small"
            />

          <div className="content" >
            {!canEditCollective &&
              <div className="login">
                <p>You need to be logged in as the creator of this collective<br />or as a core contributor of the {collective.name} collective.</p>
                <p><Button bsStyle="primary" href={`/login?next=${collective.slug}/edit`}>Login</Button></p>
              </div>
            }   
            { canEditCollective &&
              <div>
                <EditCollectiveForm collective={collective} onSubmit={this.editCollective} loading={this.state.status === 'loading'} />
                <div className="actions">
                  (<a onClick={this.deleteCollective}>delete collective</a>)
                  <div className="result">
                    <div className="success">{this.state.result.success}</div>
                    <div className="error">{this.state.result.error}</div>
                  </div>
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

export default addEditCollectiveMutation(addDeleteCollectiveMutation(EditCollective));