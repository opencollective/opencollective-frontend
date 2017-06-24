import React from 'react';
import PropTypes from 'prop-types';
import { addEventsData } from '../graphql/queries';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

class EventTemplatePicker extends React.Component {

  static propTypes = {
    collectiveSlug: PropTypes.string,
    onChange: PropTypes.func
  }

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  constructor(props) {
    super(props);
    this.state = { event: {}, result: {} };
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
    
  }

  handleTemplateChange(e) {
    const eventId = Number(e.target.value);
    const template = eventId ? this.props.data.allEvents.find(event => event.id === eventId) : {};
    console.log(">>> handleTemplateChange", eventId, template, this.props.data.allEvents);
    this.props.onChange(Object.assign({}, template));
  }

  renderEventEntry(event) {
    return (<option key={event.id} value={event.id}>{event.name}</option>);    
  }

  render() {
    const { loading, allEvents } = this.props.data;

    if (loading) return (<div />);

    return (
      <FormGroup className="EventTemplatePicker">
        <ControlLabel>{this.props.label}</ControlLabel>
        <FormControl name="template" componentClass="select" placeholder="select" onChange={this.handleTemplateChange}>
          <option value="">No template</option>
          {allEvents.map(this.renderEventEntry)}
        </FormControl>
      </FormGroup>
    );
  }

}

export default addEventsData(EventTemplatePicker);