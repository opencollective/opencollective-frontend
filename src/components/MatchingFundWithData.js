import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Col } from 'react-bootstrap';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { FormattedMessage } from 'react-intl';
import Member from './Member';
import { get } from 'lodash';
import { formatCurrency, days } from '../lib/utils';
import { getFxRate } from '../lib/api';

function computeAmounts(orderTotalAmount, matchingFund, fxrate) {
  const totalAmount = orderTotalAmount * matchingFund.matching;
  return {
    totalAmount,
    totalAmountInMatchingFundCurrency: totalAmount * fxrate,
    enough: totalAmount * fxrate < matchingFund.balance
  }
}

class MatchingFundWithData extends React.Component {

  static propTypes = {
    uuid: PropTypes.string.isRequired,
    order: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
    props.onChange(props.uuid);
    this.state = {
      fxrate: 1,
      uuid: props.uuid,
      totalAmount: get(props, 'order.totalAmount')
    };
    console.log(">>> MatchingFundWithData props", props);
  }

  static async getDerivedStateFromProps(props, state) {
    const { data: { loading, MatchingFund }, collective, order } = props;
    if (loading) {
      return state;
    }

    // if the matching fund id doesn't return any matching fund, we notify the OrderForm
    if (!MatchingFund && state.uuid) {
      state.uuid = null;
      return state;
    }

    // if order.totalAmount hasn't changed, we stop here
    if (get(props, 'order.totalAmount') === state.totalAmount) return;

    state.totalAmount = get(props, 'order.totalAmount');

    const currency = get(MatchingFund, 'currency');
    if (currency && currency !== collective.currency) {
      state.fxrate = await getFxRate(collective.currency, currency);
    }
    const amounts = computeAmounts(order.totalAmount, MatchingFund, state.fxrate);
    console.log(">>> getDerivedStateFromProps", amounts);
    console.log(">>> state", state);
    if (!amounts.enough) {
      const error = `Not enough fund in matching fund, balance: ${formatCurrency(MatchingFund.balance, MatchingFund.currency)} matching: ${formatCurrency(amounts.totalAmountInMatchingFundCurrency, MatchingFund.currency)}`;
      state.error = error;
      console.error(error);
    }
    return state;

  }

  render() {
    const { collective, order, data: { loading, MatchingFund } } = this.props;
    if (loading) return (<div />);
    if (!MatchingFund) return (<div />);

    const currency = collective.currency;
    const amounts = computeAmounts(order.totalAmount, MatchingFund, this.state.fxrate);

    const member = {
      createdAt: MatchingFund.collective.createdAt,
      member: MatchingFund.collective,
      role: "BACKER"
    }
    return (
      <FormGroup className="MatchingFundWithData">
        <style jsx>{`
          .main {
            max-width: 50rem;
          }
          .amount {
            font-size: 4rem;
            text-align: center;
          }
          .description {
            font-size: 1.4rem;
            margin-bottom: 1rem;
          }
          .disclaimer {
            font-size: 1.2rem;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-around;
          }
          .info {
          }
          .expiryDate {
            margin-left: 0.5rem;
          }
          .error, .expiryDate {
            color: red;
          }
          .MatcherCard {
            float: right;
            margin: 0 1rem;
          }
        `}</style>
        <div>
          <Col sm={10}>
            <div className="main">
              <div className="MatcherCard">
                <Member member={member} />
              </div>
              <div className="info">
                <div className="amount">{`+${formatCurrency(amounts.totalAmount, currency, { precision: 0 })}`}</div>
                <div className="description">{MatchingFund.description}</div>
                <div className="disclaimer">
                  <span><FormattedMessage id="order.matchingfund.text" defaultMessage="{name} has set up a {initialBalance} matching fund to match {factor, select, 1 {} other {{factor} times}} your first donation to {collective}. There is {balance} left in this fund." values={{ initialBalance: formatCurrency(MatchingFund.initialBalance, MatchingFund.currency, { precision: 0 }), balance: formatCurrency(MatchingFund.balance, MatchingFund.currency, { precision: 0 }), name: MatchingFund.collective.name, collective: collective.name, factor: MatchingFund.matching }} /></span>
                  { MatchingFund.expiryDate &&
                  <span className="expiryDate"><FormattedMessage id="order.matchingFund.expire" defaultMessage="This matching fund expires in {n, plural, one {one day} other {{n} days}}." values={{n: days(MatchingFund.expiryDate)}} /></span>
                    }
                  { !amounts.enough &&
                  <div className="error">
                    <FormattedMessage id="order.matchingfund.notEnoughFund" defaultMessage="There isn't enough fund left in this matching fund." values={{ balance: formatCurrency(MatchingFund.balance, MatchingFund.currency)}} />
                  </div>
                    }
                </div>
              </div>
            </div>
          </Col>
        </div>
      </FormGroup>
    );
  }

}


const getMatchingFundQuery = gql`
query MatchingFund($uuid: String!, $ForCollectiveId: Int) {
  MatchingFund(uuid: $uuid, ForCollectiveId: $ForCollectiveId) {
    id
    description
    matching
    initialBalance
    expiryDate
    balance
    currency
    collective {
      id
      type
      createdAt
      description
      company
      slug
      name
      image
    }
  }
}
`;

const addMatchingFundData = graphql(getMatchingFundQuery, {
  options(props) {
    return {
      variables: {
        uuid: props.uuid,
        ForCollectiveId: get(props, 'collective.id')
      }
    }
  }
});


export default addMatchingFundData(MatchingFundWithData);
