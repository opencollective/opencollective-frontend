import React from 'react';
import PropTypes from 'prop-types';

import { Button, Form } from 'react-bootstrap';
import { defineMessages, injectIntl } from 'react-intl';

import InputField from '../components/InputField';
import { getCurrencySymbol } from '../lib/utils';

class EditTiers extends React.Component {

  static propTypes = {
    tiers: PropTypes.arrayOf(PropTypes.object).isRequired,
    currency: PropTypes.string.isRequired,
    defaultType: PropTypes.string,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = { tiers: [...props.tiers] || [{}] };
    this.renderTier = this.renderTier.bind(this);
    this.addTier = this.addTier.bind(this);
    this.removeTier = this.removeTier.bind(this);
    this.editTier = this.editTier.bind(this);
    this.onChange = props.onChange.bind(this);

    this.defaultType = this.props.defaultType || 'TICKET';

    this.messages = defineMessages({
      'TIER': { id: 'tier.type.tier', defaultMessage: 'tier (only one per order)' },
      'TICKET': { id: 'tier.type.ticket', defaultMessage: 'ticket (allow multiple tickets per order)' },
      'TIER.remove': { id: 'tier.type.tier.remove', defaultMessage: 'remove tier' },
      'TICKET.remove': { id: 'tier.type.ticket.remove', defaultMessage: 'remove ticket' },
      'BACKER.remove': { id: 'tier.type.backer.remove', defaultMessage: 'remove tier' },
      'SPONSOR.remove': { id: 'tier.type.sponsor.remove', defaultMessage: 'remove tier' },
      'TIER.add': { id: 'tier.type.tier.add', defaultMessage: 'add another tier' },
      'TICKET.add': { id: 'tier.type.ticket.add', defaultMessage: 'add another ticket' },
      'BACKER.add': { id: 'tier.type.backer.add', defaultMessage: 'add another tier' },
      'SPONSOR.add': { id: 'tier.type.sponsor.add', defaultMessage: 'add another tier' },
      'CUSTOM': { id: 'tier.type.custom', defaultMessage: 'custom tier' },
      'type.label': { id: 'tier.type.label', defaultMessage: 'type' },
      'name.label': { id: 'tier.name.label', defaultMessage: 'name' },
      'amount.label': { id: 'tier.amount.label', defaultMessage: 'amount' },
      'interval.label': { id: 'tier.interval.label', defaultMessage: 'interval' },
      'onetime': { id: 'tier.interval.onetime', defaultMessage: 'one time' },
      'month': { id: 'tier.interval.month', defaultMessage: 'monthly' },
      'year': { id: 'tier.interval.year', defaultMessage: 'yearly' },
      'description.label': { id: 'tier.description.label', defaultMessage: 'description' },
      'startsAt.label': { id: 'tier.startsAt.label', defaultMessage: 'start date and time' },
      'endsAt.label': { id: 'tier.endsAt.label', defaultMessage: 'Expiration' },
      'endsAt.description': { id: 'tier.endsAt.description', defaultMessage: 'Date and time until when this tier should be available' },
      'maxQuantity.label': { id: 'tier.maxQuantity.label', defaultMessage: 'Available quantity' },
      'maxQuantity.description': { id: 'tier.maxQuantity.description', defaultMessage: 'Leave it empty for unlimited' }
    });

    const getOptions = (arr) => {
      return arr.map(key => { 
        const obj = {};
        obj[key] = intl.formatMessage(this.messages[key]);
        return obj;
      })
    }

    this.fields = [
      {
        name: 'type',
        type: 'select',
        options: getOptions(['TIER', 'TICKET']),
        defaultValue: this.defaultType,
        label: intl.formatMessage(this.messages['type.label'])
      },
      {
        name: 'name',
        label: intl.formatMessage(this.messages['name.label'])
      },
      {
        name: 'description',
        type: 'textarea',
        label: intl.formatMessage(this.messages['description.label'])
      },
      {
        name: 'amount',
        pre: getCurrencySymbol(props.currency),
        type: 'currency',
        label: intl.formatMessage(this.messages['amount.label'])
      },
      {
        name: 'interval',
        type: 'select',
        options: getOptions(['onetime','month','year']),
        label: intl.formatMessage(this.messages['interval.label']),
        when: (tier) => tier.type && tier.type !== 'TICKET'
      },
      {
        name: 'maxQuantity',
        type: 'number',
        label: intl.formatMessage(this.messages['maxQuantity.label']),
        description: intl.formatMessage(this.messages['maxQuantity.description'])
      }
    ];
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.tiers) {
      console.log(">>> editTiers componentWillReceiveProps", nextProps);
      const tiers = nextProps.tiers && nextProps.tiers.map(tier => Object.assign({}, tier));
      this.setState({tiers});
    }
  }

  editTier(index, fieldname, value) {
    const tiers = this.state.tiers;
    if (value === 'onetime') {
      value = null;
    }
    console.log("editTier", index, fieldname, value);
    tiers[index] = { ...tiers[index], type: tiers[index]['type'] || this.defaultType, [fieldname]:value} ;
    this.setState({tiers});
    this.onChange({tiers});
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
    this.onChange({tiers});
  }

  renderTier(tier, index) {
    const { intl } = this.props;

    const type = tier.type || this.defaultType;
    return (
      <div className="tier" key={`tier-${index}`}>
        <div className="tierActions">
          <a className="removeTier" href="#" onClick={() => this.removeTier(index)}>{intl.formatMessage(this.messages[`${type}.remove`])}</a>
        </div>
        <Form horizontal>
          {this.fields.map(field => (!field.when || field.when(tier)) && <InputField
            className="horizontal"
            key={field.name}
            name={field.name}
            label={field.label}
            description={field.description}
            type={field.type}
            defaultValue={field.defaultValue}
            value={tier[field.name]}
            options={field.options}
            pre={field.pre}
            placeholder={field.placeholder}
            onChange={(value) => this.editTier(index, field.name, value)}
            />)}
        </Form>
      </div>
    );
  }

  render() {
    const { intl, defaultType = 'TICKET' } = this.props;

    return (
      <div className="EditTiers">
        <style jsx>{`
          :global(.tierActions) {
            text-align: right;
            font-size: 1.3rem;
          }
          :global(.field) {
            margin: 1rem;
          }
          .editTiersActions {
            text-align: right;
            margin-top: -10px;
          }
          :global(.tier) {
            margin: 3rem 0;
          }
        `}</style>

        <div className="tiers">
          <h2>{this.props.title}</h2>
          {this.state.tiers.map(this.renderTier)}
        </div>
        <div className="editTiersActions">
          <Button bsStyle="primary" onClick={() => this.addTier({})}>{intl.formatMessage(this.messages[`${defaultType}.add`])}</Button>
        </div>

      </div>
    );
  }

}

export default injectIntl(EditTiers);