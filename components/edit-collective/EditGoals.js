import React from 'react';
import PropTypes from 'prop-types';
import { get, sortBy } from 'lodash';
import { v4 as uuid } from 'uuid';
import { Form } from 'react-bootstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';

import { getCurrencySymbol } from '../../lib/utils';
import InputField from '../InputField';
import GoalsCover from '../GoalsCover';
import Container from '../Container';
import StyledButton from '../StyledButton';
import { P, H3 } from '../Text';
import StyledCheckbox from '../StyledCheckbox';
import gql from 'graphql-tag';
import { graphql } from '@apollo/react-hoc';
import Link from '../Link';
import MessageBox from '../MessageBox';

const BORDER = '1px solid #efefef';

class EditGoals extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      settings: PropTypes.object,
    }).isRequired,
    currency: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired,
    updateSettings: PropTypes.func.isRequired,
    title: PropTypes.string,
  };

  constructor(props) {
    super(props);
    const { intl, collective } = props;

    this.state = {
      goals: sortBy(get(collective.settings, 'goals', []), 'amount'),
      collectivePage: get(collective.settings, 'collectivePage', {}),
      isTouched: false,
      error: null,
      submitting: false,
      submitted: false,
    };
    this.defaultType = 'yearlyBudget';
    this.messages = defineMessages({
      add: { id: 'goal.add', defaultMessage: 'Add goal' },
      remove: { id: 'goal.remove', defaultMessage: 'Remove goal' },
      type: { id: 'goal.type.label', defaultMessage: 'Type' },
      balance: { id: 'goal.balance.label', defaultMessage: 'Balance' },
      yearlyBudget: { id: 'YearlyBudget', defaultMessage: 'Yearly budget' },
      title: { id: 'goal.title.label', defaultMessage: 'Title' },
      description: { id: 'Fields.description', defaultMessage: 'Description' },
      amount: { id: 'Fields.amount', defaultMessage: 'Amount' },
      showToggle: { id: 'goal.show', defaultMessage: 'Show the goals on my collective page' },
    });

    const getOptions = arr => {
      return arr.map(key => {
        return { [key]: intl.formatMessage(this.messages[key]) };
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
        defaultValue: 0,
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

  editGoal = (index, fieldName, value) => {
    if (value === 'onetime') {
      value = null;
    }

    this.setState(state => {
      const goal = state.goals[index];
      const updatedGoal = { ...goal, type: goal.type || this.defaultType, [fieldName]: value };
      const updatedGoals = [...state.goals];
      updatedGoals[index] = updatedGoal;
      return { isTouched: true, goals: updatedGoals };
    });
  };

  toggleGoalsOnCollectivePage = ({ checked }) => {
    this.setState(state => ({
      isTouched: true,
      collectivePage: { ...state.collectivePage, showGoals: checked },
    }));
  };

  addGoal = () => {
    const newGoal = { type: this.defaultType, key: uuid() };
    this.setState(state => ({ isTouched: true, goals: [...state.goals, newGoal] }));
  };

  removeGoal = index => {
    this.setState(state => {
      if (index < 0 || index > state.goals.length) {
        return null;
      } else {
        const updatedGoals = [...state.goals];
        updatedGoals.splice(index, 1);
        return { isTouched: true, goals: updatedGoals };
      }
    });
  };

  handleSubmit = async () => {
    try {
      this.setState({ isSubmitting: true });

      await this.props.updateSettings({
        ...this.props.collective.settings,
        goals: this.state.goals,
        collectivePage: this.state.collectivePage,
      });

      this.setState({ isSubmitting: false, isTouched: false, submitted: true });
      setTimeout(() => this.setState({ submitted: false }), 2000);
    } catch (e) {
      this.setState({ isSubmitting: false, error: e.toString() });
    }
  };

  renderGoal = (goal, index) => {
    const { intl } = this.props;

    const defaultValues = {
      ...goal,
      type: goal.type || this.defaultType,
    };

    goal.key = goal.key || uuid();

    return (
      <Container mt={4} pb={4} borderBottom={BORDER} key={`goal-${index}-${goal.key}`}>
        <div className="goalActions">
          <StyledButton onClick={() => this.removeGoal(index)}>{intl.formatMessage(this.messages.remove)}</StyledButton>
        </div>
        <Form horizontal>
          {this.fields.map(field => (
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
          ))}
        </Form>
      </Container>
    );
  };

  render() {
    const { intl, collective } = this.props;
    const { goals, collectivePage, isSubmitting, submitted, isTouched, error } = this.state;

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
              defaultChecked={Boolean(collectivePage.showGoals)}
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
          <StyledButton onClick={() => this.addGoal()}>+ {intl.formatMessage(this.messages.add)}</StyledButton>
        </Container>
        {error && (
          <MessageBox type="error" withIcon my={3}>
            {error}
          </MessageBox>
        )}
        <Flex justifyContent="center" flexWrap="wrap" mt={5}>
          <Link route="collective" params={{ slug: collective.slug }}>
            <StyledButton mx={2} minWidth={200}>
              <FormattedMessage id="ViewCollectivePage" defaultMessage="View Collective page" />
            </StyledButton>
          </Link>
          <StyledButton
            buttonStyle="primary"
            onClick={this.handleSubmit}
            loading={isSubmitting}
            disabled={submitted || !isTouched}
            mx={2}
            minWidth={200}
          >
            {submitted ? (
              <FormattedMessage id="saved" defaultMessage="Saved" />
            ) : (
              <FormattedMessage id="save" defaultMessage="Save" />
            )}
          </StyledButton>
        </Flex>
      </Container>
    );
  }
}

const addEditCollectiveSettingsMutation = graphql(
  gql`
    mutation EditCollectiveSettings($id: Int!, $settings: JSON) {
      editCollective(collective: { id: $id, settings: $settings }) {
        id
        settings
      }
    }
  `,
  {
    props: ({ ownProps, mutate }) => ({
      updateSettings: settings => mutate({ variables: { id: ownProps.collective.id, settings } }),
    }),
  },
);

export default injectIntl(addEditCollectiveSettingsMutation(EditGoals));
