import React from 'react'
import { Link } from 'react-router'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { css } from 'glamor';
import EventHeader from '../components/EventHeader';
import Map from '../components/Map';
import Tiers from '../components/Tiers';

const styles = {
  EventPage: css({
    '& a': {
      textDecoration: 'none'
    }
  }),
  content: css({
    maxWidth: 960,
    margin: '0 auto'
  }),
  description: css({
    margin: '1rem'
  }),
  map: css({
    border: '1px solid #eee',
    height: '300px'
  })
};

class EventPage extends React.Component {

  static propTypes = {
    data: React.PropTypes.object,
  }

  render () {
    
    const { Event } = this.props.data;

    console.log("Event", Event);

    if (this.props.data.loading) {
      return (<div>Loading</div>)
    }
    return (
      <div className={styles.EventPage}>

        <EventHeader logo={Event.collective.logo} title={Event.name} backgroundImage={Event.backgroundImage || Event.collective.backgroundImage} />

        <div className={styles.content} >
          <div className={styles.description} >
            {Event.description}
          </div>

          <Tiers event={Event} tiers={Event.tiers} />

        </div>

        <div className={styles.map}>
          <Map lat={Event.lat} lng={Event.lng} className={styles.map} />
        </div>
      </div>
    )
  }
}

const FeedQuery = gql`query Event {
  Event(id:"ciwidswi31qwy0145gdniopt8") {
    id,
    name,
    description,
    lat,
    lng,
    backgroundImage,
    tiers {
      id,
      name,
      description,
      amount,
      currency,
      maxQuantity
    },
    collective {
      id,
      slug,
      name,
      mission,
      backgroundImage,
      logo
    }
  }
}`

const EventPageWithData = graphql(FeedQuery)(EventPage)

export default EventPageWithData
