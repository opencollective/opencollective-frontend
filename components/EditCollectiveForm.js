import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { withRouter } from 'next/router';
import { ArrowBack } from '@styled-icons/material/ArrowBack';
import { get, set } from 'lodash';
import { Flex, Box } from '@rebass/grid';
import { Button } from 'react-bootstrap';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { isMemberOfTheEuropeanUnion } from '@opencollective/taxes';

import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';

import { defaultBackgroundImage, CollectiveType } from '../lib/constants/collectives';
import { parseToBoolean } from '../lib/utils';
import { VAT_OPTIONS } from '../lib/constants/vat';
import { Router } from '../server/pages';

import InputField from './InputField';
import EditTiers from './EditTiers';
import EditGoals from './EditGoals';
import EditHost from './EditHost';
import EditMembers from './EditMembers';
import EditPaymentMethods from './EditPaymentMethods';
import EditConnectedAccounts from './EditConnectedAccounts';
import EditWebhooks from './EditWebhooks';
import ExportData from './ExportData';
import Link from './Link';
import StyledButton from './StyledButton';
import EditVirtualCards from './EditVirtualCards';
import CreateVirtualCardsForm from './CreateVirtualCardsForm';

import EditCollectiveEmptyBalance from './EditCollectiveEmptyBalance';
import EditCollectiveArchive from './EditCollectiveArchive';
import EditCollectiveDelete from './EditCollectiveDelete';
import EditUserEmailForm from './EditUserEmailForm';
import Container from './Container';
import ExternalLink from './ExternalLink';

const selectedStyle = css`
  background-color: #eee;
  color: black;
`;

const MenuItem = styled(Link)`
  display: block;
  border-radius: 5px;
  padding: 5px 10px;
  color: #888;
  cursor: pointer;
  &:hover,
  a:hover {
    color: black;
  }
  ${({ selected }) => selected && selectedStyle};
`;

class EditCollectiveForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    status: PropTypes.string, // loading, saved
    onSubmit: PropTypes.func,
    LoggedInUser: PropTypes.object.isRequired,
    /** Provided by withRouter */
    router: PropTypes.object,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleObjectChange = this.handleObjectChange.bind(this);

    const collective = { ...(props.collective || {}) };
    collective.slug = collective.slug ? collective.slug.replace(/.*\//, '') : '';
    collective.tos = get(collective, 'settings.tos');
    collective.sendInvoiceByEmail = get(collective, 'settings.sendInvoiceByEmail');
    collective.application = get(collective, 'settings.apply');
    collective.markdown = get(collective, 'settings.markdown');

    this.state = {
      modified: false,
      section: 'info',
      collective,
      tiers: collective.tiers || [{}],
    };

    const isNewCollectivePage = parseToBoolean(process.env.NCP_IS_DEFAULT);
    this.showEditTiers = ['COLLECTIVE', 'EVENT'].includes(collective.type);
    this.showExpenses = collective.type === 'COLLECTIVE' || collective.isHost;
    this.showEditImages = !isNewCollectivePage || collective.type === CollectiveType.EVENT;
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
      'type.label': { id: 'collective.type.label', defaultMessage: 'type' },
      'name.label': { id: 'collective.name.label', defaultMessage: 'name' },
      'tags.label': { id: 'collective.tags.label', defaultMessage: 'Tags' },
      'tos.label': {
        id: 'collective.tos.label',
        defaultMessage: 'Terms of Service',
      },
      'tos.description': {
        id: 'collective.tos.description',
        defaultMessage: 'Link to the terms by which this host will collect money on behalf of their collectives',
      },
      'tags.description': {
        id: 'collective.tags.edit.description',
        defaultMessage: 'Make your Collective more discoverable (comma separated)',
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
        id: 'collective.amount.label',
        defaultMessage: 'amount',
      },
      'description.label': {
        id: 'collective.description.label',
        defaultMessage: 'Short description',
      },
      'expensePolicy.label': {
        id: 'collective.expensePolicy.label',
        defaultMessage: 'Collective expense policy',
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
        id: 'collective.startsAt.label',
        defaultMessage: 'start date and time',
      },
      'image.label': { id: 'collective.image.label', defaultMessage: 'Avatar' },
      'backgroundImage.label': {
        id: 'collective.backgroundImage.label',
        defaultMessage: 'Cover image',
      },
      'twitterHandle.label': {
        id: 'collective.twitterHandle.label',
        defaultMessage: 'Twitter',
      },
      'githubHandle.label': {
        id: 'collective.githubHandle.label',
        defaultMessage: 'Github',
      },
      'website.label': {
        id: 'collective.website.label',
        defaultMessage: 'Website',
      },
      'markdown.label': {
        id: 'collective.markdown.label',
        defaultMessage: 'Default editor',
      },
      'markdown.description': {
        id: 'collective.markdown.description',
        defaultMessage: 'Use markdown editor',
      },
      'sendInvoiceByEmail.label': {
        id: 'collective.sendInvoiceByEmail.label',
        defaultMessage: 'Invoices',
      },
      'sendInvoiceByEmail.description': {
        id: 'collective.sendInvoiceByEmail.description',
        defaultMessage: 'Include a PDF of receipts with your monthly report email',
      },
      'application.label': {
        id: 'collective.application.label',
        defaultMessage: 'Applications',
      },
      'application.description': {
        id: 'collective.application.description',
        defaultMessage: 'Enable new Collectives to apply to join your Fiscal Host',
      },
      'hostFeePercent.label': {
        id: 'collective.hostFeePercent.label',
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
    });

    collective.backgroundImage = collective.backgroundImage || defaultBackgroundImage[collective.type];

    window.OC = { collective, state: this.state };
  }

  componentDidMount() {
    const hash = window.location.hash;

    if (this.props.router.query.section) {
      this.setState({ section: this.props.router.query.section });
    } else if (hash) {
      // Legacy route converter - sections used to be assigned to URLs looking
      // like `/collective/edit#paymentMethods. We have migrated them to proper
      // routes (like `/collective/edit/payment-methods`) but we keep this
      // legacy redirect for old emails sent with the old URL scheme
      // Deprecated on 2018-12-08
      const legacySections = [
        'info',
        'images',
        'members',
        'payment-methods',
        'connected-accounts',
        'advanced',
        'expenses',
      ];
      let section = hash.substr(1);
      if (section === 'connectedAccounts') section = 'connected-accounts';
      else if (section === 'paymentMethods') section = 'payment-methods';
      if (legacySections.includes(section))
        Router.pushRoute('editCollective', {
          ...this.props.router.query,
          slug: this.props.collective.slug,
          section: section,
        });
    }
  }

  componentDidUpdate(oldProps) {
    const { collective, router } = this.props;
    if (oldProps.collective !== collective) {
      this.setState({
        collective: collective,
        tiers: collective.tiers,
      });
    } else if (oldProps.router.query.section !== router.query.section) {
      this.setState({ section: router.query.section });
    }
  }

  handleChange(fieldname, value) {
    const collective = { ...this.state.collective };

    // GrarphQL schema has address emebed within location
    // mutation expects { location: { address: '' } }
    if (['address', 'country'].includes(fieldname)) {
      collective.location = collective.location || {};
      collective.location[fieldname] = value;
    } else if (fieldname === 'VAT') {
      set(collective, 'settings.VAT.type', value);
    } else if (fieldname === 'VAT-number') {
      set(collective, 'settings.VAT.number', value);
    } else {
      collective[fieldname] = value;
    }
    this.setState({
      modified: true,
      collective: Object.assign({}, this.state.collective, collective),
    });
  }

  handleObjectChange(obj) {
    this.setState({ ...obj, modified: true });
    window.state = this.state;
  }

  async handleSubmit() {
    const collective = { ...this.state.collective, tiers: this.state.tiers };
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

  render() {
    const { collective, status, intl, LoggedInUser } = this.props;
    const isNew = !(collective && collective.id);
    let submitBtnMessageId = isNew ? 'event.create.btn' : 'save';
    if (['loading', 'saved'].includes(status)) {
      submitBtnMessageId = status;
    }

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
        },
        {
          name: 'twitterHandle',
          type: 'text',
          pre: 'https://twitter.com/',
          maxLength: 255,
          placeholder: '',
        },
        {
          name: 'githubHandle',
          type: 'text',
          pre: 'https://github.com/',
          maxLength: 39,
          placeholder: '',
        },
        {
          name: 'website',
          type: 'text',
          maxLength: 255,
          placeholder: '',
        },
        {
          name: 'address',
          placeholder: '',
          maxLength: 255,
          type: 'textarea',
        },
        // {
        //   name: 'location',
        //   placeholder: 'Search cities',
        //   type: 'location',
        //   options: {
        //     types: ['cities']location
        //   }
        // },
        {
          name: 'country',
          type: 'country',
          placeholder: 'Select country',
        },
        {
          name: 'VAT',
          type: 'select',
          defaultValue: get(this.state.collective, 'settings.VAT.type'),
          when: () => {
            if (this.state.collective.type !== 'COLLECTIVE') {
              return false;
            }

            const collectiveCountry = get(this.state.collective, 'location.country');
            const hostCountry = get(this.state.collective.host, 'location.country');
            return (
              (hostCountry && isMemberOfTheEuropeanUnion(hostCountry)) ||
              (collectiveCountry && isMemberOfTheEuropeanUnion(collectiveCountry))
            );
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
          defaultValue: get(this.state.collective, 'settings.VAT.number'),
          when: () => {
            if (this.state.collective.type === CollectiveType.COLLECTIVE) {
              // Collectives can set a VAT number if configured
              const collectiveCountry = get(this.state.collective, 'location.country');
              const hostCountry = get(this.state.collective.host, 'location.country');
              if (
                (hostCountry && isMemberOfTheEuropeanUnion(hostCountry)) ||
                (collectiveCountry && isMemberOfTheEuropeanUnion(collectiveCountry))
              ) {
                return get(this.state.collective, 'settings.VAT.type') === VAT_OPTIONS.OWN;
              }
            } else {
              // Organizations and users can set a VAT number if they're located in the EU
              const country = get(this.state.collective, 'location.country');
              return country && isMemberOfTheEuropeanUnion(country);
            }
          },
        },
        {
          name: 'tags',
          maxLength: 128,
          type: 'tags',
          placeholder: 'meetup, javascript',
        },
        {
          name: 'tos',
          type: 'text',
          placeholder: '',
          defaultValue: get(this.state.collective, 'settings.tos'),
          when: () => get(this.state.collective, 'isHost'),
        },
      ],
      images: [
        {
          name: 'image',
          type: 'dropzone',
          placeholder: 'Drop an image or click to upload',
          className: 'horizontal',
          when: () => this.state.section === 'images',
        },
        {
          name: 'backgroundImage',
          type: 'dropzone',
          placeholder: 'Drop an image or click to upload',
          className: 'horizontal',
          when: () => this.state.section === 'images',
        },
      ],
      expenses: [
        {
          name: 'expensePolicy',
          type: 'textarea',
          description: 'Protip: you can use markdown',
        },
      ],
      advanced: [
        {
          name: 'application',
          className: 'horizontal',
          type: 'switch',
          defaultValue: get(this.state.collective, 'settings.apply'),
          when: () => this.state.section === 'advanced' && collective.isHost,
        },
        {
          name: 'sendInvoiceByEmail',
          className: 'horizontal',
          type: 'switch',
          defaultValue: get(this.state.collective, 'settings.sendInvoiceByEmail'),
          when: () =>
            this.state.section === 'advanced' && (collective.type === 'USER' || collective.type === 'ORGANIZATION'),
        },
        {
          name: 'hostFeePercent',
          type: 'number',
          className: 'horizontal',
          post: '%',
          defaultValue: get(this.state.collective, 'settings.hostFeePercent'),
          when: () => this.state.section === 'advanced' && collective.isHost,
        },
        {
          name: 'markdown',
          className: 'horizontal',
          type: 'switch',
          defaultValue: get(this.state.collective, 'settings.editor') === 'markdown',
          when: () =>
            this.state.section === 'advanced' && (collective.type === 'USER' || collective.type === 'COLLECTIVE'),
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

    return (
      <div className="EditCollectiveForm">
        <style jsx>
          {`
            :global(.field) {
              margin: 1rem;
            }
            :global(label) {
              width: 150px;
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
          <Flex width={0.2} flexDirection="column" mr={4} mb={3} flexWrap="wrap" css={{ flexGrow: 1, minWidth: 175 }}>
            <MenuItem
              selected={this.state.section === 'info'}
              route="editCollective"
              params={{ slug: collective.slug, section: 'info' }}
              className="MenuItem info"
            >
              <FormattedMessage id="editCollective.menu.info" defaultMessage="Info" />
            </MenuItem>
            {this.showEditImages && (
              <MenuItem
                selected={this.state.section === 'images'}
                route="editCollective"
                params={{ slug: collective.slug, section: 'images' }}
                className="MenuItem images"
              >
                <FormattedMessage id="editCollective.menu." defaultMessage="Images" />
              </MenuItem>
            )}
            {this.showEditMembers && (
              <MenuItem
                selected={this.state.section === 'members'}
                route="editCollective"
                params={{ slug: collective.slug, section: 'members' }}
                className="MenuItem members"
              >
                <FormattedMessage id="editCollective.menu.members" defaultMessage="Core Contributors" />
              </MenuItem>
            )}
            {this.showEditGoals && (
              <MenuItem
                selected={this.state.section === 'goals'}
                route="editCollective"
                params={{ slug: collective.slug, section: 'goals' }}
                className="MenuItem goals"
              >
                <FormattedMessage id="editCollective.menu.goals" defaultMessage="Collective Goals" />
              </MenuItem>
            )}
            {this.showHost && (
              <MenuItem
                selected={this.state.section === 'host'}
                route="editCollective"
                params={{ slug: collective.slug, section: 'host' }}
                className="MenuItem host"
              >
                <FormattedMessage id="editCollective.menu.host" defaultMessage="Fiscal Host" />
              </MenuItem>
            )}
            {this.showEditTiers && (
              <MenuItem
                selected={this.state.section === 'tiers'}
                route="editCollective"
                params={{ slug: collective.slug, section: 'tiers' }}
                className="MenuItem tiers"
              >
                <FormattedMessage id="editCollective.menu.tiers" defaultMessage="Tiers" />
              </MenuItem>
            )}
            {this.showExpenses && (
              <MenuItem
                selected={this.state.section === 'expenses'}
                route="editCollective"
                params={{ slug: collective.slug, section: 'expenses' }}
                className="MenuItem expenses"
              >
                <FormattedMessage id="editCollective.menu.expenses" defaultMessage="Expenses Policy" />
              </MenuItem>
            )}
            {this.showPaymentMethods && (
              <MenuItem
                selected={this.state.section === 'payment-methods'}
                route="editCollective"
                params={{ slug: collective.slug, section: 'payment-methods' }}
                className="MenuItem paymentMethods"
              >
                <FormattedMessage id="editCollective.menu.paymentMethods" defaultMessage="Payment Methods" />
              </MenuItem>
            )}
            {this.showVirtualCards && (
              <MenuItem
                selected={['gift-cards-create', 'gift-cards-send', 'gift-cards'].includes(this.state.section)}
                route="editCollective"
                params={{ slug: collective.slug, section: 'gift-cards' }}
                className="MenuItem gift-cards"
              >
                <FormattedMessage id="editCollective.menu.virtualCards" defaultMessage="Gift Cards" />
              </MenuItem>
            )}
            <MenuItem
              selected={this.state.section === 'connected-accounts'}
              route="editCollective"
              params={{ slug: collective.slug, section: 'connected-accounts' }}
              className="MenuItem connectedAccounts"
            >
              <FormattedMessage id="editCollective.menu.connectedAccounts" defaultMessage="Connected Accounts" />
            </MenuItem>
            <MenuItem
              selected={this.state.section === 'webhooks'}
              route="editCollective"
              params={{ slug: collective.slug, section: 'webhooks' }}
              className="MenuItem webhooks"
            >
              <FormattedMessage id="editCollective.menu.webhooks" defaultMessage="Webhooks" />
            </MenuItem>
            {collective.type === 'COLLECTIVE' && (
              <MenuItem
                selected={this.state.section === 'export'}
                route="editCollective"
                params={{ slug: collective.slug, section: 'export' }}
                className="MenuItem export"
              >
                <FormattedMessage id="editCollective.menu.export" defaultMessage="Export" />
              </MenuItem>
            )}
            <MenuItem
              selected={this.state.section === 'advanced'}
              route="editCollective"
              params={{ slug: collective.slug, section: 'advanced' }}
              className="MenuItem advanced"
            >
              <FormattedMessage id="editCollective.menu.advanced" defaultMessage="Advanced" />
            </MenuItem>
          </Flex>

          <Flex flexDirection="column" css={{ flexGrow: 10, flexBasis: 600 }}>
            {this.state.section === 'advanced' && (
              <Box>
                {collective.type === 'USER' && <EditUserEmailForm />}
                {collective.type === 'COLLECTIVE' && (
                  <EditCollectiveEmptyBalance collective={collective} LoggedInUser={LoggedInUser} />
                )}
                {<EditCollectiveArchive collective={collective} />}
                {collective.type !== 'EVENT' && <EditCollectiveDelete collective={collective} />}
                <hr />
              </Box>
            )}
            <div className="FormInputs">
              {Object.keys(this.fields).map(
                section =>
                  this.state.section === section && (
                    <div className="inputs" key={section}>
                      {this.fields[section].map(
                        field =>
                          (!field.when || field.when()) && (
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
                          ),
                      )}
                    </div>
                  ),
              )}
              {this.state.section === 'members' && <EditMembers collective={collective} LoggedInUser={LoggedInUser} />}
              {this.state.section === 'webhooks' && (
                <EditWebhooks title="Edit webhooks" collectiveSlug={collective.slug} />
              )}
              {this.state.section === 'tiers' && (
                <EditTiers
                  title="Tiers"
                  types={['TIER', 'MEMBERSHIP', 'SERVICE', 'PRODUCT', 'DONATION']}
                  tiers={this.state.tiers}
                  collective={collective}
                  currency={collective.currency}
                  onChange={this.handleObjectChange}
                  defaultType={this.defaultTierType}
                />
              )}
              {this.state.section === 'goals' && <EditGoals collective={collective} currency={collective.currency} />}
              {this.state.section === 'host' && (
                <EditHost
                  collective={collective}
                  LoggedInUser={LoggedInUser}
                  editCollectiveMutation={this.props.onSubmit}
                />
              )}
              {this.state.section === 'payment-methods' && <EditPaymentMethods collectiveSlug={collective.slug} />}
              {this.state.section === 'gift-cards' && (
                <EditVirtualCards collectiveId={collective.id} collectiveSlug={collective.slug} />
              )}
              {['gift-cards-create', 'gift-cards-send'].includes(this.state.section) && (
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
                      <StyledButton>
                        <ArrowBack size="1em" />{' '}
                        <FormattedMessage id="virtualCards.returnToEdit" defaultMessage="Go back to gift cards list" />
                      </StyledButton>
                    </Link>

                    <ExternalLink
                      href="https://docs.opencollective.com/help/backers-and-sponsors/gift-cards#faq"
                      openInNewTab
                    >
                      <InfoCircle size="1em" />
                      &nbsp;
                      <FormattedMessage id="Giftcard.learnMore" defaultMessage="Learn more about Gift Cards" />
                    </ExternalLink>
                  </Container>
                  <CreateVirtualCardsForm
                    collectiveId={collective.id}
                    collectiveSlug={collective.slug}
                    currency={collective.currency}
                  />
                </Flex>
              )}

              {this.state.section === 'connected-accounts' && (
                <EditConnectedAccounts collective={collective} connectedAccounts={collective.connectedAccounts} />
              )}

              {this.state.section === 'export' && <ExportData collective={collective} />}
            </div>

            {[
              'export',
              'connected-accounts',
              'host',
              'gift-cards',
              'gift-cards-create',
              'gift-cards-send',
              'payment-methods',
              'webhooks',
              'members',
              'goals',
            ].indexOf(this.state.section) === -1 && (
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
                  <Link route="collective" params={{ slug: collective.slug }}>
                    <FormattedMessage
                      id="collective.edit.backToProfile"
                      defaultMessage="view {type} page"
                      values={{ type }}
                    />
                  </Link>
                </div>
              </div>
            )}
          </Flex>
        </Flex>
      </div>
    );
  }
}

export default withRouter(injectIntl(EditCollectiveForm));
