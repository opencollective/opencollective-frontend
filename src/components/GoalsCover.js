import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import HashLink from 'react-scrollchor';
import Logo from './Logo';
import { FormattedMessage, defineMessages } from 'react-intl';
import Link from './Link';
import Button from './Button';
import { get, maxBy } from 'lodash';
import withIntl from '../lib/withIntl';
import { formatCurrency } from '../lib/utils';

class GoalsCover extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    const { intl, collective } = props;
    this.renderGoal = this.renderGoal.bind(this);
    this.nodes = {};
    this.state = {
      styles: {
        balance: { textAlign: 'left', left: 0 },
        yearlyBudget: { textAlign: 'right', right: 0 }
      }
    };

    this.messages = defineMessages({
      'admin': { id: 'menu.admin', defaultMessage: "admin" },
      'backer': { id: 'menu.backer', defaultMessage: "backer" },
      'attendee': { id: 'menu.attendee', defaultMessage: "attendee" },
      'fundraiser': { id: 'menu.fundraiser', defaultMessage: "fundraiser" },
      'parenting': { id: 'menu.parenting', defaultMessage: "member collectives" },
      'about': { id: 'menu.about', defaultMessage: "about" },
      'events': { id: 'menu.events', defaultMessage: "events" },
      'updates': { id: 'menu.updates', defaultMessage: "updates" },
      'budget': { id: 'menu.budget', defaultMessage: "budget" },
      'contributors': { id: 'menu.contributors', defaultMessage: "contributors" },
      'menu.edit.collective': { id: 'menu.edit.collective', defaultMessage: "edit collective" },
      'menu.edit.user': { id: 'menu.edit.user', defaultMessage: "edit profile" },
      'menu.edit.organization': { id: 'menu.edit.organization', defaultMessage: "edit organization" },
      'menu.edit.event': { id: 'menu.edit.event', defaultMessage: "edit event" },
      'bar.balance': { id: 'cover.bar.balance', defaultMessage: "Today's Balance" },
      'bar.yearlyBudget': { id: 'cover.bar.yearlyBudget', defaultMessage: "Estimated Annual Budget" }
    });

    this.goals = [
      {
        slug: 'balance',
        animate: true,
        title: intl.formatMessage(this.messages['bar.balance']),
        amount: get(collective, 'stats.balance'),
        precision: 2
      },
      {
        slug: 'yearlyBudget',
        title: intl.formatMessage(this.messages['bar.yearlyBudget']),
        amount: get(collective, 'stats.yearlyBudget'),
        precision: 0
      },
      ... get(collective, 'settings.goals') || []
    ];

    this.maxAmount = maxBy(this.goals, g => g.amount).amount;
  }

  componentDidMount() {
    const { collective } = this.props;
    const state = { goals: {} };
    this.goals.forEach(goal => {
      if (goal.animate) {
        const width = `${Math.round(goal.amount / this.maxAmount * 100)}%`;
        state.goals[goal.slug] = { width, amount: goal.amount };
      }
    });
    this.setState(state);
  }

  renderGoal(goal) {
    const { collective, intl } = this.props;
    const width = goal.animate ? 0 : `${Math.round(goal.amount / this.maxAmount * 100)}%`;
    const slug = goal.slug || "goal";
    const title = goal.title || intl.formatMessage(this.messages[goal.slug]);
    const amount = formatCurrency(goal.animate ? (get(this.state, `goals.${goal.slug}.amount`) || 0) : goal.amount, collective.currency, { precision: goal.precision || 0 });

    return (
      <div className={`bar ${slug}`} style={{width: get(this.state, `goals.${goal.slug}.width`) || width}}>
        <style jsx>{`
        .bar {
          height: 20px;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 0;
          transition: width 3s;
        }

        .bar.balance {
          transition: width 2s;
          width: 150px;
          border-top: 4px solid #64C800;
          border-right: 1px solid #64C800;
          z-index: 10;
        }

        .bar.yearlyBudget {
          border-top: 4px solid #3399FF;
          border-right: 1px solid #3399FF;
        }

        .bar.goal {
          border-bottom: 4px solid #3399FF;
          border-right: 1px solid #3399FF;
          top: -16px;
        }

        .caption {
          padding: 1rem;
          color: #AAAEB3;
          font-family: Rubik;
          font-size: 13px;
          line-height: 15px;
          text-align: right;
          transition: all 2s;
        }

        .bar.goal .caption {
          margin-top: -4.5rem;
        }

        .label {
          color: #AAAEB3;
          padding: 0;
          line-height: 1.5;
          font-size: 13px;
          text-align: right;
        }

        .amount {
          color: white;
          font-weight: bold;
        }
        .interval {
          color: #AAAEB3;
          font-size: 10px;
          font-weight: normal;
        }
        `}</style>
        <div className="caption">
          <div className="label">{goal.title}</div>
          <div className="amount">
            {amount}
            { goal.type === 'yearlyBudget' &&
              <div className="interval">
                <FormattedMessage
                  id="tier.interval"
                  defaultMessage="per {interval, select, month {month} year {year} other {}}"
                  values={{ interval: 'year' }}
                  />
              </div>
            }
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { collective, intl } = this.props;

    if (!collective) {
      return (<div />);
    }

    return (
      <div className="GoalsCover">
        <style jsx>{`
        .GoalsCover {
          overflow: hidden;
        }

        .budgetText {
          text-align: center;
          color: #C2C7CC;
          font-family: Rubik;
          font-size: 14px;
          line-height: 26px;
          margin: 3rem 0;
        }

        .barContainer {
          position: relative;
          width: 80%;
          margin: 6rem auto 1rem;
          min-height: 70px;
        }

        @media(max-width: 420px) {
          .barContainer {
            width: 95%;
          }
        }
        `}
        </style>
        <div className="">
          <div className="budgetText">
            <FormattedMessage id="cover.budget.text" defaultMessage="Thanks to their financial contributions, we’re operating on an estimated annual budget of  {yearlyBudget}." values={{ yearlyBudget: formatCurrency(get(collective, 'stats.yearlyBudget'), collective.currency, { precision: 0 })}} />
          </div>
          <div className="barContainer">
            <div className="bars">
              { this.goals.map(this.renderGoal) }
            </div>
          </div>
        </div>
      </div>
    )
  }

}

export default withIntl(GoalsCover);