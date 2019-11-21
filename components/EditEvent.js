import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import EditEventForm from './EditEventForm';
import CollectiveCover from './CollectiveCover';
import { Button } from 'react-bootstrap';
import { addEditCollectiveMutation } from '../lib/graphql/mutations';
import { Router } from '../server/pages';
import { FormattedMessage } from 'react-intl';

class EditEvent extends React.Component {
  static propTypes = {
    event: PropTypes.object,
    editCollective: PropTypes.func,
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.editEvent = this.editEvent.bind(this);
    this.state = { status: 'idle', result: {} };
  }

  async editEvent(EventInputType) {
    this.setState({ status: 'loading' });
    try {
      EventInputType.type = 'EVENT';
      EventInputType.ParentCollectiveId = this.props.event.parentCollective.id;
      const res = await this.props.editCollective(EventInputType);
      const event = res.data.editCollective;
      const eventRoute = `/${this.props.event.parentCollective.slug}/events/${event.slug}`;
      Router.pushRoute(eventRoute);
      this.setState({ result: { success: 'Event edited successfully' } });
    } catch (err) {
      console.error('>>> editEvent error: ', JSON.stringify(err));
      const errorMsg = err.graphQLErrors && err.graphQLErrors[0] ? err.graphQLErrors[0].message : err.message;
      this.setState({ status: 'idle', result: { error: errorMsg } });
      throw new Error(errorMsg);
    }
  }

  render() {
    const event = this.props.event || {};

    if (!event.name) return <div />;

    const { LoggedInUser } = this.props;

    const parentCollective = event.parentCollective;
    const canEditEvent = LoggedInUser && LoggedInUser.canEditEvent(event);

    return (
      <div className="EditEvent">
        <style jsx>
          {`
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
          `}
        </style>

        <Header collective={parentCollective} className={this.state.status} LoggedInUser={this.props.LoggedInUser} />

        <Body>
          <CollectiveCover
            collective={parentCollective}
            className="small"
            title={<FormattedMessage id="menu.edit.event" defaultMessage="edit event" />}
            forceLegacy
          />

          <div className="content">
            {!canEditEvent && (
              <div className="login">
                <p>
                  You need to be logged in as the creator of this event
                  <br />
                  or as a core contributor of the {event.parentCollective.name} collective.
                </p>
                <p>
                  <Button bsStyle="primary" href={`/signin?next=/${event.slug}/edit`}>
                    Login
                  </Button>
                </p>
              </div>
            )}
            {canEditEvent && (
              <div>
                <EditEventForm event={event} onSubmit={this.editEvent} loading={this.state.status === 'loading'} />
                <div className="actions">
                  <div className="result">
                    <div className="success">{this.state.result.success}</div>
                    <div className="error">{this.state.result.error}</div>
                  </div>
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

export default addEditCollectiveMutation(EditEvent);
