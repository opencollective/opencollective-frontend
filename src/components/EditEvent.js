import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import EditEventForm from '../components/EditEventForm';
import CollectiveCover from '../components/CollectiveCover';
import { Button } from 'react-bootstrap';
import { get } from 'lodash';
import { addEditCollectiveMutation, addDeleteCollectiveMutation } from '../graphql/mutations';

class EditEvent extends React.Component {

  static propTypes = {
    event: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.editEvent = this.editEvent.bind(this);
    this.deleteEvent = this.deleteEvent.bind(this);
    this.state = { status: 'idle', result: {} };
  }

  async editEvent(EventInputType) {
    this.setState( { status: 'loading' });
    try {
      EventInputType.type = 'EVENT';
      EventInputType.ParentCollectiveId = this.props.event.parentCollective.id;
      const res = await this.props.editCollective(EventInputType);
      const event = res.data.editCollective;
      const eventUrl = `${window.location.protocol}//${window.location.host}/${event.slug}`;
      window.location.replace(eventUrl);
      this.setState({ result: { success: `Event edited with success: ${eventUrl} (redirecting...)` }});
    } catch (err) {
      console.error(">>> editEvent error: ", JSON.stringify(err));
      const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
      this.setState( { status: 'idle', result: { error: errorMsg }})
      throw new Error(errorMsg);
    }
  }

  async deleteEvent() {
    if (confirm("😱 Are you really sure you want to delete this event?")) {
      this.setState( { status: 'loading' });
      try {
        await this.props.deleteCollective(this.props.event.id);
        this.setState({ status: 'idle', result: { success: `Event deleted with success` }});
        const collectiveUrl = `${window.location.protocol}//${window.location.host}/${this.props.event.parentCollective.slug}`;
        window.location.replace(collectiveUrl);
      } catch (err) {
        console.error(">>> deleteEvent error: ", JSON.stringify(err));
        const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
        this.setState( { result: { error: errorMsg }})
        throw new Error(errorMsg);
      }
    }
  }

  render() {

    const event = this.props.event || {};

    if (!event.name) return (<div />);

    const { LoggedInUser } = this.props;

    const parentCollective = event.parentCollective;
    const title = `Edit ${event.name}`;
    const canEditEvent = LoggedInUser && LoggedInUser.canEditEvent;

    return (
      <div className="EditEvent">
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
          title={parentCollective.name}
          description={parentCollective.description}
          twitterHandle={parentCollective.twitterHandle}
          image={parentCollective.image || parentCollective.backgroundImage}
          className={this.state.status}
          LoggedInUser={this.props.LoggedInUser}
          />

        <Body>

          <CollectiveCover
            href={`/${parentCollective.slug}`}
            logo={parentCollective.image}
            title={title}
            className="small"
            backgroundImage={parentCollective.backgroundImage}
            style={get(parentCollective, 'settings.style.hero.cover')}
            />

          <div className="content" >
            {!canEditEvent &&
              <div className="login">
                <p>You need to be logged in as the creator of this event<br />or as a core contributor of the {event.parentCollective.name} collective.</p>
                <p><Button bsStyle="primary" href={`/login?next=${event.slug}/edit`}>Login</Button></p>
              </div>
            }   
            { canEditEvent &&
              <div>
                <EditEventForm event={event} onSubmit={this.editEvent} loading={this.state.status === 'loading'} />
                <div className="actions">
                  (<a onClick={this.deleteEvent}>delete event</a>)
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

export default addEditCollectiveMutation(addDeleteCollectiveMutation(EditEvent));