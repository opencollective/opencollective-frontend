import React from 'react';
import PropTypes from 'prop-types';

import { Button, Form } from 'react-bootstrap';

import InputField from '../components/InputField';
import { getCurrencySymbol } from '../lib/utils';

class EditTiers extends React.Component {

  static propTypes = {
    tiers: PropTypes.arrayOf(PropTypes.object),
    currency: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { tiers: props.tiers || [{}] };
    this.renderTier = this.renderTier.bind(this);
    this.addTier = this.addTier.bind(this);
    this.removeTier = this.removeTier.bind(this);
    this.editTier = this.editTier.bind(this);
    this.onChange = props.onChange.bind(this);
    
    this.fields = [
      {
        name: 'name'
      },
      {
        name: 'description'
      },
      {
        name: 'amount',
        pre: getCurrencySymbol(props.currency),
        type: 'currency'
      }
    ];
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.tiers) {
      const tiers = nextProps.tiers && nextProps.tiers.map(tier => Object.assign({}, tier));
      this.setState({tiers});
    }
  }

  editTier(index, fieldname, value) {
    const tiers = this.state.tiers;
    tiers[index][fieldname] = value;
    this.setState({tiers});
    this.onChange(tiers);
  }

  addTier(tier) {
    const tiers = this.state.tiers;
    tiers.push(tier || {});
    this.setState({tiers});
  }

  removeTier(index) {
    let tiers = this.state.tiers;
    if (index < 0 || index > tiers.length) return;
    tiers = [...tiers.slice(0, index), ...tiers.slice(index+1)];
    this.setState({tiers});
    this.onChange(tiers);
  }

  renderTier(tier, index) {
    return (
      <div className="tier" key={`tier-${index}`}>
        <div className="tierActions">
          <a className="removeTier" href="#" onClick={() => this.removeTier(index)}>Remove Ticket</a>
        </div>
        <Form horizontal>
          {this.fields.map(field => <InputField
            className="horizontal"
            key={field.name}
            name={field.name}
            type={field.type}
            value={tier[field.name]}
            pre={field.pre}
            placeholder={field.placeholder}
            onChange={(value) => this.editTier(index, field.name, value)}
            />)}
        </Form>
      </div>
    );
  }

  render() {

    return (
      <div className="EditTiers">
        <style jsx>{`
          :global(.tierActions) {
            text-align: right;
            margin-right: 15px;
            margin-bottom: -5px;
            font-size: 1.3rem;
          }
          .editTiersActions {
            text-align: right;
            margin-right: 15px;
            margin-top: -20px;
          }
        `}</style>

        <div className="tiers">
          <h2>Tickets</h2>
          {this.state.tiers.map(this.renderTier)}
        </div>
        <div className="editTiersActions">
          <Button bsStyle="primary" onClick={() => this.addTier({})}>Add Another Ticket</Button>
        </div>

      </div>
    );
  }

}

export default EditTiers;