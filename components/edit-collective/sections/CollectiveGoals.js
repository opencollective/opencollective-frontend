import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { cloneDeep, get, sortBy, startCase } from 'lodash';
import { Plus, Trash } from 'lucide-react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import { editCollectiveSettingsMutation } from '../../../lib/graphql/v1/mutations';

import { Sections } from '../../collective-page/_constants';
import Container from '../../Container';
import GoalsCover from '../../GoalsCover';
import { Box } from '../../Grid';
import Link from '../../Link';
import MessageBox from '../../MessageBox';
import StyledCheckbox from '../../StyledCheckbox';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import StyledInputGroup from '../../StyledInputGroup';
import StyledSelect from '../../StyledSelect';
import StyledTextarea from '../../StyledTextarea';
import { Button } from '../../ui/Button';
import SettingsSubtitle from '../SettingsSubtitle';

const BORDER = '1px solid #efefef';
const getInterpolationOption = value => ({ label: startCase(value), value });
const INTERPOLATION_OPTIONS = ['auto', 'logarithm', 'linear'].map(getInterpolationOption);
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
      goalsInterpolation: get(collective.settings, 'goalsInterpolation', 'auto'),
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
      balance: { id: 'Balance', defaultMessage: 'Balance' },
      monthlyBudget: { id: 'MonthlyBudget', defaultMessage: 'Monthly budget' },
      yearlyBudget: { id: 'YearlyBudget', defaultMessage: 'Yearly budget' },
      title: { id: 'Title', defaultMessage: 'Title' },
      description: { id: 'Fields.description', defaultMessage: 'Description' },
      amount: { id: 'Fields.amount', defaultMessage: 'Amount' },
      showToggle: { id: 'goal.show', defaultMessage: 'Show goals on my Profile page' },
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
        options: getOptions(['balance', 'monthlyBudget', 'yearlyBudget']),
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
        placeholder: 'Tell your community about your goal.',
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
      collectivePage: {
        ...state.collectivePage,
        showGoals: checked,
        sections: this.getCollectivePageSections(state.collectivePage?.sections, checked),
      },
    }));
  };

  getCollectivePageSections = (baseSections, checked) => {
    const sections = cloneDeep([...(baseSections || [])]);
    const goalsSection = sections.find(({ name }) => name === Sections.GOALS);
    if (goalsSection) {
      goalsSection.isEnabled = checked;
    } else {
      sections.push({ type: 'SECTION', name: Sections.GOALS, isEnabled: checked });
    }

    return sections;
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
            goalsInterpolation: this.state.goalsInterpolation,
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
        <form className="flex flex-col gap-2">
          <Box>
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
          <Box>
            <StyledInputField name={this.fields[1].name} label={this.fields[1].label}>
              <StyledSelect
                inputId={`collective-goals-${this.fields[1].name}`}
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
          <Box>
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
          <Box>
            <StyledInputField name={this.fields[3].name} label={this.fields[3].label}>
              <StyledTextarea
                placeholder={this.fields[3].placeholder}
                onChange={event => this.editGoal(index, this.fields[3].name, event.target.value)}
                value={defaultValues[this.fields[3].name] || ''}
                width="100%"
              />
            </StyledInputField>
          </Box>
        </form>
        <Container className="goalActions mt-4" textAlign="right">
          <Button variant="outlineDestructive" size="sm" onClick={() => this.removeGoal(index)}>
            <Trash size={16} />
            {intl.formatMessage(this.messages.remove)}
          </Button>
        </Container>
      </Container>
    );
  };

  render() {
    const { intl, collective } = this.props;
    const { goals, goalsInterpolation, collectivePage, isSubmitting, submitted, isTouched, error } = this.state;

    return (
      <Container>
        <Container borderBottom={BORDER} mb={4} pb={4}>
          <SettingsSubtitle>
            <FormattedMessage
              id="EditGoals.Instructions"
              defaultMessage="You can define custom goals to motivate contributors and track your progress. Goals appear in automated email notifications to your contributors. You can also choose to display them on your Collective by ticking the box below."
            />
          </SettingsSubtitle>
          <Container mt={4}>
            <StyledCheckbox
              name="show-on-collective-page"
              label={intl.formatMessage(this.messages.showToggle)}
              onChange={this.toggleGoalsOnCollectivePage}
              defaultChecked={Boolean(collectivePage.showGoals)}
            />
          </Container>
        </Container>
        <Box mb={3}>
          <StyledSelect
            options={INTERPOLATION_OPTIONS}
            onChange={({ value }) => this.setState({ goalsInterpolation: value, isTouched: true })}
            value={getInterpolationOption(goalsInterpolation)}
            isSearchable={false}
          />
        </Box>
        <Container textAlign="left">
          <Container background="rgb(245, 247, 250)" pt={5} pb={40} px={3}>
            <GoalsCover collective={{ ...collective, settings: { goals } }} interpolation={goalsInterpolation} />
          </Container>
          <Container borderTop={BORDER}>{goals.map(this.renderGoal)}</Container>
        </Container>
        <Container textAlign="center" py={4} mb={4} borderBottom={BORDER}>
          <Button className="w-full" onClick={() => this.addGoal()}>
            <Plus size={16} /> {intl.formatMessage(this.messages.add)}
          </Button>
        </Container>
        {error && (
          <MessageBox type="error" withIcon my={3}>
            {error}
          </MessageBox>
        )}

        <div className="flex flex-col gap-2 sm:justify-stretch">
          <Button onClick={this.handleSubmit} loading={isSubmitting} disabled={submitted || !isTouched} minWidth={200}>
            {submitted ? (
              <FormattedMessage id="saved" defaultMessage="Saved" />
            ) : (
              <FormattedMessage id="save" defaultMessage="Save" />
            )}
          </Button>
          <Button className="grow" variant="link" asChild>
            <Link href={`/${collective.slug}`}>
              <FormattedMessage id="ViewPublicProfile" defaultMessage="View Public Profile" />
            </Link>
          </Button>
        </div>
      </Container>
    );
  }
}

const addEditCollectiveSettingsMutation = graphql(editCollectiveSettingsMutation, {
  name: 'editCollectiveSettings',
});

export default injectIntl(addEditCollectiveSettingsMutation(CollectiveGoals));
