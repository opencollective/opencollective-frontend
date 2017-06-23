import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import EditEventForm from '../components/EditEventForm';

import { addEditEventMutation } from '../graphql/mutations';

class EditEvent extends React.Component {

  static propTypes = {
    event: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.editEvent = this.editEvent.bind(this);
    this.state = { status: 'idle', result: {} };
  }

  async editEvent(EventInputType) {
    this.setState( { status: 'loading' });
    try {
      const res = await this.props.editEvent(EventInputType);
      const event = res.data.editEvent;
      const eventUrl = `${window.location.protocol}//${window.location.host}/${event.collective.slug}/events/${event.slug}`;
      this.setState({ status: 'idle', result: { success: `Event edited with success: ${eventUrl}` }});
    } catch (err) {
      console.error(">>> editEvent error: ", JSON.stringify(err));
      const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
      this.setState( { result: { error: errorMsg }})
      throw new Error(errorMsg);
    }
  }

  render() {

    const title = "Edit Event";

    return (
      <div className="EditEvent">
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
        `}</style>
        <Header
          title={title}
          LoggedInUser={this.props.LoggedInUser}
          scripts={['google']}
        />
        <Body>
          <EditEventForm event={this.props.event} onSubmit={this.editEvent} />
          <div className="result">
            <div className="success">{this.state.result.success}</div>
            <div className="error">{this.state.result.error}</div>
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default addEditEventMutation(EditEvent);