import React from 'react';
import PropTypes from 'prop-types';

import { Button, Form } from 'react-bootstrap';
import { defineMessages, injectIntl } from 'react-intl';

import InputField from '../components/InputField';
import { getCurrencySymbol } from '../lib/utils';

class EditGoals extends React.Component {

  static propTypes = {
    goals: PropTypes.arrayOf(PropTypes.object),
    collective: PropTypes.object,
    currency: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.defaultType = 'yearlyBudget';
    this.state = { goals: [...props.goals || {}] };
    this.renderGoal = this.renderGoal.bind(this);
    this.addGoal = this.addGoal.bind(this);
    this.removeGoal = this.removeGoal.bind(this);
    this.editGoal = this.editGoal.bind(this);
    this.onChange = props.onChange.bind(this);

    this.messages = defineMessages({
      'goal.add': { id: 'goal.add', defaultMessage: 'add goal' },
      'goal.remove': { id: 'goal.remove', defaultMessage: 'remove goal' },
      'type.label': { id: 'goal.type.label', defaultMessage: 'type' },
      'balance': { id: 'goal.balance.label', defaultMessage: 'balance' },
      'yearlyBudget': { id: 'goal.yearlyBudget.label', defaultMessage: 'yearly budget' },
      'title.label': { id: 'goal.title.label', defaultMessage: 'title' },
      'description.label': { id: 'goal.description.label', defaultMessage: 'description' },
      'amount.label': { id: 'goal.amount.label', defaultMessage: 'amount' }
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
        options: getOptions(['balance', 'yearlyBudget']),
        label: intl.formatMessage(this.messages['type.label'])
      },
      {
        name: 'amount',
        pre: getCurrencySymbol(props.currency),
        type: 'currency',
        label: intl.formatMessage(this.messages['amount.label'])
      },
      {
        name: 'title',
        label: intl.formatMessage(this.messages['title.label']),
        maxLength: 64
      },
      {
        name: 'description',
        type: 'textarea',
        label: intl.formatMessage(this.messages['description.label'])
      }
    ];
  }

  editGoal(index, fieldname, value) {
    const goals = this.state.goals;
    if (value === 'onetime') {
      value = null;
    }
    goals[index] = { ...goals[index], type: goals[index]['type'] || this.defaultType, [fieldname]:value} ;
    this.setState({ goals });
    this.onChange({ goals });
  }

  addGoal(goal) {
    const goals = this.state.goals;
    goals.push(goal || {});
    this.setState({goals});
  }

  removeGoal(index) {
    let goals = this.state.goals;
    if (index < 0 || index > goals.length) return;
    goals = [...goals.slice(0, index), ...goals.slice(index+1)];
    this.setState({goals});
    this.onChange({goals});
  }

  renderGoal(goal, index) {
    const { intl } = this.props;

    const defaultValues = {
      ...goal,
      type: goal.type || this.defaultType
    }

    return (
      <div className={`goal ${goal.slug}`} key={`goal-${index}`}>
        <div className="goalActions">
          <a className="removeGoal" href="#" onClick={() => this.removeGoal(index)}>{intl.formatMessage(this.messages[`goal.remove`])}</a>
        </div>
        <Form horizontal>
          { this.fields.map(field => (!field.when || field.when(defaultValues)) &&
            <InputField
              className="horizontal"
              key={field.name}
              name={field.name}
              label={field.label}
              component={field.component}
              description={field.description}
              maxLength={field.maxLength}
              type={field.type}
              defaultValue={defaultValues[field.name] || field.defaultValue}
              options={field.options}
              pre={field.pre}
              placeholder={field.placeholder}
              onChange={(value) => this.editGoal(index, field.name, value)}
              />
            )
          }
        </Form>
      </div>
    );
  }

  render() {
    const { intl } = this.props;

    return (
      <div className="EditGoals">
        <style jsx>{`
          :global(.goalActions) {
            text-align: right;
            font-size: 1.3rem;
          }
          :global(.field) {
            margin: 1rem;
          }
          .editGoalsActions {
            text-align: right;
            margin-top: -10px;
          }
          :global(.goal) {
            margin: 3rem 0;
          }
        `}</style>

        <div className="goals">
          <h2>{this.props.title}</h2>
          {this.state.goals.map(this.renderGoal)}
        </div>
        <div className="editGoalsActions">
          <Button className="addGoal" bsStyle="primary" onClick={() => this.addGoal({})}>{intl.formatMessage(this.messages[`goal.add`])}</Button>
        </div>

      </div>
    );
  }

}

export default injectIntl(EditGoals);
