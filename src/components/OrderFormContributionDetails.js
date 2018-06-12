import React from 'react';
import PropTypes from 'prop-types';
import SectionTitle from './SectionTitle';
import TierComponent from './Tier';
import MatchingFundWithData from './MatchingFundWithData';
import { defineMessages, FormattedMessage, FormattedDate, FormattedTime } from 'react-intl';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';
import { get } from 'lodash';
import InputField from './InputField';
import { Label } from './Text';
import withIntl from '../lib/withIntl';

const LabelBox = Box.extend.attrs({
  w: [1, null, 1/6],
  mb: ['10px', null, 0],
  mt: '10px'
})`
  margin-right: 10px;
  padding-right: 20px;
`;

const Row = Flex.extend.attrs({
  flexDirection: ['column', null, 'row']
})`
  margin-bottom: 10px;
`;

class OrderFormContributionDetails extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    order: PropTypes.object.isRequired,
    matchingFund: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = { form: {} };
    this.messages = defineMessages({
      'order.publicMessage.placeholder': { id: 'order.publicMessage.placeholder', defaultMessage: 'Use this space to add a personal message (public)' }
    });
  }

  handleChange(attr, val) {
    const { form } = this.state;
    form[attr] = val;
    this.setState({ form });
    this.props.onChange(form);
  }

  render() {
    const { collective, order, matchingFund, intl } = this.props;

    return (
      <section className="order">
        { order.tier.type !== 'TICKET' && <SectionTitle section="contributionDetails" /> }
        { order.tier.type === 'TICKET' &&
          <div>
            <SectionTitle section="ticketDetails" />
            <Row>
              <LabelBox w={[1, null, 1/6]} mr={30}>
                <label className="control-label">
                  <FormattedMessage id="tier.order.ticket.info" defaultMessage="Event info" />
                </label>
              </LabelBox>
              <Box w={[1, null, 5/6]}>
                {!collective.startsAt &&
                  console.warn(`OrderForm: collective.startsAt should not be empty. collective.id: ${collective.id}`)
                }
                {collective.startsAt &&
                  <React.Fragment>
                    <FormattedDate value={collective.startsAt} weekday="short" day="numeric" month="long" />, &nbsp;
                    <FormattedTime value={collective.startsAt} timeZone={collective.timezone} />&nbsp; - &nbsp;
                  </React.Fragment>
                }
                { get(collective, 'location.name') }
              </Box>
            </Row>
          </div>
        }
        <Row>
          <LabelBox>
            <Label className="control-label" textAlign={['left', null, 'right']}>
              { order.tier.type !== 'TICKET' && <FormattedMessage id="tier.order.contribution" defaultMessage="Contribution" /> }
              { order.tier.type === 'TICKET' && <FormattedMessage id="tier.order.ticket" defaultMessage="Ticket" /> }
            </Label>
          </LabelBox>
          <Box w={[1, 5/6, 5/6, 5/6]}>
            <TierComponent
              tier={order.tier}
              values={{
                quantity: order.tier.quantity || order.quantity, // TODO: confusing, need to fix
                interval: order.interval || order.tier.interval,
                amount: order.totalAmount,
              }}
              onChange={(tier) => this.handleChange('tier', tier)}
              />
          </Box>
        </Row>
        { matchingFund &&
          <Row>
            <LabelBox>
              <Label className="control-label" textAlign={['left', null, 'right']}>
                <FormattedMessage id="order.matchingfund.label" defaultMessage="Matching fund" />
              </Label>
            </LabelBox>
            <Box w={[1, null, 5/6]}>
              <MatchingFundWithData
                collective={collective}
                order={order}
                uuid={matchingFund}
                onChange={(matchingFund) => this.handleChange('matchingFund', matchingFund)}
                />
            </Box>
          </Row>
        }
        <Row>
          <Box w={1}>
            <InputField
              label="Message (public)"
              type="textarea"
              name="publicMessage"
              className="horizontal"
              placeholder={intl.formatMessage(this.messages['order.publicMessage.placeholder'])}
              defaultValue={order.publicMessage}
              maxLength={255}
              onChange={(value) => this.handleChange('publicMessage', value)}
              />
          </Box>
        </Row>
      </section>
    )
  }
}

export default withIntl(OrderFormContributionDetails);
