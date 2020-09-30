import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get, sortBy } from 'lodash';
import { Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import Container from '../../Container';
import GoalsCover from '../../GoalsCover';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledCheckbox from '../../StyledCheckbox';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import StyledInputGroup from '../../StyledInputGroup';
import StyledSelect from '../../StyledSelect';
import StyledTextarea from '../../StyledTextarea';
import { H3, P } from '../../Text';

const BORDER = '1px solid #efefef';

class CollectiveGoals extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      settings: PropTypes.object,
    }).isRequired,
    currency: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired,
    editCollectiveSettings: PropTypes.func.isRequired,
    title: PropTypes.string,
  };

  constructor(props) {
    super(props);
    const { intl, collective } = props;

    this.state = {
      collectivePage: get(collective.settings, 'collectivePage', {}),
      isTouched: false,
      error: null,
      submitting: false,
      submitted: false,
      goals: sortBy(get(collective.settings, 'goals', []), 'amount').map(goal => ({
        ...goal,
        key: goal.key || uuid(),
      })),
    };
    this.defaultType = 'yearlyBudget';
    this.messages = defineMessages({
      add: { id: 'goal.add', defaultMessage: 'Add goal' },
      remove: { id: 'Remove', defaultMessage: 'Remove' },
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
        return { value: key, label: intl.formatMessage(this.messages[key]) };
      });
    };

    this.fields = [
      {
        name: 'title',
        label: intl.formatMessage(this.messages.title),
        placeholder: 'Please add a title to your new goal',
        maxLength: 64,
      },
      {
        name: 'type',
        type: 'select',
        options: getOptions(['balance', 'yearlyBudget']),
        label: intl.formatMessage(this.messages.type),
      },
      {
        name: 'amount',
        pre: props.currency,
        type: 'currency',
        label: intl.formatMessage(this.messages.amount),
        placeholder: '0.00',
      },
      {
        name: 'description',
        type: 'textarea',
        label: intl.formatMessage(this.messages.description),
        placeholder: 'You can tell your community more details about your goal here.',
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
      await this.props.editCollectiveSettings({
        variables: {
          id: this.props.collective.id,
          settings: {
            ...this.props.collective.settings,
            goals: this.state.goals,
            collectivePage: this.state.collectivePage,
          },
        },
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

    return (
      <Container mt={4} pb={4} borderBottom={BORDER} key={`goal-${index}-${goal.key}`}>
        <Form>
          <Box mb={4}>
            <StyledInputField name={this.fields[0].name} label={this.fields[0].label}>
              <StyledInput
                width="100%"
                type="text"
                placeholder={this.fields[0].placeholder}
                onChange={event => this.editGoal(index, this.fields[0].name, event.target.value)}
                value={defaultValues[this.fields[0].name] || ''}
              />
            </StyledInputField>
          </Box>
          <Box mb={4}>
            <StyledInputField name={this.fields[1].name} label={this.fields[1].label}>
              <StyledSelect
                options={this.fields[1].options}
                onChange={obj => this.editGoal(index, this.fields[1].name, obj.value)}
                isSearchable={false}
                defaultValue={
                  goal.type && {
                    value: goal.type,
                    label: intl.formatMessage(this.messages[goal.type]),
                  }
                }
              />
            </StyledInputField>
          </Box>
          <Box mb={4}>
            <StyledInputField name={this.fields[2].name} label={this.fields[2].label}>
              <StyledInputGroup
                prepend={this.fields[2].pre}
                type={this.fields[2].type}
                placeholder={this.fields[2].placeholder}
                onChange={event => this.editGoal(index, this.fields[2].name, event.target.value * 100)}
                value={defaultValues[this.fields[2].name] / 100 || ''}
              />
            </StyledInputField>
          </Box>
          <Box mb={4}>
            <StyledInputField name={this.fields[3].name} label={this.fields[3].label}>
              <StyledTextarea
                placeholder={this.fields[3].placeholder}
                onChange={event => this.editGoal(index, this.fields[3].name, event.target.value)}
                value={defaultValues[this.fields[3].name] || ''}
                width="100%"
              />
            </StyledInputField>
          </Box>
        </Form>
        <Container className="goalActions" textAlign="right">
          <StyledButton isBorderless={true} buttonStyle="dangerSecondary" onClick={() => this.removeGoal(index)}>
            {intl.formatMessage(this.messages.remove)}
          </StyledButton>
        </Container>
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
        <Container textAlign="left">
          <Container background="rgb(245, 247, 250)" pt={5} pb={40}>
            <GoalsCover collective={{ ...collective, settings: { goals } }} />
          </Container>
          <Container borderTop={BORDER}>{goals.map(this.renderGoal)}</Container>
        </Container>
        <Container textAlign="center" py={4} mb={4} borderBottom={BORDER}>
          <StyledButton width="100%" color="#297EFF" borderColor="#297EFF" onClick={() => this.addGoal()}>
            {intl.formatMessage(this.messages.add)} +
          </StyledButton>
        </Container>
        {error && (
          <MessageBox type="error" withIcon my={3}>
            {error}
          </MessageBox>
        )}
        <Flex justifyContent="center" flexWrap="wrap" mt={5}>
          <Link route="collective" params={{ slug: collective.slug }}>
            <StyledButton mx={2} minWidth={200}>
              <FormattedMessage id="ViewCollectivePage" defaultMessage="View Profile page" />
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

const editCollectiveSettingsMutation = gql`
  mutation EditCollectiveSettings($id: Int!, $settings: JSON) {
    editCollective(collective: { id: $id, settings: $settings }) {
      id
      settings
    }
  }
`;

const addEditCollectiveSettingsMutation = graphql(editCollectiveSettingsMutation, {
  name: 'editCollectiveSettings',
});

export default injectIntl(addEditCollectiveSettingsMutation(CollectiveGoals));
