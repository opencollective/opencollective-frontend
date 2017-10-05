import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import ActionBar from '../components/ActionBar';
import HashLink from 'react-scrollchor';
import CollectiveCard from '../components/CollectiveCard';
import NotificationBar from '../components/NotificationBar';
import { addCreateResponseMutation } from '../graphql/mutations';
import Markdown from 'react-markdown';
import { FormattedMessage, FormattedDate, FormattedTime } from 'react-intl';

const defaultBackgroundImage = '/static/images/defaultBackgroundImage-profile.svg';

class Profile extends React.Component {

  static propTypes = {
    event: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.user = this.props.user; // pre-loaded by SSR

    this.defaultActions = [];

    this.state = {
      api: { status: 'idle' },
      actions: this.defaultActions
    };
  }

  componentDidMount() {
    window.oc = { user: this.user }; // for easy debugging
  }

  render() {
    const info = (
      <HashLink to="#location">
        <FormattedDate value={this.user.createdAt} weekday='short' day='numeric' month='long' />, &nbsp;
      </HashLink>
    );

    const backgroundImage = this.profile.backgroundImage || this.profile.parentCollective.backgroundImage || defaultBackgroundImage;

    return (
      <div className="EventPage">

        <Header
          title={this.user.name}
          description={this.profile.description}
          twitterHandle={this.profile.parentCollective.twitterHandle}
          image={this.profile.image || backgroundImage}
          className={this.state.status}
          LoggedInUser={this.props.LoggedInUser}
          />

        <Body>

          <div className={`EventPage ${this.state.modal && 'showModal'}`}>

            <NotificationBar status={this.state.status} error={this.state.error} />

            {this.state.view === 'default' &&
              <CollectiveCover
                href={`/${this.profile.parentCollective.slug}`}
                logo={this.profile.image}
                title={this.profile.name}
                backgroundImage={backgroundImage}
                />
            }

            <ActionBar
              actions={this.state.actions}
              info={info}
              />

            <div>
              <div className="content" >
                <div className="eventDescription" >
                  <Markdown source={this.profile.description} />
                </div>

                <div id="collectives">
                  <style jsx>{`
                    #collectives :global(.tier) {
                      margin: 4rem auto;
                    }
                  `}</style>
                  {this.user.collectives.map((collective) =>
                    <CollectiveCard
                      key={collective.id}
                      className="collective"
                      collective={collective}
                      />
                  )}
                </div>
              </div>

            </div>
          </div>
        </Body>
        <Footer />
        </div>
    )
  }
}

export default addCreateResponseMutation(Profile);
