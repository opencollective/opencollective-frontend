import React from 'react';
import PropTypes from 'prop-types';
import { getApplicableTaxesForCountry, TaxType } from '@opencollective/taxes';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { ArrowBack } from '@styled-icons/material/ArrowBack';
import dayjs from 'dayjs';
import { cloneDeep, find, get, set } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { AccountTypesWithHost, CollectiveType, defaultBackgroundImage } from '../../lib/constants/collectives';
import { Currency } from '../../lib/constants/currency';
import { ORDER_STATUS } from '../../lib/constants/order-status';
import { TierTypes } from '../../lib/constants/tiers-types';
import { VAT_OPTIONS } from '../../lib/constants/vat';
import { convertDateFromApiUtc, convertDateToApiUtc } from '../../lib/date-utils';

import Container from '../Container';
import CreateGiftCardsForm from '../CreateGiftCardsForm';
import { Box, Flex } from '../Grid';
import InputField from '../InputField';
import Link from '../Link';
import OrdersWithData from '../orders/OrdersWithData';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';

// Actions
import Archive from './actions/Archive';
import Delete from './actions/Delete';
import EmptyBalance from './actions/EmptyBalance';
// Sections
import CollectiveGoals from './sections/CollectiveGoals';
import ConnectedAccounts from './sections/ConnectedAccounts';
import EditCollectivePage from './sections/EditCollectivePage';
import Export from './sections/Export';
import FiscalHosting from './sections/FiscalHosting';
import GiftCards from './sections/GiftCards';
import Host from './sections/Host';
import HostTwoFactorAuth from './sections/HostTwoFactorAuth';
import HostVirtualCardsSettings from './sections/HostVirtualCardsSettings';
import InvoicesReceipts from './sections/InvoicesReceipts';
import Members from './sections/Members';
import PaymentMethods from './sections/PaymentMethods';
import PaymentReceipts from './sections/PaymentReceipts';
import Policies from './sections/Policies';
import ReceivingMoney from './sections/ReceivingMoney';
import SendingMoney from './sections/SendingMoney';
import Tickets from './sections/Tickets';
import Tiers from './sections/Tiers';
import UserTwoFactorAuth from './sections/UserTwoFactorAuth';
import VirtualCards from './sections/virtual-cards/VirtualCards';
import Webhooks from './sections/Webhooks';
// Other Components
import EditUserEmailForm from './EditUserEmailForm';
import { EDIT_COLLECTIVE_SECTIONS } from './Menu';

const { COLLECTIVE, FUND, PROJECT, EVENT, ORGANIZATION, USER } = CollectiveType;

class EditCollectiveForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    status: PropTypes.string, // loading, saved
    section: PropTypes.string,
    onSubmit: PropTypes.func,
    LoggedInUser: PropTypes.object.isRequired,
    router: PropTypes.object, // from withRouter
    intl: PropTypes.object.isRequired, // from injectIntl
    query: PropTypes.object, // passed from Page/Router through index/EditCollective
  };

  constructor(props) {
    super(props);

    this.state = { ...this.getStateFromProps(props) };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);

    const { collective } = this.state;

    this.showEditTiers = [COLLECTIVE, EVENT].includes(collective.type);
    this.showExpenses = collective.type === COLLECTIVE || collective.isHost;
    this.showEditGoals = collective.type === COLLECTIVE;
    this.showHost = collective.type === COLLECTIVE;
    this.defaultTierType = collective.type === EVENT ? 'TICKET' : 'TIER';
    this.showEditMembers = [COLLECTIVE, ORGANIZATION].includes(collective.type);
    this.showPaymentMethods = [USER, ORGANIZATION].includes(collective.type);

    this.messages = defineMessages({
      loading: { id: 'loading', defaultMessage: 'loading' },
      save: { id: 'save', defaultMessage: 'Save' },
      saved: { id: 'saved', defaultMessage: 'Saved' },
      'event.create.btn': {
        id: 'event.create.btn',
        defaultMessage: 'Create Event',
      },
      'slug.label': {
        id: 'collective.changeUrl.label',
        defaultMessage: 'URL slug',
      },
      'type.label': { id: 'collective.type.label', defaultMessage: 'Type' },
      'name.label': { id: 'Fields.displayName', defaultMessage: 'Display name' },
      'name.description': {
        id: 'Fields.name.description',
        defaultMessage:
          'Display names are public and used wherever this profile appears publicly, like contributions, comments on updates, public info on expenses, etc.',
      },
      legalName: { id: 'LegalName', defaultMessage: 'Legal Name' },
      'legalName.description': {
        id: 'editCollective.legalName.description',
        defaultMessage:
          'Legal names are private and used in receipts, tax forms, payment details on expenses, and other non-public contexts. Legal names are only visible to admins.',
      },
      optional: {
        id: 'OptionalFieldLabel',
        defaultMessage: '{field} (optional)',
      },
      examples: {
        id: 'examples',
        defaultMessage: 'e.g., {examples}',
      },
      'tags.label': { id: 'Tags', defaultMessage: 'Tags' },
      'tos.label': {
        id: 'host.tos',
        defaultMessage: 'Terms of fiscal hosting',
      },
      'tos.description': {
        id: 'collective.tos.description',
        defaultMessage: 'Link to the terms under which this Host collects and holds funds.',
      },
      'tags.description': {
        id: 'collective.tags.edit.description',
        defaultMessage: 'Help people find you',
      },
      'company.label': {
        id: 'collective.company.label',
        defaultMessage: 'company',
      },
      'company.description': {
        id: 'collective.company.description',
        defaultMessage: 'Start with @ to reference an organization (e.g., @airbnb)',
      },
      'amount.label': {
        id: 'Fields.amount',
        defaultMessage: 'Amount',
      },
      'description.label': {
        id: 'collective.description.label',
        defaultMessage: 'Short description',
      },
      'expensePolicy.label': {
        id: 'editCollective.menu.expenses',
        defaultMessage: 'Expenses Policy',
      },
      'expensePolicy.description': {
        id: 'collective.expensePolicy.description',
        defaultMessage:
          "It can be daunting to file an expense if you're not sure what's allowed. Provide a clear policy to guide expense submitters.",
      },
      'expensePolicy.placeholder': {
        id: 'collective.expensePolicy.placeholder',
        defaultMessage: 'E.g. approval criteria, limitations, or required documentation.',
      },
      'startsAt.label': {
        id: 'startDateAndTime',
        defaultMessage: 'start date and time',
      },
      'endsAt.label': {
        id: 'event.endsAt.label',
        defaultMessage: 'end date and time',
      },
      'image.label': { id: 'collective.image.label', defaultMessage: 'Avatar' },
      'backgroundImage.label': {
        id: 'collective.backgroundImage.label',
        defaultMessage: 'Cover image',
      },
      'website.label': {
        id: 'Fields.website',
        defaultMessage: 'Website',
      },
      'application.label': {
        id: 'collective.application.label',
        defaultMessage: 'Open to Applications',
      },
      'application.description': {
        id: 'collective.application.description',
        defaultMessage: 'Enable new Collectives to apply to join your Fiscal Host',
      },
      'application.message.label': {
        id: 'application.message.label',
        defaultMessage: 'Application instructions',
      },
      'application.message.description': {
        id: 'application.message.description',
        defaultMessage: 'These instructions appear above the text box that applicants see (1000 characters max)',
      },
      'application.message.defaultValue': {
        id: 'ApplyToHost.DefaultMessage',
        defaultMessage:
          'Explain what information applicants should submit for your review (plain text, 3000 characters max), or direct them to an external application form.',
      },
      'hostFeePercent.label': {
        id: 'HostFee',
        defaultMessage: 'Host fee',
      },
      'hostFeePercent.description': {
        id: 'collective.hostFeePercent.description',
        defaultMessage: 'Fee on financial contributions to Collectives you fiscally host.',
      },
      'hostFeePercent.warning': {
        id: 'collective.hostFeePercent.warning',
        defaultMessage: `Open Collective will charge 15% of your Host Fee revenue as its Platform Fee.`,
      },
      'hostFeePercent.warning2': {
        id: 'newPricing.tab.hostFeeChargeExample',
        defaultMessage: `If your Host fee is 10% and your Collectives bring in $1,000, your Platform fee will be $15. If you host fee is 0%, your Platform fee will be 0.`,
      },
      'location.label': {
        id: 'SectionLocation.Title',
        defaultMessage: 'Location',
      },
      'country.label': {
        id: 'collective.country.label',
        defaultMessage: 'Country',
      },
      'currency.label': {
        id: 'Currency',
        defaultMessage: 'Currency',
      },
      'currency.placeholder': {
        id: 'collective.currency.placeholder',
        defaultMessage: 'Select currency',
      },
      'currency.warning': {
        id: 'collective.currency.warning',
        defaultMessage: `Active Collectives, Funds and Fiscal Hosts can't edit their currency. Contact support@opencollective.com if this is an issue.`,
      },
      'address.label': {
        id: 'collective.address.label',
        defaultMessage: 'Address',
      },
      'VAT.label': {
        id: 'EditCollective.VAT',
        defaultMessage: 'VAT settings',
      },
      'VAT.description': {
        id: 'EditCollective.VAT.Description',
        defaultMessage: 'European Value Added Tax',
      },
      'VAT.None': {
        id: 'EditCollective.VAT.None',
        defaultMessage: 'Not subject to VAT',
      },
      'VAT.Host': {
        id: 'EditCollective.VAT.Host',
        defaultMessage: 'Use the host VAT settings',
      },
      'VAT.Own': {
        id: 'EditCollective.VAT.Own',
        defaultMessage: 'Use my own VAT number',
      },
      'VAT-number.label': {
        id: 'EditCollective.VATNumber',
        defaultMessage: 'VAT number',
      },
      'VAT-number.description': {
        id: 'EditCollective.VATNumber.Description',
        defaultMessage: 'Your European Value Added Tax (VAT) number',
      },
      'GST-number.label': {
        id: 'EditCollective.GSTNumber',
        defaultMessage: 'GST number',
      },
      'privateInstructions.label': {
        id: 'event.privateInstructions.label',
        defaultMessage: 'Private instructions',
      },
      privateInstructionsDescription: {
        id: 'event.privateInstructions.description',
        defaultMessage: 'These instructions will be provided by email to the participants.',
      },
      inValidDateError: { defaultMessage: 'Please enter a valid date' },
    });

    collective.backgroundImage = collective.backgroundImage || defaultBackgroundImage[collective.type];
  }

  getStateFromProps(props) {
    const collective = { ...(props.collective || {}) };

    collective.slug = collective.slug ? collective.slug.replace(/.*\//, '') : '';
    collective.tos = get(collective, 'settings.tos');

    const tiers = collective.tiers && collective.tiers.filter(tier => tier.type !== TierTypes.TICKET);
    const tickets = collective.tiers && collective.tiers.filter(tier => tier.type === TierTypes.TICKET);

    return {
      modified: false,
      collective,
      tiers: tiers.length === 0 ? [] : tiers,
      tickets: tickets.length === 0 ? [] : tickets,
      validStartDate: true,
      validEndDate: true,
    };
  }

  handleChange(fieldname, value) {
    this.setState(state => {
      const collective = cloneDeep(state.collective);

      // GraphQL schema has address embedded within location
      // mutation expects { location: { address: '' } }
      if (['address', 'country'].includes(fieldname)) {
        collective.location[fieldname] = value;
      } else if (fieldname === 'VAT') {
        set(collective, 'settings.VAT.type', value);
      } else if (fieldname === 'VAT-number') {
        set(collective, 'settings.VAT.number', value);
      } else if (fieldname === 'GST-number') {
        if (!value) {
          set(collective, 'settings.GST', null);
        } else {
          set(collective, 'settings.GST.number', value);
        }
      } else if (fieldname === 'application') {
        set(collective, 'settings.apply', value);
      } else if (fieldname === 'application.message') {
        set(collective, 'settings.applyMessage', value);
      } else if (fieldname === 'startsAt' && collective.type === EVENT) {
        const isValid = dayjs(value).isValid();
        this.setState({ validStartDate: isValid });
        if (isValid) {
          collective[fieldname] = convertDateToApiUtc(value, collective.timezone);
        }
      } else if (fieldname === 'endsAt' && collective.type === EVENT) {
        const isValid = dayjs(value).isValid();
        this.setState({ validEndDate: isValid });
        if (isValid) {
          collective[fieldname] = convertDateToApiUtc(value, collective.timezone);
        }
      } else if (fieldname === 'timezone' && collective.type === EVENT) {
        if (value) {
          const timezone = collective.timezone;
          const startsAt = collective.startsAt;
          const endsAt = collective.endsAt;
          collective.startsAt = convertDateToApiUtc(convertDateFromApiUtc(startsAt, timezone), value);
          collective.endsAt = convertDateToApiUtc(convertDateFromApiUtc(endsAt, timezone), value);
          collective.timezone = value;
        }
      } else {
        set(collective, fieldname, value);
      }

      return { collective, modified: true };
    });
  }

  async handleSubmit() {
    const collective = { ...this.state.collective };

    // Add Tiers and Tickets
    collective.tiers = [];
    if (find(this.state.tiers, 'name')) {
      collective.tiers = [...this.state.tiers];
    }
    if (find(this.state.tickets, 'name')) {
      collective.tiers = [...collective.tiers, ...this.state.tickets];
    }

    this.props.onSubmit(collective);

    this.setState({ modified: false });
  }

  getFieldDefaultValue(field) {
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    } else if (['address', 'country'].includes(field.name)) {
      return get(this.state.collective.location, field.name);
    }

    return this.state.collective[field.name];
  }

  getMenuSelectedSection(section) {
    if (['gift-cards-create', 'gift-cards-send', 'gift-cards'].includes(section)) {
      return EDIT_COLLECTIVE_SECTIONS.GIFT_CARDS;
    } else {
      return section;
    }
  }

  renderSection(section) {
    const { collective, LoggedInUser } = this.props;

    switch (section) {
      case EDIT_COLLECTIVE_SECTIONS.INFO:
        return null;

      case EDIT_COLLECTIVE_SECTIONS.COLLECTIVE_GOALS:
        return <CollectiveGoals collective={collective} currency={collective.currency} />;

      case EDIT_COLLECTIVE_SECTIONS.COLLECTIVE_PAGE:
        return <EditCollectivePage collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.CONNECTED_ACCOUNTS:
        return <ConnectedAccounts collective={collective} connectedAccounts={collective.connectedAccounts} />;

      case EDIT_COLLECTIVE_SECTIONS.EXPENSES:
        return null;

      case EDIT_COLLECTIVE_SECTIONS.EXPORT:
        return <Export collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.HOST:
        return (
          <Host collective={collective} LoggedInUser={LoggedInUser} editCollectiveMutation={this.props.onSubmit} />
        );

      case EDIT_COLLECTIVE_SECTIONS.MEMBERS:
        return <Members collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.PAYMENT_METHODS:
        return <PaymentMethods collectiveSlug={collective.slug} />;

      case EDIT_COLLECTIVE_SECTIONS.TIERS:
        return (
          <Tiers
            title="Tiers"
            types={['TIER', 'MEMBERSHIP', 'SERVICE', 'PRODUCT', 'DONATION']}
            tiers={this.state.tiers}
            collective={collective}
            currency={collective.currency}
            onChange={tiers => this.setState({ tiers, modified: true })}
            defaultType="TIER"
          />
        );

      case EDIT_COLLECTIVE_SECTIONS.TICKETS:
        return (
          <Tickets
            title="Tickets"
            tiers={this.state.tickets}
            collective={collective}
            currency={collective.currency}
            onChange={tickets => this.setState({ tickets, modified: true })}
          />
        );

      case EDIT_COLLECTIVE_SECTIONS.GIFT_CARDS:
        return <GiftCards collectiveId={collective.id} collectiveSlug={collective.slug} />;

      case 'gift-cards-create':
      case 'gift-cards-send':
        return (
          <Flex mt={3} flexDirection="column">
            <Container
              mb={4}
              pb={4}
              borderBottom="1px solid #E8E9EB"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
            >
              <Link href={`/${collective.slug}/admin/gift-cards`}>
                <StyledButton data-cy="back-to-giftcards-list">
                  <ArrowBack size="1em" />{' '}
                  <FormattedMessage id="giftCards.returnToEdit" defaultMessage="Back to Gift Cards list" />
                </StyledButton>
              </Link>

              <StyledLink
                href="https://docs.opencollective.com/help/financial-contributors/organizations/gift-cards#faq"
                openInNewTab
              >
                <InfoCircle size="1em" />
                &nbsp;
                <FormattedMessage id="Giftcard.learnMore" defaultMessage="Learn more about Gift Cards" />
              </StyledLink>
            </Container>
            <CreateGiftCardsForm
              collectiveId={collective.id}
              collectiveSlug={collective.slug}
              collectiveSettings={collective.settings}
              currency={collective.currency}
            />
          </Flex>
        );

      case EDIT_COLLECTIVE_SECTIONS.WEBHOOKS:
        return <Webhooks collectiveSlug={collective.slug} />;

      case EDIT_COLLECTIVE_SECTIONS.ADVANCED:
        return (
          <Box>
            {collective.type === USER && <EditUserEmailForm />}
            {[COLLECTIVE, FUND, PROJECT, EVENT].includes(collective.type) && (
              <EmptyBalance collective={collective} LoggedInUser={LoggedInUser} />
            )}
            <Archive collective={collective} />
            <Delete collective={collective} />
          </Box>
        );

      // Fiscal Hosts

      case EDIT_COLLECTIVE_SECTIONS.FISCAL_HOSTING:
        return <FiscalHosting collective={collective} LoggedInUser={LoggedInUser} />;

      case EDIT_COLLECTIVE_SECTIONS.INVOICES_RECEIPTS:
        return <InvoicesReceipts collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.RECEIVING_MONEY:
        return <ReceivingMoney collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.PENDING_ORDERS:
        return (
          <OrdersWithData
            accountSlug={collective.slug}
            status={ORDER_STATUS.PENDING}
            title={<FormattedMessage id="PendingBankTransfers" defaultMessage="Pending bank transfers" />}
            showPlatformTip
          />
        );

      case EDIT_COLLECTIVE_SECTIONS.SENDING_MONEY:
        return <SendingMoney collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.HOST_TWO_FACTOR_AUTH:
        return <HostTwoFactorAuth collective={collective} />;

      // 2FA
      case EDIT_COLLECTIVE_SECTIONS.TWO_FACTOR_AUTH:
        return <UserTwoFactorAuth slug={collective.slug} userEmail={LoggedInUser.email} />;

      // Payment Receipts
      case EDIT_COLLECTIVE_SECTIONS.PAYMENT_RECEIPTS:
        return <PaymentReceipts collective={collective} />;

      // Policies and moderation
      case EDIT_COLLECTIVE_SECTIONS.POLICIES:
        return <Policies collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.HOST_VIRTUAL_CARDS_SETTINGS:
        return <HostVirtualCardsSettings collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.VIRTUAL_CARDS:
        return <VirtualCards collective={collective} />;

      default:
        return null;
    }
  }

  getApplicableTaxesFields = () => {
    const { intl } = this.props;
    const { collective } = this.state;
    const fields = [];
    const country = get(collective, 'location.country') || get(collective.host, 'location.country');
    const taxes = getApplicableTaxesForCountry(country);

    if (taxes.includes(TaxType.VAT)) {
      fields.push(
        {
          name: 'VAT',
          type: 'select',
          defaultValue: get(collective, 'settings.VAT.type'),
          when: () => {
            return AccountTypesWithHost.includes(collective.type);
          },
          options: [
            {
              value: '',
              label: intl.formatMessage(this.messages['VAT.None']),
            },
            {
              value: VAT_OPTIONS.HOST,
              label: intl.formatMessage(this.messages['VAT.Host']),
            },
            {
              value: VAT_OPTIONS.OWN,
              label: intl.formatMessage(this.messages['VAT.Own']),
            },
          ],
        },
        {
          name: 'VAT-number',
          type: 'string',
          placeholder: 'FRXX999999999',
          defaultValue: get(collective, 'settings.VAT.number'),
          when: () => {
            const { collective } = this.state;
            if (collective.type === COLLECTIVE || collective.type === EVENT) {
              // Collectives can set a VAT number if configured
              return get(collective, 'settings.VAT.type') === VAT_OPTIONS.OWN;
            } else {
              return true;
            }
          },
        },
      );
    } else if (taxes.includes(TaxType.GST) && collective.isHost) {
      fields.push({
        name: 'GST-number',
        type: 'string',
        placeholder: '9429037631147',
        defaultValue: get(collective, 'settings.GST.number'),
      });
    }

    return fields;
  };

  render() {
    const { collective, status, intl, router } = this.props;

    const section = this.props.section || get(router, 'query.section', 'info');

    const isNew = !(collective && collective.id);
    let submitBtnMessageId = isNew ? 'event.create.btn' : 'save';
    if (['loading', 'saved'].includes(status)) {
      submitBtnMessageId = status;
    }

    const isEvent = collective.type === EVENT;
    const isUser = collective.type === USER;
    const currencyOptions = Currency.map(c => ({ value: c, label: c }));
    const submitBtnLabel = this.messages[submitBtnMessageId] && intl.formatMessage(this.messages[submitBtnMessageId]);

    const type = collective.type.toLowerCase();

    this.fields = {
      info: [
        {
          name: 'name',
          placeholder: '',
          maxLength: 255,
        },
        {
          name: 'legalName',
          label: intl.formatMessage(this.messages.optional, {
            field: intl.formatMessage(this.messages.legalName),
          }),
          placeholder: intl.formatMessage(this.messages.examples, {
            examples: isUser ? 'Maria Garcia' : 'Salesforce, Inc., Airbnb, Inc.',
          }),
          maxLength: 255,
          when: () => isUser || collective.type === ORGANIZATION || collective.isHost,
          isPrivate: true,
        },
        {
          name: 'company',
          placeholder: '',
          maxLength: 255,
          when: () => isUser,
        },
        {
          name: 'description',
          type: 'text',
          maxLength: 255,
          placeholder: '',
        },
        {
          name: 'slug',
          pre: 'https://opencollective.com/',
          placeholder: '',
          when: () => collective.type !== EVENT,
        },
        {
          name: 'twitterHandle',
          type: 'text',
          pre: 'https://twitter.com/',
          maxLength: 255,
          placeholder: '',
          label: 'Twitter',
          when: () => collective.type !== EVENT,
        },
        {
          name: 'githubHandle',
          type: 'text',
          pre: 'https://github.com/',
          maxLength: 140, // 39 (Max length of GitHub org name) + 100 (Max length of repo name) + 1 (for the '/' sign)
          placeholder: '',
          label: 'Github',
          when: () => collective.type !== EVENT,
        },
        {
          name: 'website',
          type: 'text',
          maxLength: 255,
          placeholder: '',
          when: () => collective.type !== EVENT,
        },
        {
          name: 'address',
          placeholder: '',
          maxLength: 255,
          type: 'textarea',
          when: () => collective.type !== EVENT,
          // TODO: Use structured here to be consistent with other places
        },
        {
          name: 'country',
          type: 'country',
          placeholder: 'Select country',
          when: () => collective.type !== EVENT,
        },
        {
          name: 'startsAt',
          type: 'datetime-local',
          defaultValue: dayjs(collective.startsAt).tz(collective.timezone).format('YYYY-MM-DDTHH:mm'),
          when: () => collective.type === EVENT,
          error: !this.state.validStartDate ? intl.formatMessage(this.messages.inValidDateError) : null,
          required: true,
        },
        {
          name: 'endsAt',
          type: 'datetime-local',
          defaultValue: dayjs(collective.endsAt).tz(collective.timezone).format('YYYY-MM-DDTHH:mm'),
          when: () => collective.type === EVENT,
          error: !this.state.validEndDate ? intl.formatMessage(this.messages.inValidDateError) : null,
          required: true,
        },
        {
          name: 'timezone',
          type: 'TimezonePicker',
          when: () => collective.type === EVENT,
        },
        {
          name: 'location',
          placeholder: '',
          type: 'location',
          when: () => collective.type === EVENT,
        },
        {
          name: 'privateInstructions',
          description: intl.formatMessage(this.messages.privateInstructionsDescription),
          type: 'textarea',
          maxLength: 10000,
          defaultValue: collective.privateInstructions,
          when: () => collective.type === EVENT,
        },
        {
          name: 'currency',
          type: 'select',
          defaultValue: get(this.state.collective, 'currency'),
          options: currencyOptions,
          description:
            ([COLLECTIVE, FUND].includes(collective.type) && collective.isActive) || collective.isHost
              ? intl.formatMessage(this.messages['currency.warning'])
              : null,
          when: () => ![EVENT, PROJECT].includes(collective.type),
          // Active Collectives, Funds and Fiscal Hosts can't edit their currency.
          disabled:
            ([COLLECTIVE, FUND].includes(collective.type) && collective.isActive) || collective.isHost ? true : false,
        },
        ...this.getApplicableTaxesFields(),
        {
          name: 'tags',
          maxLength: 128,
          type: 'tags',
          placeholder: 'meetup, javascript',
          when: () => ![EVENT, PROJECT, FUND].includes(collective.type),
        },
      ],
      'fiscal-hosting': [
        {
          name: 'application',
          className: 'horizontal',
          type: 'switch',
          defaultValue: get(this.state.collective, 'settings.apply'),
          when: () => collective.isHost && (collective.type === ORGANIZATION || collective.settings.apply),
        },
        {
          name: 'application.message',
          className: 'horizontal',
          type: 'textarea',
          defaultValue: get(this.state.collective, 'settings.applyMessage'),
          placeholder: intl.formatMessage(this.messages['application.message.defaultValue']),
          disabled: !this.state.collective.settings?.apply,
          maxLength: 1000,
          when: () => collective.isHost && (collective.type === ORGANIZATION || collective.settings.apply),
        },
        {
          name: 'hostFeePercent',
          type: 'number',
          className: 'horizontal',
          step: '0.01',
          post: '%',
          defaultValue: get(this.state.collective, 'hostFeePercent'),
          when: () => collective.isHost && (collective.type === ORGANIZATION || collective.hostFeePercent !== 0),
        },
        {
          name: 'tos',
          type: 'text',
          placeholder: '',
          className: 'horizontal',
          defaultValue: get(this.state.collective, 'settings.tos'),
          when: () => collective.isHost && (collective.type === ORGANIZATION || collective.settings.tos),
        },
      ],
    };

    Object.keys(this.fields).map(fieldname => {
      this.fields[fieldname] = this.fields[fieldname].map(field => {
        if (this.messages[`${field.name}.label`]) {
          field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
        }
        if (this.messages[`${field.name}.description`]) {
          field.description = intl.formatMessage(this.messages[`${field.name}.description`], collective);
        }
        if (this.messages[`${field.name}.placeholder`]) {
          field.placeholder = intl.formatMessage(this.messages[`${field.name}.placeholder`]);
        }
        if (field.name === 'hostFeePercent' && collective.plan.name.includes('2021')) {
          field.description += ` `;
          field.description += intl.formatMessage(this.messages[`${field.name}.warning`], collective);
          field.description += ` `;
          field.description += intl.formatMessage(this.messages[`${field.name}.warning2`], collective);
        }

        return field;
      });
    });

    const fields = (this.fields[section] || []).filter(field => !field.when || field.when());
    return (
      <div>
        <Flex flexWrap="wrap">
          <Flex flexDirection="column" css={{ flexGrow: 10, flexBasis: 600 }}>
            {fields && fields.length > 0 && (
              <div className="FormInputs">
                <div className="inputs">
                  {fields.map(field => (
                    <InputField
                      key={field.name}
                      className={field.className}
                      defaultValue={this.getFieldDefaultValue(field)}
                      validate={field.validate}
                      ref={field.name}
                      name={field.name}
                      label={field.label}
                      description={field.description}
                      options={field.options}
                      placeholder={field.placeholder}
                      type={field.type}
                      pre={field.pre}
                      post={field.post}
                      context={this.state.collective}
                      error={field.error}
                      onChange={value => this.handleChange(field.name, value)}
                      onKeyDown={event => {
                        if ((field.name === 'startsAt' || field.name === 'endsAt') && event.key === 'Backspace') {
                          event.preventDefault();
                        }
                      }}
                      disabled={field.disabled}
                      maxLength={field.maxLength}
                      isPrivate={field.isPrivate}
                      step={field.step}
                      min={field.min}
                      overflow="hidden"
                      required={field.required}
                    />
                  ))}
                </div>
              </div>
            )}

            {[EDIT_COLLECTIVE_SECTIONS.TIERS, EDIT_COLLECTIVE_SECTIONS.TICKETS].includes(section) &&
              this.renderSection(section)}

            {((fields && fields.length > 0) ||
              [EDIT_COLLECTIVE_SECTIONS.TIERS, EDIT_COLLECTIVE_SECTIONS.TICKETS].includes(section)) && (
              <Container className="actions" margin="5rem auto 1rem" textAlign="center">
                <StyledButton
                  buttonStyle="primary"
                  type="submit"
                  onClick={this.handleSubmit}
                  data-cy="collective-save"
                  disabled={
                    status === 'loading' ||
                    !this.state.modified ||
                    !this.state.validStartDate ||
                    !this.state.validEndDate
                  }
                >
                  {submitBtnLabel}
                </StyledButton>

                <Container className="backToProfile" fontSize="1.3rem" margin="1rem">
                  <Link
                    href={
                      isEvent ? `/${collective.parentCollective.slug}/events/${collective.slug}` : `/${collective.slug}`
                    }
                  >
                    <FormattedMessage
                      id="collective.edit.backToProfile"
                      defaultMessage="view {type} page"
                      values={{ type }}
                    />
                  </Link>
                </Container>
              </Container>
            )}

            {![EDIT_COLLECTIVE_SECTIONS.TIERS, EDIT_COLLECTIVE_SECTIONS.TICKETS].includes(section) &&
              this.renderSection(section)}
          </Flex>
        </Flex>
      </div>
    );
  }
}

export default withRouter(injectIntl(EditCollectiveForm));
