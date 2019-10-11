import React from 'react';
import PropTypes from 'prop-types';
import { set, get } from 'lodash';

import { Form } from 'react-bootstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import { getCurrencySymbol } from '../lib/utils';
import InputField from './InputField';
import GoalsCover from './GoalsCover';
import Container from './Container';
import StyledButton from './StyledButton';
import { P, H3 } from './Text';
import StyledCheckbox from './StyledCheckbox';

const BORDER = '1px solid #efefef';
const GOALS_SETTINGS_PATH = 'collectivePage.showGoals';

class EditGoals extends React.Component {
  static propTypes = {
    goals: PropTypes.arrayOf(PropTypes.object),
    collective: PropTypes.shape({
      settings: PropTypes.object,
    }).isRequired,
    currency: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    title: PropTypes.string,
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.defaultType = 'yearlyBudget';
    this.renderGoal = this.renderGoal.bind(this);
    this.addGoal = this.addGoal.bind(this);
    this.removeGoal = this.removeGoal.bind(this);
    this.editGoal = this.editGoal.bind(this);
    this.onChange = props.onChange.bind(this);

    this.messages = defineMessages({
      add: { id: 'goal.add', defaultMessage: 'Add goal' },
      remove: { id: 'goal.remove', defaultMessage: 'Remove goal' },
      type: { id: 'goal.type.label', defaultMessage: 'Type' },
      balance: { id: 'goal.balance.label', defaultMessage: 'Balance' },
      yearlyBudget: { id: 'YearlyBudget', defaultMessage: 'Yearly budget' },
      title: { id: 'goal.title.label', defaultMessage: 'Title' },
      description: { id: 'goal.description.label', defaultMessage: 'Description' },
      amount: { id: 'goal.amount.label', defaultMessage: 'Amount' },
      showToggle: { id: 'goal.show', defaultMessage: 'Show the goals on my collective page' },
    });

    const getOptions = arr => {
      return arr.map(key => {
        const obj = {};
        obj[key] = intl.formatMessage(this.messages[key]);
        return obj;
      });
    };

    this.fields = [
      {
        name: 'type',
        type: 'select',
        options: getOptions(['balance', 'yearlyBudget']),
        label: intl.formatMessage(this.messages.type),
      },
      {
        name: 'amount',
        pre: getCurrencySymbol(props.currency),
        type: 'currency',
        label: intl.formatMessage(this.messages.amount),
      },
      {
        name: 'title',
        label: intl.formatMessage(this.messages.title),
        maxLength: 64,
      },
      {
        name: 'description',
        type: 'textarea',
        label: intl.formatMessage(this.messages.description),
      },
    ];
  }

  editGoal(index, fieldName, value) {
    const goals = [...this.props.goals];

    if (value === 'onetime') {
      value = null;
    }

    goals[index] = {
      ...goals[index],
      type: goals[index]['type'] || this.defaultType,
      [fieldName]: value,
    };

    this.onChange({ goals });
  }

  toggleGoalsOnCollectivePage = ({ checked }) => {
    const settings = set({ ...this.props.collective.settings }, GOALS_SETTINGS_PATH, checked);
    this.onChange({ settings });
  };

  addGoal() {
    this.onChange({ goals: [...this.props.goals, {}] });
  }

  removeGoal(index) {
    const goals = this.props.goals;
    if (index < 0 || index > goals.length) return;
    goals.splice(index, 1);
    this.onChange({ goals });
  }

  renderGoal(goal, index) {
    const { intl } = this.props;

    const defaultValues = {
      ...goal,
      type: goal.type || this.defaultType,
    };

    // We need to assign a key to the goal otherwise we can't properly remove one, same issue as #996
    goal.key = goal.key || Math.round(Math.random() * 100000);

    return (
      <Container mt={4} pb={4} borderBottom={BORDER} key={`goal-${index}-${goal.key}`}>
        <div className="goalActions">
          <StyledButton onClick={() => this.removeGoal(index)}>{intl.formatMessage(this.messages.remove)}</StyledButton>
        </div>
        <Form horizontal>
          {this.fields.map(
            field =>
              (!field.when || field.when(defaultValues)) && (
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
                  onChange={value => this.editGoal(index, field.name, value)}
                />
              ),
          )}
        </Form>
      </Container>
    );
  }

  render() {
    const { intl, collective, goals } = this.props;

    return (
      <Container>
        <Container borderBottom={BORDER} mb={4} pb={4}>
          <H3>
            <FormattedMessage id="Goals" defaultMessage="Goals" />
          </H3>
          <P>
            <FormattedMessage
              id="EditGoals.Instructions"
              defaultMessage="You can define custom goals to share an overview of your financial plan with your community and to track your progress. They will be sent in the emails sent to your contributors. You can choose to display them on your collective page by checking the box below."
            />
          </P>
          <Container>
            <StyledCheckbox
              name="show-on-collective-page"
              label={intl.formatMessage(this.messages.showToggle)}
              onChange={this.toggleGoalsOnCollectivePage}
              defaultChecked={get(collective.settings, GOALS_SETTINGS_PATH)}
            />
          </Container>
        </Container>
        <Container textAlign="right">
          <Container background="rgb(245, 247, 250)" pt={5} pb={40}>
            <GoalsCover collective={{ ...collective, settings: { goals } }} />
          </Container>
          <Container borderTop={BORDER}>{goals.map(this.renderGoal)}</Container>
        </Container>
        <Container textAlign="center" py={4} mb={4} borderBottom={BORDER}>
          <StyledButton buttonStyle="primary" onClick={() => this.addGoal()}>
            {intl.formatMessage(this.messages.add)}
          </StyledButton>
        </Container>
      </Container>
    );
  }
}

export default injectIntl(EditGoals);
