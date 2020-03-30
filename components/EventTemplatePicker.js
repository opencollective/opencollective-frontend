import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';

class EventTemplatePicker extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { collectiveSlug };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
    onChange: PropTypes.func,
    data: PropTypes.object,
    label: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = { event: {}, result: {} };
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
  }

  handleTemplateChange(e) {
    const eventId = Number(e.target.value);
    const template = eventId ? this.props.data.allEvents.find(event => event.id === eventId) : {};
    this.props.onChange(Object.assign({}, template));
  }

  renderEventEntry(event) {
    return (
      <option key={event.id} value={event.id}>
        {event.name}
      </option>
    );
  }

  render() {
    const { loading, allEvents } = this.props.data;

    if (loading) {
      return <div />;
    }

    return (
      <FormGroup className="EventTemplatePicker">
        <ControlLabel>{this.props.label}</ControlLabel>
        <FormControl name="template" componentClass="select" placeholder="select" onChange={this.handleTemplateChange}>
          <option value="">Use a previous event as a template</option>
          {allEvents.map(this.renderEventEntry)}
        </FormControl>
      </FormGroup>
    );
  }
}

const getEventsQuery = gql`
  query allEvents($collectiveSlug: String) {
    allEvents(slug: $collectiveSlug) {
      id
      slug
      name
      description
      longDescription
      startsAt
      endsAt
      timezone
      location {
        name
        address
        lat
        long
      }
      tiers {
        id
        type
        name
        description
        amount
      }
      parentCollective {
        id
        slug
        name
        mission
        imageUrl
        backgroundImage
      }
    }
  }
`;

const addEventsData = graphql(getEventsQuery);

export default addEventsData(EventTemplatePicker);
