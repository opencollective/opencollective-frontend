import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import dayjs from '../lib/dayjs';
import { getErrorFromGraphqlException } from '../lib/errors';
import { addCreateCollectiveMutation } from '../lib/graphql/mutations';

import Body from './Body';
import CollectiveNavbar from './collective-navbar';
import Container from './Container';
import EditEventForm from './EditEventForm';
import Footer from './Footer';
import Header from './Header';
import Link from './Link';
import StyledButton from './StyledButton';
import { withUser } from './UserProvider';

class CreateEvent extends React.Component {
  static propTypes = {
    parentCollective: PropTypes.object,
    createCollective: PropTypes.func,
    LoggedInUser: PropTypes.object, // from withUser
    refetchLoggedInUser: PropTypes.func.isRequired, // from withUser
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    const timezone = dayjs.tz.guess();

    this.state = {
      event: {
        parentCollective: props.parentCollective,
        timezone, // "Europe/Brussels", // "America/New_York"
      },
      result: {},
    };
    this.createEvent = this.createEvent.bind(this);
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
  }

  error(msg) {
    this.setState({ result: { error: msg } });
  }

  resetError() {
    this.error();
  }

  async createEvent(EventInputType) {
    const { parentCollective } = this.props;
    this.setState({ status: 'loading' });
    EventInputType.type = 'EVENT';
    EventInputType.ParentCollectiveId = parentCollective.id;
    EventInputType.tiers = EventInputType.tiers.filter(tier => tier.name);
    try {
      const res = await this.props.createCollective(EventInputType);
      const event = res.data.createCollective;
      this.setState({
        status: 'idle',
        result: { success: `Event created successfully.` },
      });
      await this.props.refetchLoggedInUser();
      await this.props.router.push({
        pathname: `/${parentCollective.slug}/events/${event.slug}`,
        query: {
          status: 'eventCreated',
        },
      });
      window.scrollTo(0, 0);
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({
        status: 'idle',
        result: { error: errorMsg },
      });
      throw new Error(errorMsg);
    }
  }

  async handleTemplateChange(event) {
    delete event.id;
    delete event.slug;
    this.setState({ event, tiers: event.tiers });
  }

  render() {
    const { parentCollective, LoggedInUser } = this.props;
    const canCreateEvent = LoggedInUser && LoggedInUser.canEditCollective(parentCollective);

    const collective = parentCollective || {};
    const title = `Create a New ${collective.name} Event`;

    return (
      <div className="CreateEvent">
        <Header title={title} className={this.state.status} LoggedInUser={this.props.LoggedInUser} />

        <Body>
          <CollectiveNavbar collective={collective} isAdmin={canCreateEvent} />

          <div className="content">
            {!canCreateEvent && (
              <Container margin="0 auto" textAlign="center">
                <p>
                  <FormattedMessage
                    id="events.create.login"
                    defaultMessage="You need to be logged as a team member of this Collective to create an event."
                  />
                </p>
                <p>
                  <Link href={`/signin?next=/${collective.slug}/events/new`}>
                    <StyledButton buttonStyle="primary">
                      <FormattedMessage id="signIn" defaultMessage="Sign In" />
                    </StyledButton>
                  </Link>
                </p>
              </Container>
            )}
            {canCreateEvent && (
              <div>
                <EditEventForm
                  event={this.state.event}
                  onSubmit={this.createEvent}
                  onChange={this.resetError}
                  loading={this.state.status === 'loading' || this.state.result.success}
                />
                <Container textAlign="center" marginBottom="5rem">
                  <Container style={{ color: 'green' }}>{this.state.result.success}</Container>
                  <Container style={{ color: 'red' }}>{this.state.result.error}</Container>
                </Container>
              </div>
            )}
          </div>
        </Body>

        <Footer />
      </div>
    );
  }
}

export default withUser(addCreateCollectiveMutation(withRouter(CreateEvent)));
