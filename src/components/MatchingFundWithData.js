import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, FormControl, Col } from 'react-bootstrap';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { FormattedMessage } from 'react-intl';
import Member from './Member';
import { get } from 'lodash';
import { formatCurrency, days } from '../lib/utils';
import { getFxRate } from '../lib/api';

class MatchingFundWithData extends React.Component {

  static propTypes = {
    uuid: PropTypes.string.isRequired,
    order: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.fxrate = 1;
    this.uuid = this.props.uuid;
    this.props.onChange(this.uuid);
  }

  // Whenever this.props.order.totalAmount changes, we update the status
  async componentWillReceiveProps(newProps) {
    const { data: { loading, MatchingFund }, collective, order, uuid } = newProps;
    if (loading) return;

    // if the matching fund id doesn't return any matching fund, we notify the OrderForm
    if (!MatchingFund && this.uuid) {
      this.uuid = null;
      this.props.onChange(null);
      return;
    }

    if (order.totalAmount === this.props.order.totalAmount) return;
    const currency = get(MatchingFund, 'currency');
    if (currency && currency !== collective.currency) {
      this.fxrate = await getFxRate(collective.currency, currency);
    }
    const amounts = this.computeAmounts(order.totalAmount, MatchingFund);
    if (!amounts.enough) {
      console.error("Not enough fund in matching fund, balance: ", formatCurrency(MatchingFund.balance, MatchingFund.currency), "matching: ", formatCurrency(amounts.totalAmountInMatchingFundCurrency, MatchingFund.currency));
      this.props.onChange(null);
    } else {
      this.props.onChange(uuid);
    }
  }

  computeAmounts(orderTotalAmount, matchingFund) {
    const totalAmount = orderTotalAmount * matchingFund.matching;
    return {
      totalAmount,
      totalAmountInMatchingFundCurrency: totalAmount * this.fxrate,
      enough: totalAmount * this.fxrate < matchingFund.balance
    }
  }

  render() {
    const { collective, order, data: { loading, MatchingFund } } = this.props;

    if (loading) return (<div />);
    if (!MatchingFund) return (<div />);

    const currency = collective.currency;
    const amounts = this.computeAmounts(order.totalAmount, MatchingFund);
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
          <Col componentClass={ControlLabel} sm={2}>
            <ControlLabel><FormattedMessage id="order.matchingfund.label" defaultMessage="Matching fund" /></ControlLabel>
          </Col>
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
