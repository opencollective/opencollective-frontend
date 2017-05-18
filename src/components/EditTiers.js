import React from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';
import { defineMessages, injectIntl, FormattedDate, FormattedMessage } from 'react-intl';

import InputField from '../components/InputField';
import colors from '../constants/colors';
import Button from '../components/Button';

class EditTiers extends React.Component {

  static propTypes = {
    tiers: PropTypes.arrayOf(PropTypes.object),
    onChange: PropTypes.func.required
  };

  constructor(props) {
    super(props);
    this.state = { tiers: props.tiers };
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
        name: 'amount'
      }
    ];
  }

  editTier(index, fieldname, value) {
    console.log(">>> editTier", index, fieldname, value);
    const tiers = this.state.tiers;
    tiers[index][fieldname] = value;
    this.setState({tiers});
    this.onChange(tiers);
  }

  addTier(tier) {
    console.log(">>> addTier", tier);
    const tiers = this.state.tiers;
    tiers.push(tier || {});
    this.setState({tiers});
  }

  removeTier(index) {
    console.log(">>> removeTier", index);
    let tiers = this.state.tiers;
    if (index < 0 || index > tiers.length) return;
    tiers = [...tiers.slice(0, index), ...tiers.slice(index+1)];
    this.setState({tiers});
    this.onChange(tiers);
  }

  renderTier(tier, index) {
    return (
      <div className="tier" key={index}>
        <div>
          <a onClick={() => this.removeTier(index)}>[remove tier]</a>
        </div>
        {this.fields.map(field => <InputField name={field.name} placeholder={field.placeholder} onChange={(value) => this.editTier(index, field.name, value)} />)}
      </div>
    );
  }

  render() {

    return (
      <div className="EditTiers">
        <style jsx>{`
        `}</style>

        <div className="tiers">
          <h2>Tickets</h2>
          {this.state.tiers.map(this.renderTier)}
        </div>
        <div>
          <a onClick={() => this.addTier({})}>[add tier]</a>
        </div>

      </div>
    );
  }

}

export default EditTiers;