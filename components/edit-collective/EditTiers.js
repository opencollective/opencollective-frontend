import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { get, set, cloneDeep, pick } from 'lodash';
import { Button, Form } from 'react-bootstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { v4 as uuid } from 'uuid';
import { useMutation } from '@apollo/react-hooks';
import { Box, Flex } from '@rebass/grid';
import { getStandardVatRate, getVatOriginCountry } from '@opencollective/taxes';

import { getCurrencySymbol, capitalize } from '../../lib/utils';
import InputField from '../InputField';
import InputFieldPresets from '../InputFieldPresets';
import { Span } from '../Text';
import MessageBox from '../MessageBox';
import StyledCheckbox from '../StyledCheckbox';

import { updateSettingsMutation } from './mutations';

const EditTiers = props => {
  let [tiers, setTiers] = useState([...props.tiers] || [{}]);
  const [setSettings, { loading }] = useMutation(updateSettingsMutation);
  const { intl } = props;
  const defaultType = props.defaultType || (props.collective.type === 'EVENT' ? 'TICKET' : 'TIER');
  const messages = defineMessages({
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
      obj[key] = intl.formatMessage(messages[key]);
      return obj;
    });
  };

  const fields = [
    {
      name: 'type',
      type: 'select',
      options: getOptions(props.types || ['TIER', 'TICKET', 'MEMBERSHIP', 'SERVICE', 'PRODUCT', 'DONATION']),
      label: intl.formatMessage(messages['type.label']),
    },
    {
      name: 'name',
      label: intl.formatMessage(messages['name.label']),
    },
    {
      name: 'description',
      type: 'textarea',
      label: intl.formatMessage(messages['description.label']),
    },
    {
      name: 'amountType',
      type: 'select',
      options: getOptions(['FIXED', 'FLEXIBLE']),
      label: intl.formatMessage(messages['amountType.label']),
    },
    {
      name: 'amount',
      pre: getCurrencySymbol(props.currency),
      type: 'currency',
      label: intl.formatMessage(messages['amount.label']),
      when: tier => tier.amountType === 'FIXED',
    },
    {
      name: 'presets',
      pre: getCurrencySymbol(props.currency),
      type: 'component',
      component: InputFieldPresets,
      label: intl.formatMessage(messages['presets.label']),
      when: tier => tier.amountType === 'FLEXIBLE',
    },
    {
      name: 'amount',
      pre: getCurrencySymbol(props.currency),
      type: 'currency',
      label: intl.formatMessage(messages['defaultAmount.label']),
      when: tier => tier.amountType === 'FLEXIBLE',
    },
    {
      name: 'minimumAmount',
      pre: getCurrencySymbol(props.currency),
      type: 'currency',
      label: intl.formatMessage(messages['minimumAmount.label']),
      when: tier => tier.amountType === 'FLEXIBLE',
    },
    {
      name: 'interval',
      type: 'select',
      options: getOptions(['onetime', 'month', 'year']),
      label: intl.formatMessage(messages['interval.label']),
      when: tier => !tier || ['DONATION', 'MEMBERSHIP', 'TIER', 'SERVICE'].includes(tier.type),
    },
    {
      name: 'maxQuantity',
      type: 'number',
      label: intl.formatMessage(messages['maxQuantity.label']),
      description: intl.formatMessage(messages['maxQuantity.description']),
      when: tier => ['TICKET', 'PRODUCT', 'TIER'].includes(tier.type),
    },
    {
      name: 'button',
      type: 'text',
      label: intl.formatMessage(messages['button.label']),
    },
    {
      name: 'goal',
      pre: getCurrencySymbol(props.currency),
      type: 'currency',
      label: intl.formatMessage(messages['goal.label']),
      description: intl.formatMessage(messages['goal.description']),
    },
    {
      name: '__hasLongDescription',
      type: 'switch',
      label: 'Force standalone page',
      description: intl.formatMessage(messages.forceLongDescription),
    },
  ];

  const editTier = (index, fieldname, value) => {
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
      type: tiers[index]['type'] || defaultType,
      [fieldname]: value,
    };
    setTiers(tiers);
    props.onChange({ tiers });
  };

  const addTier = tier => {
    tiers.push({ ...(tier || {}), __uuid: uuid() });
    setTiers(tiers);
    props.onChange({ tiers });
  };

  const removeTier = index => {
    if (index < 0 || index > tiers.length) {
      return;
    }
    tiers = [...tiers.slice(0, index), ...tiers.slice(index + 1)];
    setTiers(tiers);
    props.onChange({ tiers });
  };

  const renderLabel = (field, hasTax) => {
    if (['presets', 'amount'].includes(field.name) && hasTax) {
      return (
        <Flex flexDirection="column">
          <Span>{capitalize(field.label)}</Span>
          <Span fontSize="Tiny" color="black.400">
            (without tax)
          </Span>
        </Flex>
      );
    }
    return field.label;
  };

  const renderTier = (tier, index) => {
    const { intl, collective } = props;
    const key = tier.id ? `tier-${tier.id}` : `newTier-${tier.__uuid};`;
    const hostCountry = get(collective, 'host.location.country');
    const collectiveCountry =
      get(collective, 'location.country') || get(collective, 'parentCollective.location.country');

    const hasVat = Boolean(get(collective, 'settings.VAT.type'));
    const vatOriginCountry = hasVat && getVatOriginCountry(tier.type, hostCountry, collectiveCountry);
    const vatPercentage = hasVat ? getStandardVatRate(tier.type, vatOriginCountry) : 0;

    if (!tier.amountType) {
      tier.amountType = tier.presets ? 'FLEXIBLE' : 'FIXED';
    }

    // Set the default value of preset
    if (tier.amountType === 'FLEXIBLE' && !tier.presets) {
      tier.presets = [1000];
    }

    if (!tier.name) {
      tier.name = '';
    }

    const defaultValues = {
      ...tier,
      type: tier.type || defaultType,
      amountType: tier.amountType,
    };

    return (
      <div className={`tier ${tier.slug}`} key={key}>
        <div className="tierActions">
          <a className="removeTier" href="#" onClick={() => removeTier(index)}>
            {intl.formatMessage(messages[`${defaultType}.remove`])}
          </a>
        </div>
        <Form horizontal>
          {fields.map(
            field =>
              (!field.when || field.when(defaultValues)) && (
                <Box key={field.name}>
                  <InputField
                    className="horizontal"
                    name={field.name}
                    label={renderLabel(field, Boolean(vatPercentage))}
                    component={field.component}
                    description={field.description}
                    type={field.type}
                    defaultValue={defaultValues[field.name]}
                    options={field.options}
                    pre={field.pre}
                    placeholder={field.placeholder}
                    onChange={value => editTier(index, field.name, value)}
                  />
                  {field.name === 'type' && vatPercentage > 0 && (
                    <Flex mb={4}>
                      <Box width={0.166} px={15} />
                      <MessageBox type="info" withIcon css={{ flexGrow: 1 }}>
                        <strong>
                          <FormattedMessage id="tax.vat" defaultMessage="Value-added tax (VAT)" />
                          {': '}
                          {vatPercentage}%
                        </strong>
                        <br />
                        <Span>
                          <FormattedMessage
                            id="tax.vat.description"
                            defaultMessage="Use this tier type to conform with legislation on VAT in Europe."
                          />
                        </Span>
                      </MessageBox>
                    </Flex>
                  )}
                </Box>
              ),
          )}
        </Form>
      </div>
    );
  };

  let defaultIsChecked = false;
  if (props.collective.settings.disableCustomContributions === undefined) {
    defaultIsChecked = true;
  } else {
    defaultIsChecked = props.collective.settings.disableCustomContributions;
  }

  return (
    <div className="EditTiers">
      <style jsx>
        {`
          :global(.tierActions) {
            text-align: right;
            font-size: 1.3rem;
          }
          :global(.field) {
            margin: 1rem;
          }
          .editTiersActions {
            text-align: right;
            margin-top: -10px;
          }
          :global(.tier) {
            margin: 3rem 0;
          }
        `}
      </style>

      <div className="tiers">
        <h2>{props.title}</h2>
        <Flex flexDirection="column" alignItems="center" justifyContent="center" minWidth={300}>
          <StyledCheckbox
            name="custom-contributions"
            label={intl.formatMessage(messages['customContributions.label'])}
            defaultChecked={defaultIsChecked}
            width="auto"
            isLoading={loading}
            onChange={({ target }) => {
              const updatedCollective = cloneDeep(props.collective);
              set(updatedCollective, 'settings.disableCustomContributions', target.value);
              return setSettings({ variables: pick(updatedCollective, ['id', 'settings']) });
            }}
          />
        </Flex>
        {tiers.map(renderTier)}
      </div>
      <div className="editTiersActions">
        <Button className="addTier" bsStyle="primary" onClick={() => addTier({})}>
          {intl.formatMessage(messages[`${defaultType}.add`])}
        </Button>
      </div>
    </div>
  );
};

EditTiers.propTypes = {
  tiers: PropTypes.arrayOf(PropTypes.object).isRequired,
  types: PropTypes.arrayOf(PropTypes.string),
  collective: PropTypes.object,
  currency: PropTypes.string.isRequired,
  defaultType: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  intl: PropTypes.object,
  title: PropTypes.string,
};
export default injectIntl(EditTiers);
