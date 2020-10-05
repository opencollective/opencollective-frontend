import React from 'react';
import PropTypes from 'prop-types';
import { getApplicableTaxesForCountry, TaxType } from '@opencollective/taxes';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { ArrowBack } from '@styled-icons/material/ArrowBack';
import { cloneDeep, find, get, set } from 'lodash';
import { withRouter } from 'next/router';
import { Button } from 'react-bootstrap';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { AccountTypesWithHost, CollectiveType, defaultBackgroundImage } from '../../lib/constants/collectives';
import { Currency } from '../../lib/constants/currency';
import { TierTypes } from '../../lib/constants/tiers-types';
import { VAT_OPTIONS } from '../../lib/constants/vat';

import Container from '../Container';
import CreateVirtualCardsForm from '../CreateVirtualCardsForm';
import { Box, Flex } from '../Grid';
import InputField from '../InputField';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { H3 } from '../Text';

import Archive from './actions/Archive';
import Delete from './actions/Delete';
// Actions
import EmptyBalance from './actions/EmptyBalance';
// Generic Sections
import CollectiveGoals from './sections/CollectiveGoals';
import ConnectedAccounts from './sections/ConnectedAccounts';
import Conversations from './sections/Conversations';
import EditCollectivePage from './sections/EditCollectivePage';
import Export from './sections/Export';
// Fical Host Sections
import FiscalHosting from './sections/FiscalHosting';
import Host from './sections/Host';
import HostPlan from './sections/HostPlan';
import InvoicesReceipts from './sections/InvoicesReceipts';
import Members from './sections/Members';
import PaymentMethods from './sections/PaymentMethods';
import PaymentReceipts from './sections/PaymentReceipts';
import Policies from './sections/Policies';
import ReceivingMoney from './sections/ReceivingMoney';
import SendingMoney from './sections/SendingMoney';
import SetupTwoFactorAuth from './sections/SetupTwoFactorAuth';
import Tickets from './sections/Tickets';
import Tiers from './sections/Tiers';
import Updates from './sections/Updates';
import VirtualCards from './sections/VirtualCards';
import Webhooks from './sections/Webhooks';
import EditUserEmailForm from './EditUserEmailForm';
import Menu, { EDIT_COLLECTIVE_SECTIONS } from './Menu';

class EditCollectiveForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    status: PropTypes.string, // loading, saved
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

    this.showEditTiers = ['COLLECTIVE', 'EVENT'].includes(collective.type);
    this.showExpenses = collective.type === 'COLLECTIVE' || collective.isHost;
    this.showEditGoals = collective.type === CollectiveType.COLLECTIVE;
    this.showHost = collective.type === 'COLLECTIVE';
    this.defaultTierType = collective.type === 'EVENT' ? 'TICKET' : 'TIER';
    this.showEditMembers = ['COLLECTIVE', 'ORGANIZATION'].includes(collective.type);
    this.showPaymentMethods = ['USER', 'ORGANIZATION'].includes(collective.type);
    this.showVirtualCards = collective.type === 'ORGANIZATION';

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
      'name.label': { id: 'Fields.name', defaultMessage: 'Name' },
      'tags.label': { id: 'Tags', defaultMessage: 'Tags' },
      'tos.label': {
        id: 'host.tos',
        defaultMessage: 'Terms of fiscal sponsorship',
      },
      'tos.description': {
        id: 'collective.tos.description',
        defaultMessage: 'Link to the terms by which this host will collect money on behalf of their collectives',
      },
      'tags.description': {
        id: 'collective.tags.edit.description',
        defaultMessage: 'Make your Collective more discoverable',
      },
      'company.label': {
        id: 'collective.company.label',
        defaultMessage: 'company',
      },
      'company.description': {
        id: 'collective.company.description',
        defaultMessage: 'Start with a @ to reference an organization (e.g. @airbnb)',
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
        defaultMessage:
          'For example: what type of expenses will be approved, any limitations on amounts, what documentation is required, and who to contact with questions.',
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
      'hostFeePercent.label': {
        id: 'HostFee',
        defaultMessage: 'Host fee',
      },
      'hostFeePercent.description': {
        id: 'collective.hostFeePercent.description',
        defaultMessage: 'Commission on financial contributions to Collectives you fiscally host.',
      },
      'location.label': {
        id: 'collective.location.label',
        defaultMessage: 'City',
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
    });

    collective.backgroundImage = collective.backgroundImage || defaultBackgroundImage[collective.type];
  }

  getStateFromProps(props) {
    const collective = { ...(props.collective || {}) };

    collective.slug = collective.slug ? collective.slug.replace(/.*\//, '') : '';
    collective.tos = get(collective, 'settings.tos');
    collective.application = get(collective, 'settings.apply');

    const tiers = collective.tiers && collective.tiers.filter(tier => tier.type !== TierTypes.TICKET);
    const tickets = collective.tiers && collective.tiers.filter(tier => tier.type === TierTypes.TICKET);

    return {
      modified: false,
      collective,
      tiers: tiers.length === 0 ? [] : tiers,
      tickets: tickets.length === 0 ? [] : tickets,
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
      } else if (fieldname === 'startsAt' && collective.type === CollectiveType.EVENT) {
        collective[fieldname] = value;
        const endsAt = collective.endsAt;
        if (!endsAt || new Date(endsAt) < new Date(value)) {
          let newEndDate = new Date(value);
          if (!endsAt) {
            newEndDate.setHours(newEndDate.getHours() + 2);
          } else {
            // https://github.com/opencollπective/opencollective/issues/1232
            const endsAtDate = new Date(endsAt);
            newEndDate = new Date(value);
            newEndDate.setHours(endsAtDate.getHours());
            newEndDate.setMinutes(endsAtDate.getMinutes());
          }
          const endsAtValue = newEndDate.toString();
          collective['endsAt'] = endsAtValue;
        }
      } else {
        collective[fieldname] = value;
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
      return EDIT_COLLECTIVE_SECTIONS.VIRTUAL_CARDS;
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

      case EDIT_COLLECTIVE_SECTIONS.UPDATES:
        return <Updates collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.CONVERSATIONS:
        return <Conversations collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.EXPENSES:
        return null;

      case EDIT_COLLECTIVE_SECTIONS.EXPORT:
        return <Export collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.HOST:
        return (
          <Host collective={collective} LoggedInUser={LoggedInUser} editCollectiveMutation={this.props.onSubmit} />
        );

      case EDIT_COLLECTIVE_SECTIONS.MEMBERS:
        return <Members collective={collective} LoggedInUser={LoggedInUser} />;

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
            types={['TICKET']}
            tiers={this.state.tickets}
            collective={collective}
            currency={collective.currency}
            onChange={tickets => this.setState({ tickets, modified: true })}
            defaultType="TICKET"
          />
        );

      case EDIT_COLLECTIVE_SECTIONS.VIRTUAL_CARDS:
        return <VirtualCards collectiveId={collective.id} collectiveSlug={collective.slug} />;

      case 'gift-cards-create':
      case 'gift-cards-send':
        return (
          <Flex mt={3} flexDirection="column">
            <Container
              mb={5}
              pb={4}
              borderBottom="1px solid #E8E9EB"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
            >
              <Link route="editCollective" params={{ slug: collective.slug, section: 'gift-cards' }}>
                <StyledButton data-cy="back-to-giftcards-list">
                  <ArrowBack size="1em" />{' '}
                  <FormattedMessage id="virtualCards.returnToEdit" defaultMessage="Go back to gift cards list" />
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
            <CreateVirtualCardsForm
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
            {collective.type === CollectiveType.USER && <EditUserEmailForm />}
            {(collective.type === CollectiveType.COLLECTIVE || collective.type === CollectiveType.FUND) && (
              <EmptyBalance collective={collective} LoggedInUser={LoggedInUser} />
            )}
            <Archive collective={collective} />
            <Delete collective={collective} />
          </Box>
        );

      // Fiscal Hosts

      case EDIT_COLLECTIVE_SECTIONS.FISCAL_HOSTING:
        return <FiscalHosting collective={collective} LoggedInUser={LoggedInUser} />;

      case EDIT_COLLECTIVE_SECTIONS.HOST_PLAN:
        return <HostPlan collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.EXPENSES_PAYOUTS:
        return null;

      case EDIT_COLLECTIVE_SECTIONS.INVOICES_RECEIPTS:
        return <InvoicesReceipts collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.RECEIVING_MONEY:
        return <ReceivingMoney collective={collective} />;

      case EDIT_COLLECTIVE_SECTIONS.SENDING_MONEY:
        return <SendingMoney collective={collective} />;

      // 2FA
      case EDIT_COLLECTIVE_SECTIONS.TWO_FACTOR_AUTH:
        return <SetupTwoFactorAuth slug={collective.slug} userEmail={LoggedInUser.email} />;

      // Payment Receipts
      case EDIT_COLLECTIVE_SECTIONS.PAYMENT_RECEIPTS:
        return <PaymentReceipts collective={collective} />;

      // Policies and moderation
      case EDIT_COLLECTIVE_SECTIONS.POLICIES:
        return <Policies collective={collective} />;

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
            if (collective.type === CollectiveType.COLLECTIVE || collective.type === CollectiveType.EVENT) {
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

    const section = get(router, 'query.section', 'info');

    const isNew = !(collective && collective.id);
    let submitBtnMessageId = isNew ? 'event.create.btn' : 'save';
    if (['loading', 'saved'].includes(status)) {
      submitBtnMessageId = status;
    }

    const isEvent = collective.type === CollectiveType.EVENT;
    const currencyOptions = Currency.map(c => ({ value: c, label: c }));
    const submitBtnLabel = this.messages[submitBtnMessageId] && intl.formatMessage(this.messages[submitBtnMessageId]);
    const defaultStartsAt = new Date();
    const type = collective.type.toLowerCase();
    defaultStartsAt.setHours(19);
    defaultStartsAt.setMinutes(0);

    this.fields = {
      info: [
        {
          name: 'name',
          placeholder: '',
          maxLength: 255,
        },
        {
          name: 'company',
          placeholder: '',
          maxLength: 255,
          when: () => collective.type === 'USER',
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
          when: () => collective.type !== CollectiveType.EVENT,
        },
        {
          name: 'twitterHandle',
          type: 'text',
          pre: 'https://twitter.com/',
          maxLength: 255,
          placeholder: '',
          label: 'Twitter',
          when: () => collective.type !== CollectiveType.EVENT,
        },
        {
          name: 'githubHandle',
          type: 'text',
          pre: 'https://github.com/',
          maxLength: 39,
          placeholder: '',
          label: 'Github',
          when: () => collective.type !== CollectiveType.EVENT,
        },
        {
          name: 'website',
          type: 'text',
          maxLength: 255,
          placeholder: '',
          when: () => collective.type !== CollectiveType.EVENT,
        },
        {
          name: 'address',
          placeholder: '',
          maxLength: 255,
          type: 'textarea',
          when: () => collective.type !== CollectiveType.EVENT,
        },
        {
          name: 'country',
          type: 'country',
          placeholder: 'Select country',
          when: () => collective.type !== CollectiveType.EVENT,
        },
        {
          name: 'startsAt',
          type: 'datetime',
          placeholder: '',
          defaultValue: collective.startsAt || defaultStartsAt,
          validate: date => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return date.isAfter(yesterday);
          },
          when: () => collective.type === CollectiveType.EVENT,
        },
        {
          name: 'endsAt',
          type: 'datetime',
          options: { timezone: collective.timezone },
          placeholder: '',
          validate: date => {
            const yesterday = new Date(collective.startsAt || defaultStartsAt);
            yesterday.setDate(yesterday.getDate() - 1);
            return date.isAfter(yesterday);
          },
          when: () => collective.type === CollectiveType.EVENT,
        },
        {
          name: 'timezone',
          type: 'TimezonePicker',
          when: () => collective.type === CollectiveType.EVENT,
        },
        {
          name: 'location',
          placeholder: '',
          type: 'location',
          when: () => collective.type === CollectiveType.EVENT,
        },
        {
          name: 'currency',
          type: 'select',
          defaultValue: get(this.state.collective, 'currency'),
          options: currencyOptions,
          when: () => {
            if (get(this.state.collective, 'isHost')) {
              return false;
            }
            if ([CollectiveType.ORGANIZATION, CollectiveType.USER].includes(get(this.state.collective, 'type'))) {
              return true;
            }
            return false;
          },
        },
        ...this.getApplicableTaxesFields(),
        {
          name: 'tags',
          maxLength: 128,
          type: 'tags',
          placeholder: 'meetup, javascript',
          when: () => ![CollectiveType.EVENT, CollectiveType.PROJECT, CollectiveType.FUND].includes(collective.type),
        },
      ],
      'expenses-payouts': [
        {
          name: 'expensePolicy',
          type: 'textarea',
        },
      ],
      'fiscal-hosting': [
        {
          name: 'application',
          className: 'horizontal',
          type: 'switch',
          defaultValue: get(this.state.collective, 'settings.apply'),
          when: () => collective.isHost,
        },
        {
          name: 'hostFeePercent',
          type: 'number',
          className: 'horizontal',
          post: '%',
          defaultValue: get(this.state.collective, 'settings.hostFeePercent'),
          when: () => collective.isHost,
        },
        {
          name: 'tos',
          type: 'text',
          placeholder: '',
          className: 'horizontal',
          defaultValue: get(this.state.collective, 'settings.tos'),
          when: () => collective.isHost,
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
        return field;
      });
    });

    const fields = (this.fields[section] || []).filter(field => !field.when || field.when());

    return (
      <div className="EditCollectiveForm">
        <style jsx>
          {`
            :global(.field) {
              margin: 1rem;
            }
            :global(label) {
              min-width: 150px;
              display: inline-block;
              vertical-align: top;
            }
            :global(input),
            select,
            :global(textarea) {
              width: 300px;
              font-size: 1.5rem;
            }

            .EditCollectiveForm :global(textarea[name='expensePolicy']) {
              height: 30rem;
            }

            .actions {
              margin: 5rem auto 1rem;
              text-align: center;
            }
            .backToProfile {
              font-size: 1.3rem;
              margin: 1rem;
            }
          `}
        </style>
        <style global jsx>
          {`
            section#location {
              margin-top: 0;
            }

            .image .InputTypeDropzone {
              width: 100px;
            }

            .backgroundImage-dropzone {
              max-width: 500px;
              overflow: hidden;
            }

            .user .image-dropzone {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              overflow: hidden;
            }

            .menu {
              text-align: center;
              margin: 1rem 0 3rem 0;
            }
          `}
        </style>

        <Flex flexWrap="wrap">
          <Menu collective={collective} selectedSection={this.getMenuSelectedSection(section)} />
          <Flex flexDirection="column" css={{ flexGrow: 10, flexBasis: 600 }}>
            {section === EDIT_COLLECTIVE_SECTIONS.FISCAL_HOSTING && (
              <H3>
                <FormattedMessage id="editCollective.fiscalHosting" defaultMessage={'Fiscal Hosting'} />
              </H3>
            )}
            {section === EDIT_COLLECTIVE_SECTIONS.EXPENSES_PAYOUTS && (
              <H3>
                <FormattedMessage id="editCollective.expensesPayouts" defaultMessage={'Expenses & Payouts'} />
              </H3>
            )}
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
                      onChange={value => this.handleChange(field.name, value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {[EDIT_COLLECTIVE_SECTIONS.TIERS, EDIT_COLLECTIVE_SECTIONS.TICKETS].includes(section) &&
              this.renderSection(section)}

            {((fields && fields.length > 0) ||
              [EDIT_COLLECTIVE_SECTIONS.TIERS, EDIT_COLLECTIVE_SECTIONS.TICKETS].includes(section)) && (
              <div className="actions">
                <Button
                  bsStyle="primary"
                  type="submit"
                  onClick={this.handleSubmit}
                  disabled={status === 'loading' || !this.state.modified}
                >
                  {submitBtnLabel}
                </Button>

                <div className="backToProfile">
                  <Link
                    route={isEvent ? 'event' : 'collective'}
                    params={
                      isEvent
                        ? { parentCollectiveSlug: collective.parentCollective.slug, slug: collective.slug }
                        : { slug: collective.slug }
                    }
                  >
                    <FormattedMessage
                      id="collective.edit.backToProfile"
                      defaultMessage="view {type} page"
                      values={{ type }}
                    />
                  </Link>
                </div>
              </div>
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
