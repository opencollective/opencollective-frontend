import React from 'react';
import PropTypes from 'prop-types';
import { Mutation } from '@apollo/client/react/components';
import { getApplicableTaxes } from '@opencollective/taxes';
import { cloneDeep, get, set } from 'lodash';
import { Button, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import { CollectiveType } from '../../../lib/constants/collectives';
import { AmountTypes, TierTypes } from '../../../lib/constants/tiers-types';
import { getCurrencySymbol } from '../../../lib/currency-utils';
import { i18nTaxDescription, i18nTaxType } from '../../../lib/i18n/taxes';
import { capitalize } from '../../../lib/utils';

import Container from '../../Container';
import ContributeCustom from '../../contribute-cards/ContributeCustom';
import { Box, Flex } from '../../Grid';
import InputField from '../../InputField';
import InputFieldPresets from '../../InputFieldPresets';
import MessageBox from '../../MessageBox';
import StyledCheckbox from '../../StyledCheckbox';
import StyledHr from '../../StyledHr';
import { H3, H4, P, Span } from '../../Text';

import { editCollectiveSettingsMutation } from './../mutations';

const { FUND, PROJECT, EVENT } = CollectiveType;
const { TIER, TICKET, MEMBERSHIP, SERVICE, PRODUCT, DONATION } = TierTypes;
const { FIXED, FLEXIBLE } = AmountTypes;

class Tiers extends React.Component {
  static propTypes = {
    tiers: PropTypes.arrayOf(PropTypes.object).isRequired,
    types: PropTypes.arrayOf(PropTypes.string),
    collective: PropTypes.object,
    currency: PropTypes.string.isRequired,
    defaultType: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object,
    title: PropTypes.string,
  };

  constructor(props) {
    super(props);
    const { intl } = props;
    this.state = { tiers: [...props.tiers] || [{}] };
    this.renderTier = this.renderTier.bind(this);
    this.addTier = this.addTier.bind(this);
    this.removeTier = this.removeTier.bind(this);
    this.editTier = this.editTier.bind(this);
    this.onChange = props.onChange.bind(this);
    this.defaultType = this.props.defaultType || TIER;

    this.messages = defineMessages({
      TIER: { id: 'tier.type.tier', defaultMessage: 'generic tier' },
      MEMBERSHIP: {
        id: 'tier.type.membership',
        defaultMessage: 'membership (recurring)',
      },
      SERVICE: {
        id: 'tier.type.service',
        defaultMessage: 'service (e.g. support)',
      },
      PRODUCT: {
        id: 'tier.type.product',
        defaultMessage: 'product (e.g. t-shirt)',
      },
      DONATION: { id: 'tier.type.donation', defaultMessage: 'donation (gift)' },
      TICKET: {
        id: 'tier.type.ticket',
        defaultMessage: 'ticket (allow multiple tickets per order)',
      },
      'TIER.remove': {
        id: 'tier.type.tier.remove',
        defaultMessage: 'remove tier',
      },
      'TICKET.remove': {
        id: 'tier.type.ticket.remove',
        defaultMessage: 'remove ticket',
      },
      'BACKER.remove': {
        id: 'tier.type.tier.remove',
        defaultMessage: 'remove tier',
      },
      'SPONSOR.remove': {
        id: 'tier.type.tier.remove',
        defaultMessage: 'remove tier',
      },
      'TIER.add': {
        id: 'tier.type.tier.add',
        defaultMessage: 'add another tier',
      },
      'TICKET.add': {
        id: 'tier.type.ticket.add',
        defaultMessage: 'add another ticket',
      },
      'BACKER.add': {
        id: 'tier.type.tier.add',
        defaultMessage: 'add another tier',
      },
      'SPONSOR.add': {
        id: 'tier.type.tier.add',
        defaultMessage: 'add another tier',
      },
      CUSTOM: { id: 'tier.type.custom', defaultMessage: 'custom tier' },
      'type.label': { id: 'tier.type.label', defaultMessage: 'Type' },
      'name.label': { id: 'Fields.name', defaultMessage: 'Name' },
      'amountType.label': {
        id: 'tier.amountType.label',
        defaultMessage: 'Amount type',
      },
      'amount.label': { id: 'Fields.amount', defaultMessage: 'Amount' },
      'minimumAmount.label': { id: 'tier.minimumAmount.label', defaultMessage: 'minimum amount' },
      'defaultAmount.label': {
        id: 'tier.defaultAmount.label',
        defaultMessage: 'default amount',
      },
      'goal.label': {
        id: 'ContributionType.Goal',
        defaultMessage: 'Goal',
      },
      'button.label': {
        id: 'tier.button.label',
        defaultMessage: 'Button text',
      },
      'goal.description': {
        id: 'tier.goal.description',
        defaultMessage: 'The amount that you are trying to raise with this tier',
      },
      'interval.label': {
        id: 'tier.interval.label',
        defaultMessage: 'interval',
      },
      FIXED: { id: 'tier.amountType.fixed', defaultMessage: 'fixed amount' },
      FLEXIBLE: {
        id: 'tier.amountType.flexible',
        defaultMessage: 'flexible amount',
      },
      onetime: { id: 'tier.interval.onetime', defaultMessage: 'one time' },
      month: { id: 'tier.interval.month', defaultMessage: 'monthly' },
      year: { id: 'tier.interval.year', defaultMessage: 'yearly' },
      'presets.label': {
        id: 'tier.presets.label',
        defaultMessage: 'suggested amounts',
      },
      'description.label': {
        id: 'Fields.description',
        defaultMessage: 'Description',
      },
      'startsAt.label': {
        id: 'startDateAndTime',
        defaultMessage: 'start date and time',
      },
      'endsAt.label': { id: 'tier.expiration.label', defaultMessage: 'Expiration' },
      'endsAt.description': {
        id: 'tier.endsAt.description',
        defaultMessage: 'Date and time until when this tier should be available',
      },
      'maxQuantity.label': {
        id: 'tier.maxQuantity.label',
        defaultMessage: 'Available quantity',
      },
      'maxQuantity.description': {
        id: 'tier.maxQuantity.description',
        defaultMessage: 'Leave it empty for unlimited',
      },
      'customContributions.label': {
        id: 'tier.customContributions.label',
        defaultMessage: 'Enable custom contributions',
      },
      forceLongDescription: {
        id: 'tier.forceLongDescription',
        defaultMessage:
          'The standalone tier page, represented by the "Read more" link, will be enabled automatically if you write a short description longer than 100 characters or if you\'ve already set a long description. You can use this switch to force the display of the page.',
      },
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
        options: getOptions(props.types || [TIER, TICKET, MEMBERSHIP, SERVICE, PRODUCT, DONATION]),
        label: intl.formatMessage(this.messages['type.label']),
        when: (tier, collective) =>
          ![FUND, PROJECT].includes(collective.type) && !(collective.type === EVENT && props.defaultType === TICKET),
      },
      {
        name: 'name',
        label: intl.formatMessage(this.messages['name.label']),
      },
      {
        name: 'description',
        type: 'textarea',
        label: intl.formatMessage(this.messages['description.label']),
      },
      {
        name: 'amountType',
        type: 'select',
        options: getOptions([FIXED, FLEXIBLE]),
        label: intl.formatMessage(this.messages['amountType.label']),
      },
      {
        name: 'amount',
        pre: getCurrencySymbol(props.currency),
        type: 'currency',
        label: intl.formatMessage(this.messages['amount.label']),
        when: tier => tier.amountType === FIXED,
      },
      {
        name: 'presets',
        pre: getCurrencySymbol(props.currency),
        type: 'component',
        component: InputFieldPresets,
        label: intl.formatMessage(this.messages['presets.label']),
        when: tier => tier.amountType === FLEXIBLE,
      },
      {
        name: 'amount',
        pre: getCurrencySymbol(props.currency),
        type: 'currency',
        label: intl.formatMessage(this.messages['defaultAmount.label']),
        when: tier => tier.amountType === FLEXIBLE,
      },
      {
        name: 'minimumAmount',
        pre: getCurrencySymbol(props.currency),
        type: 'currency',
        label: intl.formatMessage(this.messages['minimumAmount.label']),
        when: tier => tier.amountType === FLEXIBLE,
      },
      {
        name: 'interval',
        type: 'select',
        options: getOptions(['onetime', 'month', 'year']),
        label: intl.formatMessage(this.messages['interval.label']),
        when: tier => !tier || [DONATION, MEMBERSHIP, TIER, SERVICE].includes(tier.type),
      },
      {
        name: 'maxQuantity',
        type: 'number',
        label: intl.formatMessage(this.messages['maxQuantity.label']),
        description: intl.formatMessage(this.messages['maxQuantity.description']),
        when: (tier, collective) =>
          [TICKET, PRODUCT].includes(tier.type) || (tier.type === TIER && ![FUND, PROJECT].includes(collective.type)),
      },
      {
        name: 'button',
        type: 'text',
        label: intl.formatMessage(this.messages['button.label']),
        when: (tier, collective) => ![FUND, PROJECT].includes(collective.type),
      },
      {
        name: 'goal',
        pre: getCurrencySymbol(props.currency),
        type: 'currency',
        label: intl.formatMessage(this.messages['goal.label']),
        description: intl.formatMessage(this.messages['goal.description']),
        when: (tier, collective) => ![FUND, PROJECT].includes(collective.type),
      },
      {
        name: '__hasLongDescription',
        type: 'switch',
        label: 'Force standalone page',
        description: intl.formatMessage(this.messages.forceLongDescription),
        when: (tier, collective) => ![FUND, PROJECT].includes(collective.type),
      },
    ];
  }

  editTier(index, fieldname, value) {
    const tiers = this.state.tiers;

    if (fieldname === 'interval' && value === 'onetime') {
      value = null;
    } else if (fieldname === '__hasLongDescription') {
      if (value) {
        // Setting a string with an empty line for the description will activate the page
        fieldname = 'longDescription';
        value = tiers[index].longDescription || '<br/>';
      }
    }

    tiers[index] = {
      ...tiers[index],
      type: tiers[index]['type'] || this.defaultType,
      [fieldname]: value,
    };
    this.setState({ tiers });
    this.onChange(tiers);
  }

  addTier(tier) {
    const tiers = this.state.tiers;
    tiers.push({ ...(tier || {}), __uuid: uuid() });
    this.setState({ tiers });
  }

  removeTier(index) {
    let tiers = this.state.tiers;
    if (index < 0 || index > tiers.length) {
      return;
    }
    tiers = [...tiers.slice(0, index), ...tiers.slice(index + 1)];
    this.setState({ tiers });
    this.onChange(tiers);
  }

  renderLabel(field, hasTax) {
    if (['presets', 'amount'].includes(field.name) && hasTax) {
      return (
        <Flex flexDirection="column">
          <Span>{capitalize(field.label)}</Span>
          <Span fontSize="10px" color="black.400">
            (without tax)
          </Span>
        </Flex>
      );
    }
    return field.label;
  }

  renderTier(tier, index) {
    const { intl, collective } = this.props;
    const key = tier.id ? `tier-${tier.id}` : `newTier-${tier.__uuid};`;
    const taxes = getApplicableTaxes(collective, collective.host, tier.type);
    if (!tier.amountType) {
      tier.amountType = tier.presets ? FLEXIBLE : FIXED;
    }

    // Set the default value of preset
    if (tier.amountType === FLEXIBLE && !tier.presets) {
      tier.presets = [1000];
    }

    if (!tier.name) {
      tier.name = '';
    }

    const defaultValues = {
      ...tier,
      type: tier.type || this.defaultType,
    };

    return (
      <Container margin="3rem 0" className={`tier ${tier.slug}`} key={key}>
        <Container textAlign="right" fontSize="1.3rem">
          <a className="removeTier" href="#" onClick={() => this.removeTier(index)}>
            {intl.formatMessage(this.messages[`${this.defaultType}.remove`])}
          </a>
        </Container>
        <Form horizontal>
          {this.fields.map(
            field =>
              (!field.when || field.when(defaultValues, collective)) && (
                <Box key={field.name}>
                  <InputField
                    className="horizontal"
                    name={field.name}
                    label={this.renderLabel(field, Boolean(taxes.length))}
                    component={field.component}
                    description={field.description}
                    type={field.type}
                    defaultValue={defaultValues[field.name]}
                    options={field.options}
                    pre={field.pre}
                    placeholder={field.placeholder}
                    onChange={value => this.editTier(index, field.name, value)}
                  />
                  {field.name === 'type' &&
                    taxes.map(({ type, percentage }) => (
                      <Flex key={`${type}-${percentage}`} mb={4}>
                        <Box width={0.166} px={15} />
                        <MessageBox type="info" withIcon css={{ flexGrow: 1 }} fontSize="12px">
                          <Span fontWeight="bold">
                            <FormattedMessage
                              id="withColon"
                              defaultMessage="{item}:"
                              values={{ item: i18nTaxType(intl, type) }}
                            />{' '}
                            {percentage}%
                          </Span>
                          <Box mt={2}>{i18nTaxDescription(intl, type)}</Box>
                        </MessageBox>
                      </Flex>
                    ))}
                </Box>
              ),
          )}
        </Form>
      </Container>
    );
  }

  render() {
    const { intl, collective, defaultType = TICKET } = this.props;
    const hasCustomContributionsDisabled = get(collective, 'settings.disableCustomContributions', false);
    const displayCustomContributionsSettings = collective.id && defaultType !== TICKET;

    return (
      <div className="EditTiers">
        <H3>{this.props.title}</H3>
        <StyledHr my={4} borderColor="black.200" />
        {displayCustomContributionsSettings && (
          <React.Fragment>
            <H4 mb={3}>
              <FormattedMessage id="ContributionType.Custom" defaultMessage="Custom contribution" />
            </H4>
            <Mutation mutation={editCollectiveSettingsMutation}>
              {(editSettings, { loading }) => (
                <Flex flexWrap="wrap">
                  <Box mr={[0, null, 4]} css={{ pointerEvents: 'none', zoom: 0.75, filter: 'grayscale(0.3)' }}>
                    <ContributeCustom collective={collective} hideContributors />
                  </Box>
                  <Flex flexDirection="column" minWidth={200} maxWidth={600} mt={2}>
                    <P>
                      <FormattedMessage
                        id="Tiers.CustomTierDescription"
                        defaultMessage="The custom contribution adds a default tier on your collective that doesn't enforce any minimum amount or interval. This is the easiest way for people to contribute to your Collective, but it cannot be customized."
                      />
                    </P>
                    <StyledCheckbox
                      name="custom-contributions"
                      label={intl.formatMessage(this.messages['customContributions.label'])}
                      defaultChecked={!hasCustomContributionsDisabled}
                      width="auto"
                      isLoading={loading}
                      onChange={({ target }) => {
                        const updatedCollective = cloneDeep(this.props.collective);
                        editSettings({
                          variables: {
                            id: this.props.collective.id,
                            settings: set(updatedCollective.settings, 'disableCustomContributions', !target.value),
                          },
                        });
                      }}
                    />
                  </Flex>
                </Flex>
              )}
            </Mutation>
            <StyledHr my={4} borderColor="black.200" />
            <H4 mb={3}>
              <FormattedMessage id="createCustomTiers" defaultMessage="Create custom tiers" />
            </H4>
          </React.Fragment>
        )}

        <div className="tiers">{this.state.tiers.map(this.renderTier)}</div>
        <Container textAlign="right" marginTop="-10px">
          <Button className="addTier" bsStyle="primary" onClick={() => this.addTier({})}>
            {intl.formatMessage(this.messages[`${defaultType}.add`])}
          </Button>
        </Container>
      </div>
    );
  }
}

export default injectIntl(Tiers);
