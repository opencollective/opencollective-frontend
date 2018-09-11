import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages } from 'react-intl';
import { get, maxBy } from 'lodash';
import withIntl from '../lib/withIntl';
import { formatCurrency } from '../lib/utils';

class GoalsCover extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.renderGoal = this.renderGoal.bind(this);
    this.nodes = {};
    this.state = {
      goals: {},
      styles: {
        balance: { textAlign: 'left', left: 0 },
        yearlyBudget: { textAlign: 'right', right: 0 },
      },
    };

    this.messages = defineMessages({
      admin: { id: 'menu.admin', defaultMessage: 'admin' },
      backer: { id: 'menu.backer', defaultMessage: 'backer' },
      attendee: { id: 'menu.attendee', defaultMessage: 'attendee' },
      fundraiser: { id: 'menu.fundraiser', defaultMessage: 'fundraiser' },
      parenting: { id: 'menu.parenting', defaultMessage: 'member collectives' },
      about: { id: 'menu.about', defaultMessage: 'about' },
      events: { id: 'menu.events', defaultMessage: 'events' },
      updates: { id: 'menu.updates', defaultMessage: 'updates' },
      budget: { id: 'menu.budget', defaultMessage: 'budget' },
      contributors: { id: 'menu.contributors', defaultMessage: 'contributors' },
      'menu.edit.collective': {
        id: 'menu.edit.collective',
        defaultMessage: 'edit collective',
      },
      'menu.edit.user': {
        id: 'menu.edit.user',
        defaultMessage: 'edit profile',
      },
      'menu.edit.organization': {
        id: 'menu.edit.organization',
        defaultMessage: 'edit organization',
      },
      'menu.edit.event': {
        id: 'menu.edit.event',
        defaultMessage: 'edit event',
      },
      'bar.balance': {
        id: 'cover.bar.balance',
        defaultMessage: "Today's Balance",
      },
      'bar.yearlyBudget': {
        id: 'cover.bar.yearlyBudget',
        defaultMessage: 'Estimated Annual Budget',
      },
    });
  }

  populateGoals() {
    const { intl, collective } = this.props;
    const state = this.state;
    const previous = {};

    this.goals = [
      {
        slug: 'balance',
        animate: true,
        title: intl.formatMessage(this.messages['bar.balance']),
        amount: get(collective, 'stats.balance'),
        precision: 2,
        position: 'below',
      },
    ];

    if (
      get(collective, 'stats.yearlyBudget') > 0 &&
      get(collective, 'stats.yearlyBudget') !== get(collective, 'stats.balance')
    ) {
      this.goals.push({
        slug: 'yearlyBudget',
        title: intl.formatMessage(this.messages['bar.yearlyBudget']),
        amount: get(collective, 'stats.yearlyBudget'),
        precision: 0,
        position: 'below',
      });
    }

    (get(collective, 'settings.goals') || []).map(g => this.goals.push(g));

    this.goals.sort((a, b) => a.amount > b.amount);

    const lastGoalAtPosition = {};
    for (let i = 0; i < this.goals.length; i++) {
      const goal = { ...this.goals[i] };
      goal.slug = goal.slug || `goal${i}`;
      goal.position = goal.position || 'above';
      lastGoalAtPosition[goal.position] = goal;
      goal.style = {
        textAlign: lastGoalAtPosition[goal.position] ? 'right' : 'left',
      };
      this.goals[i] = goal;
    }
    this.maxAmount = maxBy(this.goals, g => g.amount).amount;

    this.goals.forEach(goal => {
      const pos = { level: 0, amount: goal.amount };
      const { slug, position } = goal;
      if (this.nodes[slug]) {
        pos.posX = this.nodes[slug].offsetWidth;
        pos.width = this.nodes[slug].querySelector('.label').offsetWidth;
        pos.height = '20px';
      }
      // if the previous item's position is overlapping, we change the level
      if (
        previous[position] &&
        pos.posX < previous[position].posX + previous[position].width
      ) {
        pos.level = previous[position].level === 1 ? 0 : 1;

        // Make sure we don't overlap with previous goal on the same level (previous' previous)
        if (previous[position].previous) {
          const overlap =
            previous[position].previous.posX - pos.posX + pos.width;
          if (overlap > 0) {
            pos.opacity = 0.2;
            pos.posX = pos.posX + overlap;
          }
        }

        if (position === 'above' && pos.level === 1) {
          pos.height = '60px';
          state.styles.barContainer = { marginTop: '10rem' };
        }
      }
      if (goal.animate && this.nodes.barContainer) {
        const barLength = this.nodes.barContainer.offsetWidth;
        const width = Math.ceil((goal.amount / this.maxAmount) * barLength);
        pos.posX = width;
      }
      pos.slug = slug;
      pos.previous = previous[position];
      state.goals[slug] = pos;
      previous[position] = pos;
    });
    return state;
  }

  renderGoal(goal, index, state) {
    if (!goal.title) return;
    const { collective } = this.props;
    const posX = goal.animate
      ? 0
      : `${Math.round((goal.amount / this.maxAmount) * 100)}%`;
    const slug = goal.slug || `goal${index}`;
    const zIndex = (20 - index) * 10;
    const amount = formatCurrency(
      goal.animate ? get(state, `goals.${slug}.amount`) || 0 : goal.amount,
      collective.currency,
      { precision: goal.precision || 0 },
    );
    const position = goal.position || 'above';
    const level = get(state, `goals.${slug}.level`) || 0;
    const style = {
      width: get(state, `goals.${slug}.posX`) || posX,
      opacity: get(state, `goals.${slug}.opacity`) || 1,
      zIndex,
    };

    if (position === 'below' && level === 1) {
      style.paddingTop = '4rem';
      style.height = '60px';
    }

    return (
      <div
        key={slug}
        className={`goal bar ${slug} ${position}`}
        style={style}
        ref={node => (this.nodes[slug] = node)}
      >
        <style jsx>
          {`
            .bar {
              height: 20px;
              width: 100%;
              position: absolute;
              top: 0;
              left: 0;
              text-align: right;
              transition: width 3s;
            }

            .bar.balance {
              transition: width 2s;
              width: 150px;
              border-top: 4px solid #64c800;
              border-right: 1px solid #64c800;
            }

            .bar.yearlyBudget {
              border-top: 4px solid #3399ff;
              border-right: 1px solid #3399ff;
            }

            .bar.goal.above {
              border-bottom: 4px solid #3399ff;
              border-right: 1px solid #3399ff;
              top: auto;
              bottom: 76px;
            }

            .caption {
              padding: 1rem 0.5rem 1rem 0.5rem;
              color: #aaaeb3;
              font-size: 13px;
              line-height: 15px;
            }
            .bar.goal.above .caption {
              margin-top: -4.5rem;
            }

            .label {
              background: #252729;
              color: #aaaeb3;
              padding: 0;
              line-height: 1.5;
              font-size: 13px;
              text-align: right;
            }

            .amount {
              background: #252729;
              color: white;
              font-weight: bold;
            }

            .interval {
              color: #aaaeb3;
              font-size: 10px;
              font-weight: normal;
            }
          `}
        </style>
        <div className="caption">
          <div className="label">{goal.title}</div>
          <div className="amount">
            {amount}
            {goal.type === 'yearlyBudget' && (
              <div className="interval">
                <FormattedMessage
                  id="tier.interval"
                  defaultMessage="per {interval, select, month {month} year {year} other {}}"
                  values={{ interval: 'year' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { collective } = this.props;

    if (!collective) {
      return <div />;
    }

    const state = this.populateGoals();

    return (
      <div className="GoalsCover">
        <style jsx>
          {`
            .GoalsCover {
              overflow: hidden;
            }

            .budgetText {
              text-align: center;
              color: #c2c7cc;
              font-size: 14px;
              line-height: 26px;
              margin: 3rem 0;
            }

            .barContainer {
              position: relative;
              width: 80%;
              margin: 6rem auto 1rem;
              min-height: 80px;
            }

            .annualBudget {
              font-weight: bold;
              color: white;
              margin-left: 5px;
            }

            @media (max-width: 420px) {
              .barContainer {
                width: 95%;
              }
            }
          `}
        </style>
        <div className="">
          {get(collective, 'stats.backers.all') > 0 && (
            <div className="budgetText">
              <FormattedMessage
                id="cover.budget.text"
                defaultMessage="Thanks to your financial contributions, we are operating on an estimated annual budget of"
              />
              <span className="annualBudget">
                {formatCurrency(
                  get(collective, 'stats.yearlyBudget'),
                  collective.currency,
                  { precision: 0 },
                )}
              </span>
            </div>
          )}
          <div
            className="barContainer"
            style={get(state, 'styles.barContainer')}
            ref={node => (this.nodes.barContainer = node)}
          >
            <div className="bars">
              {this.goals &&
                this.goals.map((goal, index) =>
                  this.renderGoal(goal, index, state),
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withIntl(GoalsCover);
