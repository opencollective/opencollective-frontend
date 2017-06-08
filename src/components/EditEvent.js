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
    } catch (e) {
      console.error(">>> editEvent error: ", e);
      const errorMsg = (e.graphQLErrors) ? e.graphQLErrors[0].message : e.message;
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